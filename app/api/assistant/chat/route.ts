/**
 * API Route pour le chatbot
 * POST : Chat avec OpenAI
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import OpenAI from "openai";
import { checkRateLimit, determineRequestType } from "@/lib/assistant/rate-limiting";
import { checkBudgetLimit } from "@/lib/assistant/budget-alerts";
import { openaiWithRetry } from "@/lib/assistant/retry";
import { logUsage } from "@/lib/assistant/monitoring";
import { logAction } from "@/lib/assistant/audit";
import { parseFile } from "@/lib/assistant/file-parsers";
// import { enrichMessagesWithKnowledge } from "@/lib/assistant/knowledge-loader"; // Plus utilisé, la logique métier est dans le system prompt

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/assistant/chat
 * Génère une réponse OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Vérifier la clé API OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY manquante dans les variables d'environnement");
      return NextResponse.json(
        {
          error: "Configuration API manquante",
          details:
            "La clé API OpenAI n'est pas configurée. Vérifiez que OPENAI_API_KEY est définie dans .env.local",
        },
        { status: 500 }
      );
    }

    // Récupérer les paramètres depuis le body
    const body = await request.json();
    const { message, images, files, history = [], model = "gpt-4o", uiEvent, context } = body;

    // Le message peut être vide si seulement des images ou fichiers sont envoyés
    if (!message && (!images || images.length === 0) && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: "Message, image ou fichier manquant" },
        { status: 400 }
      );
    }

    // Vérifier le rate limiting
    const hasImages = images && Array.isArray(images) && images.length > 0;
    const hasFiles = files && Array.isArray(files) && files.length > 0;
    const requestType = determineRequestType(hasImages, hasFiles);
    
    const rateLimitResult = await checkRateLimit(auth.userId!, requestType);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Limite de requêtes atteinte",
          details: `Vous avez atteint la limite de ${rateLimitResult.limit} requêtes ${requestType} par jour. Réessayez après ${rateLimitResult.resetAt.toLocaleString("fr-FR")}.`,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            limit: rateLimitResult.limit,
            resetAt: rateLimitResult.resetAt,
          },
        },
        { status: 429 }
      );
    }

    // Vérifier le budget
    const budgetCheck = await checkBudgetLimit();
    if (!budgetCheck.allowed) {
      return NextResponse.json(
        {
          error: "Budget mensuel dépassé",
          details: budgetCheck.reason,
        },
        { status: 429 }
      );
    }

    // Récupérer les données de l'utilisateur connecté pour la signature depuis Firestore
    let currentUserInfo: {
      email: string;
      name?: string;
      phone?: string;
      function?: string;
    } | null = null;

    try {
      if (auth.userId && auth.userEmail) {
        const { adminDb } = await import("@/lib/firebase/admin-config");
        const userDoc = await adminDb.collection("users").doc(auth.userId).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const firstName = userData?.firstName || "";
          const lastName = userData?.lastName || "";
          const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || undefined;
          
          // Mapping des rôles vers les fonctions pour l'affichage (rôles réels dans l'agence)
          // Ne pas utiliser "Administrateur" dans les signatures, c'est un rôle technique
          const email = auth.userEmail?.toLowerCase() || "";
          let functionTitle: string | undefined;
          
          // Détection par email pour les rôles spécifiques
          if (email.includes("jeanmichel") || email.includes("julien") || email.includes("juliien")) {
            functionTitle = "Agent général";
          } else if (email.includes("karen") || email.includes("kheira")) {
            functionTitle = "Spécialiste santé";
          } else if (email.includes("virginie") || email.includes("nejma")) {
            functionTitle = "Gestionnaire sinistres";
          } else {
            // Par défaut, utiliser le mapping par rôle technique
            const roleToFunction: Record<string, string> = {
              "ADMINISTRATEUR": "Agent général", // Ne pas afficher "Administrateur"
              "CDC_COMMERCIAL": "Chargé(e) de clientèle",
              "COMMERCIAL_SANTE_INDIVIDUEL": "Spécialiste santé",
              "COMMERCIAL_SANTE_COLLECTIVE": "Spécialiste santé",
              "GESTIONNAIRE_SINISTRE": "Gestionnaire sinistres",
            };
            functionTitle = userData?.role ? roleToFunction[userData.role] || "Chargé(e) de clientèle" : "Chargé(e) de clientèle";
          }

          currentUserInfo = {
            email: auth.userEmail,
            name: name || auth.userEmail.split("@")[0],
            phone: userData?.phone || undefined,
            function: functionTitle,
          };
        }
      }
    } catch (error) {
      console.warn("Erreur lors de la récupération des informations utilisateur:", error);
      // En cas d'erreur, utiliser au moins l'email
      if (auth.userEmail) {
        currentUserInfo = {
          email: auth.userEmail,
          name: auth.userEmail.split("@")[0],
        };
      }
    }

    // Détecter si l'utilisateur demande un mail ou une lettre formelle
    const messageContent = message?.toLowerCase() || "";
    const isFormalWriting = 
      messageContent.includes("mail") || 
      messageContent.includes("email") || 
      messageContent.includes("lettre") || 
      messageContent.includes("courrier") ||
      messageContent.includes("rédige") && (messageContent.includes("formel") || messageContent.includes("professionnel"));

    // Détecter si c'est une requête OCR Lagon (automatique sur upload d'image)
    // Note: hasImages est déjà défini ligne 58, on le réutilise
    // OCR activé automatiquement si : image présente ET (message vide OU message mentionne client/lagon/fiche)
    const isOCRRequest = 
      hasImages && (
        !message || 
        messageContent.includes("client") || 
        messageContent.includes("lagon") ||
        messageContent.includes("fiche")
      );

    // Charger la base de connaissances selon le contexte
    const { loadKnowledgeForContext, loadSegmentationKnowledge } = await import("@/lib/assistant/knowledge-loader");
    
    let baseKnowledge: string;
    if (context && (context.caseType === "client" || context.clientType)) {
      // Utiliser la segmentation si contexte fourni
      baseKnowledge = loadSegmentationKnowledge(context as {
        caseType?: "general" | "client" | null;
        clientType?: "particulier" | "tns" | "entreprise" | null;
        csp?: string | null;
        ageBand?: string | null;
        companyBand?: { effectifBand: string | null; caBand: string | null } | null;
        dirigeantStatut?: "tns" | "assimile_salarie" | null;
      });
    } else {
      // Sinon, utiliser le chargement classique
      baseKnowledge = loadKnowledgeForContext(undefined, undefined);
    }

    // Construire le contexte complet pour la détection (message actuel + historique récent)
    const conversationContext = [
      messageContent,
      ...history.slice(-3).map((msg: { role: string; content?: string }) => msg.content || "").filter(Boolean)
    ].join(" ");

    // Les connaissances pertinentes sont déjà incluses dans baseKnowledge
    // via loadKnowledgeForContext ou loadSegmentationKnowledge
    const relevantKnowledge = "";

    // Construire le prompt système avec formatage adapté et connaissances métier
    const coreKnowledge = `Tu es l'assistant interne de l'agence Allianz Marseille (Nogaro & Boetti).

${baseKnowledge}${relevantKnowledge || ""}

⚠️⚠️⚠️ INSTRUCTION CRITIQUE - UTILISATION DE LA BASE DE CONNAISSANCES ⚠️⚠️⚠️

TU DOIS ABSOLUMENT utiliser les informations de la base de connaissances ci-dessus pour répondre aux questions de l'utilisateur.

RÈGLES STRICTES ET OBLIGATOIRES :
1. **PRIORITÉ ABSOLUE** : Si une information existe dans la base de connaissances ci-dessus, tu DOIS l'utiliser en priorité. Ne jamais donner une réponse générique si l'information précise existe dans la base.
2. **RÉFÉRENCER SYSTÉMATIQUEMENT** : Dans CHAQUE réponse, fais référence à la base de connaissances quand c'est pertinent. Utilise des phrases comme :
   - "Selon notre base de connaissances..."
   - "D'après notre documentation..."
   - "Selon notre processus [nom]..."
   - "Conformément à nos procédures..."
3. **CITER LA SOURCE** : Quand tu utilises une information de la base de connaissances, mentionne-le clairement avec le nom du processus, du produit ou de la procédure concernée.
4. **NE PAS INVENTER** : Ne donne jamais une réponse générique si l'information précise existe dans la base de connaissances. Si tu n'es pas sûr, dis-le clairement.
5. **EXEMPLE CONCRET** : Si l'utilisateur demande "qu'est-ce que M+3 ?", tu DOIS utiliser la définition exacte de la base de connaissances (process/m-plus-3.md), pas une réponse générique. Commence par "Selon notre processus M+3..." ou "D'après notre documentation M+3..."
6. **STRUCTURER AVEC LA BASE** : Utilise la structure et les informations de la base de connaissances pour organiser tes réponses. Si la base mentionne des étapes, des procédures, des arguments de vente, utilise-les tels quels.

Si tu ne trouves pas l'information dans la base de connaissances, alors seulement tu peux donner une réponse générale, mais en précisant clairement : "Cette information n'est pas spécifique à notre agence. Voici une réponse générale..."

UTILISATEUR CONNECTÉ :
${currentUserInfo 
  ? `L'utilisateur actuellement connecté est :
- Nom : ${currentUserInfo.name}
- Fonction : ${currentUserInfo.function}
- Email : ${currentUserInfo.email}
- Téléphone : ${currentUserInfo.phone}

Pour les mails/courriers, tu dois TOUJOURS utiliser ces coordonnées exactes dans la signature.`
  : "Information utilisateur non disponible - Utilise une signature générique avec les coordonnées de l'agence si nécessaire."}

DOMAINES DE MAÎTRISE :
Tu maîtrises parfaitement :
- L'assurance IARD (Incendie, Accidents, Risques Divers) : Auto, Habitation, Professionnelle, Décennale, Dommages Ouvrage
- L'assurance VTM (Véhicules Terrestres à Moteur) Allianz : Permis de conduire (15 catégories depuis 01/01/2024), bonus-malus (CRM), contrôle technique, carte grise/immatriculation, documents précontractuels (DIN, étude de besoins), résiliation/suspension, transfert bonus-malus, BCT. Source : RES41187 V07/25
- L'assurance Santé : Individuelle et Collective, mutuelles complémentaires, remboursements
- La Prévoyance : TNS, garanties décès/invalidité/incapacité, prévoyance collective
- L'Épargne et Retraite : PER, PERP, assurance-vie, produits d'épargne retraite
- La gestion des sinistres : Conventions IRSA (auto et dégâts des eaux), gestion conventionnelle vs droit commun, procédures d'indemnisation
- Les conventions collectives : Tu peux récupérer la convention collective applicable à une entreprise via son code APE/NAF, SIREN ou SIRET. Utilise la fonction get_convention_collective quand l'utilisateur demande quelle convention collective s'applique ou mentionne un code APE/SIREN/SIRET.
- La recherche d'entreprises : Tu PEUX et DOIS rechercher des entreprises par leur nom, raison sociale ou dénomination. Utilise TOUJOURS la fonction search_entreprise_pappers quand l'utilisateur demande de trouver une entreprise, un SIREN ou un SIRET à partir d'un nom. Ne dis JAMAIS que tu ne peux pas rechercher par nom - tu as cette capacité via Pappers.

RÈGLE IMPORTANTE - SOURCING OBLIGATOIRE :
Quand tu donnes une information technique, réglementaire ou juridique, tu DOIS citer la source avec un lien cliquable :
- Format : "Selon [Nom de la source](URL_du_site)"
- Exemples :
  * "Selon [Ameli](https://www.ameli.fr/assure/remboursements), le taux de remboursement..."
  * "D'après le [Code des assurances - Article L113-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006073112), l'assuré doit..."
  * "Selon la [Convention IRSA](https://www.franceassureurs.fr), le plafond est de 6 500 € HT..."
- Sources disponibles dans le registre (90-compliance.md)
- Si tu n'as pas le lien exact, indique au moins la source : "Selon le Code des assurances, article L113-2..."

Si tu ne connais pas la réponse, dis-le clairement avec un ton professionnel mais accessible.`;

    const formattingRules = isFormalWriting
      ? `RÈGLES DE FORMATAGE POUR MAILS ET LETTRES :
- Adopte un style épuré, direct et efficace
- Utilise des paragraphes courts et aérés
- Évite les émojis
- Structure avec des sauts de ligne clairs
- Reste concis et professionnel
- INCLUS UNE SIGNATURE en fin de mail avec les coordonnées de l'utilisateur connecté
  * Format : "Cordialement,\n\n[Prénom Nom de l'utilisateur connecté]\n[Fonction]\nAgence Allianz Marseille (Nogaro & Boetti)\nTél. : [Téléphone]\nEmail : [Email]"
  * Utilise TOUJOURS l'utilisateur connecté comme auteur (ses coordonnées sont fournies ci-dessus)
  * Si l'utilisateur demande explicitement d'utiliser une autre personne, respecte sa demande mais c'est exceptionnel`
      : `RÈGLES DE FORMATAGE OBLIGATOIRES :
- Utilise le format Markdown pour structurer tes réponses
- Ajoute des titres avec ## ou ### pour organiser les sections importantes
- Utilise des sauts de ligne doubles entre les paragraphes pour aérer
- Insère des émojis pertinents pour rendre la lecture agréable (📋 pour listes, ✅ pour validation, 💡 pour conseils, ⚠️ pour avertissements, etc.)
- Utilise des listes à puces ou numérotées pour les énumérations
- Mets en **gras** les points importants
- Utilise des espaces pour créer une lecture fluide

SOURCING DES INFORMATIONS (OBLIGATOIRE) :
- Quand tu cites une règle, un taux, un délai, une procédure : INCLUS LA SOURCE avec lien
- Format : "Selon [Nom Source](URL_complète), ..."
- Exemples :
  * Santé : "Selon [Ameli](https://www.ameli.fr/assure/remboursements/rembourse/tableau-recapitulatif-taux-remboursement), le taux..."
  * Sinistres : "D'après la [Convention IRSA France Assureurs](https://www.franceassureurs.fr), le plafond..."
  * Juridique : "Selon le [Code des assurances - Article L113-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006073112), l'assuré doit..."
  * ACPR : "Selon l'[ACPR](https://acpr.banque-france.fr), le devoir de conseil..."
- Si lien non disponible, cite au minimum : "Selon [Source], article X..."
- Les sources sont dans le registre (docs/knowledge/90-compliance.md)

POUR LES MAILS ET COURRIERS :
- Si l'utilisateur demande de rédiger un mail/courrier/email, inclus toujours une signature en fin de document
- Signature format :
  Cordialement,
  
  [Prénom Nom de l'utilisateur connecté]
  [Fonction de l'utilisateur connecté]
  Agence Allianz Marseille (Nogaro & Boetti)
  Tél. : [Téléphone de l'utilisateur connecté]
  Email : [Email de l'utilisateur connecté]
- Utilise TOUJOURS l'utilisateur connecté comme auteur (ses coordonnées sont fournies dans la section UTILISATEUR CONNECTÉ ci-dessus)
- Si l'utilisateur demande explicitement d'utiliser une autre personne, respecte sa demande mais c'est exceptionnel

EXEMPLES DE FORMATAGE :
- Pour une explication : commence par un titre ## et utilise des paragraphes aérés
- Pour des étapes : utilise une liste numérotée avec des émojis
- Pour des points clés : utilise des listes à puces avec **gras**
- Pour des sources : utilise le format [Nom](URL) systématiquement

DÉTECTION DE SEGMENT (OBLIGATOIRE) :
Tu DOIS TOUJOURS détecter le segment du client pour adapter ton analyse. Si le contexte client est fourni, utilise-le directement. Sinon, détecte le segment selon ces règles :

**Règles de détection :**
- Si "étudiant" ou mention d'études => segment **etudiant**
- Si "salarié" + "cadre" ou "ingénieur" ou "manager" => segment **salarie-cadre**
- Si "salarié" + non-cadre ou "employé" => segment **salarie-non-cadre**
- Si "fonctionnaire" ou "agent public" => segment **fonctionnaire**
- Si "auto-entrepreneur" ou "micro-entreprise" => segment **auto-entrepreneur**
- Si "TNS" ou "travailleur non salarié" => demander : artisan/commerçant/prof lib + ensuite segment correspondant
  - "artisan" => segment **tns-artisan**
  - "commerçant" => segment **tns-commercant**
  - "profession libérale" ou "prof lib" => segment **tns-prof-liberale**
- Si "entreprise" ou "société" ou "SARL" ou "SAS" => segment **entreprise**
  - Demander CA + effectif + statut dirigeant (TNS/assimile salarié)

**Une fois le segment détecté :**
1. Charge automatiquement les connaissances du segment correspondant
2. Utilise la grille d'analyse standard pour structurer ta réponse
3. Pose les questions clés du segment (voir base de connaissances)
4. Propose les recommandations TOP 3 du segment

CAS SPÉCIAUX :
- Professionnels (TNS + auto-entrepreneur) : Double bloc obligatoire (besoins personnels + besoins professionnels)
- Auto-entrepreneur : Version simplifiée (pas de RC pro si activité non réglementée, mais PJ/Cyber si activité digitale)
- Entreprises : Triple bloc obligatoire (entreprise socle + salariés collectif + dirigeant selon statut)

GRILLE D'ANALYSE STANDARD (si contexte client fourni OU si tu détectes un besoin client) :
Quand tu analyses un besoin client (caseType="client" OU si l'utilisateur parle d'un client/dossier), tu DOIS structurer ta réponse selon cette grille OBLIGATOIRE :

## 📊 Analyse

### Segment détecté
- Type : [particulier / TNS / entreprise]
- CSP/Segment : [étudiant / salarié-cadre / salarié-non-cadre / fonctionnaire / auto-entrepreneur / TNS-artisan / TNS-commerçant / TNS-prof-libérale / entreprise-socle / etc.]
- Bande d'âge : [si particulier, ex: 26-35 ans]
- Taille entreprise : [si entreprise, ex: CA 1M-5M, effectif 10-49]

### Hypothèses
- [Hypothèse 1 basée sur le segment et les informations disponibles]
- [Hypothèse 2]
- [Hypothèse 3]

### Manques critiques (max 5)
- [Information manquante critique 1]
- [Information manquante critique 2]
- [Information manquante critique 3]
- [Information manquante critique 4]
- [Information manquante critique 5]

### Questions suivantes (max 7)
1. [Question principale pour compléter l'analyse]
2. [Question secondaire]
3. [Question secondaire]
4. [Question secondaire]
5. [Question secondaire]
6. [Question secondaire]
7. [Question secondaire]

## 🎯 Recommandations (TOP 3)

### 1) [Titre recommandation 1]
**Pourquoi :** [Explication basée sur le segment et les besoins identifiés]
**Red flags :** [Points de vigilance spécifiques]

### 2) [Titre recommandation 2]
**Pourquoi :** [Explication basée sur le segment et les besoins identifiés]
**Red flags :** [Points de vigilance spécifiques]

### 3) [Titre recommandation 3]
**Pourquoi :** [Explication basée sur le segment et les besoins identifiés]
**Red flags :** [Points de vigilance spécifiques]

## ⚠️ Points de vigilance
- [Point de vigilance 1]
- [Point de vigilance 2]
- [Point de vigilance 3]

## ✅ Prochaine action
Checklist 3 à 6 étapes :
1. [Action 1]
2. [Action 2]
3. [Action 3]
4. [Action 4]
5. [Action 5]
6. [Action 6]

## 📚 Sources
- [Label source](url)
- [Label source](url)

IMPORTANT :
- Si info manquante => ne pas conclure. L'IA doit demander.
- Toujours 1 question principale par message quand on est en phase de cadrage.
- Utiliser les informations de la base de connaissances segmentée pour remplir cette grille.
- Citer explicitement les sources utilisées depuis la base de connaissances.
- Pour les professionnels (TNS/auto-entrepreneur) : TOUJOURS structurer en 2 blocs (besoins personnels + besoins professionnels).
- Pour les entreprises : TOUJOURS structurer en 3 blocs (entreprise socle + salariés collectif + dirigeant selon statut).

⚠️⚠️⚠️ FONCTIONS DISPONIBLES - UTILISATION OBLIGATOIRE ⚠️⚠️⚠️

Tu as accès à plusieurs fonctions pour récupérer des informations sur les entreprises. Tu DOIS les utiliser systématiquement quand c'est pertinent.

1. **search_entreprise_pappers** (Pappers) - RECHERCHE PAR NOM - PRIORITÉ ABSOLUE :
   ⚠️ RÈGLE CRITIQUE : Si l'utilisateur demande de trouver une entreprise, un SIREN ou un SIRET à partir d'un NOM, raison sociale ou dénomination, tu DOIS TOUJOURS utiliser cette fonction. Ne dis JAMAIS que tu ne peux pas rechercher par nom - tu as cette capacité !
   
   **Exemples d'utilisation OBLIGATOIRE :**
   - 'trouve la SCI 13007 à Marseille' => utilise search_entreprise_pappers avec q='SCI 13007 Marseille'
   - 'recherche l'entreprise X' => utilise search_entreprise_pappers avec q='X'
   - 'donne-moi le SIREN de Y' => utilise search_entreprise_pappers avec q='Y'
   - 'je cherche le SIRET de Z' => utilise search_entreprise_pappers avec q='Z'
   - L'utilisateur mentionne un nom d'entreprise sans SIREN/SIRET => utilise search_entreprise_pappers
   
   La fonction retourne une liste d'entreprises avec SIREN, SIRET, adresse, etc. Présente les résultats de manière claire.

2. **get_entreprise_pappers** (Pappers) - INFORMATIONS COMPLÈTES :
   Utilise cette fonction pour récupérer TOUTES les informations complètes d'une entreprise quand tu as son SIREN ou SIRET. Cette fonction retourne : informations légales, dirigeants, bilans, établissements, bénéficiaires effectifs, etc.
   
   **Utilise-la :**
   - Après une recherche réussie avec search_entreprise_pappers (pour obtenir les infos complètes)
   - Si l'utilisateur fournit directement un SIREN/SIRET
   - Si l'utilisateur demande des informations détaillées sur une entreprise

3. **get_convention_collective** (Societe.com) - CONVENTION COLLECTIVE :
   Utilise cette fonction quand l'utilisateur demande quelle convention collective s'applique à une entreprise, mentionne un code APE/NAF, un SIREN ou un SIRET. La fonction retourne le code APE, l'IDCC (numéro de convention collective) et son libellé.

**STRATÉGIE D'UTILISATION OBLIGATOIRE :**
1. **Recherche par nom** : Si l'utilisateur mentionne un nom d'entreprise sans SIREN/SIRET => utilise IMMÉDIATEMENT search_entreprise_pappers
2. **Infos complètes** : Après une recherche ou si SIREN/SIRET fourni => utilise get_entreprise_pappers pour les détails
3. **Convention collective** : Si demandée ou pertinente => utilise get_convention_collective
4. **Combinaison** : Tu peux enchaîner : recherche → infos complètes → convention collective

**NE JAMAIS DIRE :**
- ❌ "Je ne peux pas rechercher par nom"
- ❌ "Je n'ai pas accès à cette information"
- ❌ "Consultez un annuaire externe"

**TOUJOURS FAIRE :**
- ✅ Utiliser search_entreprise_pappers dès qu'un nom d'entreprise est mentionné
- ✅ Présenter les résultats de manière claire et structurée
- ✅ Proposer de récupérer les infos complètes si plusieurs résultats`;

    // Intégrer le prompt basé sur uiEvent
    let buttonPromptSection = "";
    
    // Cas unique : uiEvent="start" (bouton "Bonjour" cliqué)
    if (uiEvent === "start") {
      const { getStartPrompt } = await import("@/lib/assistant/main-button-prompts");
      const startPrompt = getStartPrompt();
      if (startPrompt) {
        buttonPromptSection = `\n\n--- COMPORTEMENT INITIAL (START) ---\n\n${startPrompt}\n\n---\n\n`;
      }
    }
    
    // Ajouter le prompt OCR si c'est une requête OCR Lagon avec images
    let ocrPromptSection = "";
    if (isOCRRequest && hasImages) {
      ocrPromptSection = `\n\n--- MODE OCR LAGON ACTIVÉ ---\n\n⚠️⚠️⚠️ INSTRUCTION IMPÉRATIVE ⚠️⚠️⚠️

L'utilisateur t'a envoyé une capture d'écran de la fiche client Lagon.
Tu DOIS extraire les informations suivantes et les retourner dans un bloc JSON strict.

INSTRUCTIONS IMPÉRATIVES :
1. Analyse l'image avec précision
2. Extrais TOUTES les informations visibles
3. Retourne un JSON dans ce format EXACT, entre balises <LAGON_OCR_JSON> et </LAGON_OCR_JSON>

STRUCTURE ATTENDUE :
<LAGON_OCR_JSON>
{
  "typeClient": "particulier" | "tns" | "entreprise",
  "nom": "string ou null",
  "prenom": "string ou null",
  "raisonSociale": "string ou null (si entreprise)",
  "adresse": "string ou null",
  "codePostal": "string ou null",
  "ville": "string ou null",
  "telephone": "string ou null",
  "mobile": "string ou null",
  "email": "string ou null",
  "situationPro": "string ou null",
  "siret": "string ou null",
  "siren": "string ou null",
  "apeNaf": "string ou null",
  "contactDirigeant": "string ou null",
  "personneAContacter": "string ou null",
  "pointDeVente": "string ou null",
  "chargeDeClientele": "string ou null"
}
</LAGON_OCR_JSON>

APRÈS LE JSON :
Affiche un résumé court et lisible des données extraites (3-4 lignes max).
Puis demande : "Les informations sont correctes ? ✅ Confirmer / ✏️ Corriger"

---\n\n`;
    }
    
    // Parser les fichiers uploadés si présents
    let parsedFilesContent = "";
    if (files && Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        try {
          // Si le fichier a déjà un contenu parsé (parsing réussi côté client), l'utiliser
          if (file.content && typeof file.content === "string" && file.content.trim()) {
            parsedFilesContent += `\n\n--- FICHIER: ${file.name || "Sans nom"} (${file.type || "Type inconnu"}) ---\n${file.content}\n`;
          } 
          // Si le fichier a des données brutes (base64) mais pas de contenu, parser côté serveur
          else if (file.data && typeof file.data === "string") {
            try {
              // Convertir base64 en Buffer
              const base64Data = file.data.replace(/^data:.*,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              const parsedContent = await parseFile(buffer, file.name);
              parsedFilesContent += `\n\n--- FICHIER: ${file.name || "Sans nom"} (${file.type || "Type inconnu"}) - Parsé côté serveur ---\n${parsedContent}\n`;
            } catch (parseError) {
              console.error(`Erreur lors du parsing serveur du fichier ${file.name}:`, parseError);
              parsedFilesContent += `\n\n--- ERREUR lors du parsing serveur du fichier "${file.name || "Sans nom"}" : ${parseError instanceof Error ? parseError.message : "Erreur inconnue"} ---\n`;
              if (file.error) {
                parsedFilesContent += `Erreur parsing client: ${file.error}\n`;
              }
            }
          }
          // Si le fichier a une erreur de parsing côté client et pas de données brutes, noter l'erreur
          else if (file.error) {
            parsedFilesContent += `\n\n--- ERREUR avec le fichier "${file.name || "Sans nom"}" : ${file.error} ---\n`;
            parsedFilesContent += `Note: Le parsing de ce fichier a échoué côté client et aucune donnée brute n'est disponible pour parsing serveur.\n`;
          }
          // Si le fichier n'a ni contenu ni erreur ni données, c'est qu'il n'a pas été traité
          else {
            parsedFilesContent += `\n\n--- FICHIER: ${file.name || "Sans nom"} (${file.type || "Type inconnu"}) ---\n`;
            parsedFilesContent += `Note: Ce fichier n'a pas pu être parsé. Type: ${file.type || "inconnu"}\n`;
          }
        } catch (error) {
          console.error(`Erreur lors du traitement du fichier ${file.name}:`, error);
          parsedFilesContent += `\n\n--- ERREUR avec le fichier "${file.name || "Sans nom"}" : ${error instanceof Error ? error.message : "Erreur inconnue"} ---\n`;
        }
      }
    }
    
    // Ajouter le prompt de gestion des fichiers
    const fileManagementPrompt = parsedFilesContent ? `
GESTION DES FICHIERS UPLOADÉS :

L'utilisateur a uploadé des fichiers qui ont été parsés et intégrés dans le contexte.

QUAND UN FICHIER EST PRÉSENT :
1. Commence par analyser le contenu du fichier
2. Extrais les informations pertinentes selon le rôle
3. Structure ta réponse en incluant l'analyse du fichier
4. Si c'est un tableau/classement : produis une analyse chiffrée
5. Si c'est un document : extrais les points clés
6. Si c'est une image : décris ce que tu vois et extrais les données

FICHIERS ACTUELLEMENT SUPPORTÉS :
- Images (PNG, JPG, WebP) : Vision + OCR
- Excel/CSV : Parsing tableaux
- PDF : Extraction texte + OCR
- Documents (DOCX, TXT)

FICHIERS UPLOADÉS PAR L'UTILISATEUR :

${parsedFilesContent}

Analyse ces fichiers selon le rôle choisi.
` : `
GESTION DES FICHIERS UPLOADÉS :

L'utilisateur peut uploader des fichiers (images, Excel, PDF, etc.).
Ces fichiers sont automatiquement parsés et leur contenu est intégré dans le contexte.

QUAND UN FICHIER EST PRÉSENT :
1. Commence par analyser le contenu du fichier
2. Extrais les informations pertinentes selon le rôle
3. Structure ta réponse en incluant l'analyse du fichier
4. Si c'est un tableau/classement : produis une analyse chiffrée
5. Si c'est un document : extrais les points clés
6. Si c'est une image : décris ce que tu vois et extrais les données

FICHIERS ACTUELLEMENT SUPPORTÉS :
- Images (PNG, JPG, WebP) : Vision + OCR
- Excel/CSV : Parsing tableaux
- PDF : Extraction texte + OCR
- Documents (DOCX, TXT)
`;
    
    const systemPrompt = `${coreKnowledge}${buttonPromptSection}${ocrPromptSection}${fileManagementPrompt}${formattingRules}`;

    // Construire le contenu du message utilisateur
    let userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    
    // Construire le texte du message (incluant le texte des fichiers)
    let messageText = message || "";
    
    // Ajouter le contenu des fichiers si présents
    // Note: Le contenu parsé est déjà intégré dans parsedFilesContent et ajouté au systemPrompt
    // On peut aussi l'ajouter au message utilisateur pour référence
    if (parsedFilesContent) {
      messageText += `\n\n[Fichiers uploadés analysés - voir contexte système pour détails]`;
    }
    
    // Ajouter le texte si présent
    if (messageText.trim()) {
      userContent.push({
        type: "text",
        text: messageText,
      });
    }

    // Ajouter les images si présentes
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imageBase64 of images) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: imageBase64,
          },
        });
      }
    }

    // Construire le tableau de messages avec l'historique
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Ajouter l'historique de conversation si présent
    if (Array.isArray(history) && history.length > 0) {
      // Convertir l'historique au format OpenAI (limiter à 20 messages pour éviter la surcharge)
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content || "",
          });
        }
      }
    }

    // Ajouter le message utilisateur actuel
    messages.push({
      role: "user",
      content: userContent.length > 0 ? userContent : message,
    });

    // Enrichir les messages avec les connaissances pertinentes de la base de connaissance (optionnel, car le prompt système est déjà enrichi)
    const userMessageText = typeof message === "string" ? message : "";
    // Note: enrichMessagesWithKnowledge n'est plus utilisé car la logique métier est directement dans le system prompt via getSystemPromptForButton
    const enrichedMessages = messages;

    // Récupérer le paramètre stream depuis le body
    const { stream: useStream = false } = body;

    // Définir les fonctions disponibles pour le bot
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "get_convention_collective",
          description: "Récupère la convention collective applicable à une entreprise selon son code APE/NAF, SIREN ou SIRET. Utilise cette fonction quand l'utilisateur demande quelle convention collective s'applique à une entreprise ou mentionne un code APE, SIREN ou SIRET.",
          parameters: {
            type: "object",
            properties: {
              codeApe: {
                type: "string",
                description: "Code APE/NAF de l'entreprise (ex: '6201Z', '4711D'). Optionnel si SIREN/SIRET fourni.",
              },
              siren: {
                type: "string",
                description: "SIREN de l'entreprise (9 chiffres). Optionnel si code APE fourni.",
              },
              siret: {
                type: "string",
                description: "SIRET de l'entreprise (14 chiffres). Optionnel si SIREN ou code APE fourni.",
              },
            },
            required: [],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "search_entreprise_pappers",
          description: "⚠️ FONCTION PRIORITAIRE : Recherche une entreprise par son nom, raison sociale ou dénomination via l'API Pappers. UTILISE CETTE FONCTION OBLIGATOIREMENT quand l'utilisateur : demande de trouver une entreprise, recherche un SIREN/SIRET à partir d'un nom, mentionne un nom d'entreprise sans SIREN/SIRET, ou dit 'trouve', 'recherche', 'donne-moi le SIREN/SIRET de'. Ne dis JAMAIS que tu ne peux pas rechercher par nom - cette fonction le permet !",
          parameters: {
            type: "object",
            properties: {
              q: {
                type: "string",
                description: "Terme de recherche : nom de l'entreprise, raison sociale, dénomination. Peut inclure la ville pour affiner (ex: 'SCI 13007 Marseille'). Extrais le nom de l'entreprise de la demande de l'utilisateur.",
              },
              par_page: {
                type: "number",
                description: "Nombre de résultats par page (défaut: 20, max: 100).",
              },
              page: {
                type: "number",
                description: "Numéro de page (défaut: 1).",
              },
            },
            required: ["q"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "get_entreprise_pappers",
          description: "Récupère TOUTES les informations complètes d'une entreprise via l'API Pappers : informations légales, dirigeants, bilans, établissements, bénéficiaires effectifs, etc. Utilise cette fonction quand tu as un SIREN ou SIRET et que l'utilisateur demande des informations détaillées sur l'entreprise.",
          parameters: {
            type: "object",
            properties: {
              siren: {
                type: "string",
                description: "SIREN de l'entreprise (9 chiffres). Prioritaire si fourni.",
              },
              siret: {
                type: "string",
                description: "SIRET de l'entreprise (14 chiffres). Utilisé si SIREN non fourni (le SIREN sera extrait automatiquement).",
              },
            },
            required: [],
          },
        },
      },
    ];

    // Fonction pour exécuter les appels de fonction
    const executeFunctionCall = async (functionName: string, args: any) => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (request.headers.get("host") ? `https://${request.headers.get("host")}` : "http://localhost:3000");
      const authHeader = request.headers.get("Authorization") || "";

      if (functionName === "get_convention_collective") {
        try {
          const response = await fetch(`${baseUrl}/api/conventions-collectives`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              codeApe: args.codeApe,
              siren: args.siren,
              siret: args.siret,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            return JSON.stringify({ error: error.error || "Erreur lors de la récupération de la convention collective", details: error.details });
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error) {
          return JSON.stringify({ error: "Erreur lors de l'appel API", details: error instanceof Error ? error.message : "Erreur inconnue" });
        }
      }

      if (functionName === "search_entreprise_pappers") {
        try {
          const response = await fetch(`${baseUrl}/api/pappers/recherche`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              q: args.q,
              par_page: args.par_page || 20,
              page: args.page || 1,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            return JSON.stringify({ error: error.error || "Erreur lors de la recherche d'entreprise", details: error.details });
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error) {
          return JSON.stringify({ error: "Erreur lors de l'appel API Pappers", details: error instanceof Error ? error.message : "Erreur inconnue" });
        }
      }

      if (functionName === "get_entreprise_pappers") {
        try {
          const response = await fetch(`${baseUrl}/api/pappers/entreprise`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              siren: args.siren,
              siret: args.siret,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            return JSON.stringify({ error: error.error || "Erreur lors de la récupération des informations de l'entreprise", details: error.details });
          }

          const data = await response.json();
          return JSON.stringify(data);
        } catch (error) {
          return JSON.stringify({ error: "Erreur lors de l'appel API Pappers", details: error instanceof Error ? error.message : "Erreur inconnue" });
        }
      }

      return JSON.stringify({ error: "Fonction inconnue" });
    };

    // Si streaming demandé, utiliser Server-Sent Events
    if (useStream) {
      const encoder = new TextEncoder();
      const startTime = Date.now();
      let tokensInput = 0;
      let tokensOutput = 0;
      let hasError = false;
      let errorMessage: string | undefined;

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Utiliser gpt-4o si des images sont présentes (support vision)
            const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
            
            // Gérer les function calls en boucle
            let currentMessages = [...enrichedMessages];
            let maxIterations = 5; // Limiter les itérations pour éviter les boucles infinies
            let iteration = 0;

            while (iteration < maxIterations) {
              const openaiStream = await openaiWithRetry(
                () =>
                  openai.chat.completions.create({
                    model: modelToUse,
                    messages: currentMessages,
                    temperature: 0.7,
                    max_tokens: 2000,
                    tools: tools.length > 0 ? tools : undefined,
                    stream: true,
                  }),
                { maxRetries: 3, initialDelay: 1000 }
              );

              let functionCallName: string | null = null;
              let functionCallArgsText: string = "";
              let functionCallId: string | null = null;
              let hasFunctionCall = false;
              let streamedContent = "";

              for await (const chunk of openaiStream) {
                const delta = chunk.choices[0]?.delta;
                
                // Capturer les tokens si disponibles
                if (chunk.usage) {
                  tokensInput = chunk.usage.prompt_tokens || tokensInput;
                  tokensOutput = chunk.usage.completion_tokens || tokensOutput;
                }
                
                // Vérifier si c'est un function call
                if (delta?.tool_calls) {
                  hasFunctionCall = true;
                  const toolCall = delta.tool_calls[0];
                  if (toolCall?.id) {
                    functionCallId = toolCall.id;
                  }
                  if (toolCall?.function?.name) {
                    functionCallName = toolCall.function.name;
                  }
                  if (toolCall?.function?.arguments) {
                    // Accumuler les arguments (peuvent arriver en plusieurs chunks)
                    functionCallArgsText += toolCall.function.arguments;
                  }
                } else if (delta?.content) {
                  // Contenu normal à streamer
                  streamedContent += delta.content;
                  tokensOutput += Math.ceil(delta.content.length / 4);
                  const data = `data: ${JSON.stringify({ content: delta.content })}\n\n`;
                  controller.enqueue(encoder.encode(data));
                }
              }

              // Si function call détecté, l'exécuter et continuer
              if (hasFunctionCall && functionCallName && functionCallArgsText) {
                try {
                  const functionArgs = JSON.parse(functionCallArgsText);
                  const functionResult = await executeFunctionCall(functionCallName, functionArgs);
                  
                  // Ajouter les messages de function call et résultat
                  const toolCallId = functionCallId || `call_${Date.now()}`;
                  currentMessages.push({
                    role: "assistant",
                    content: null,
                    tool_calls: [{
                      id: toolCallId,
                      type: "function",
                      function: {
                        name: functionCallName,
                        arguments: functionCallArgsText,
                      },
                    }],
                  });
                  currentMessages.push({
                    role: "tool",
                    tool_call_id: toolCallId,
                    content: functionResult,
                  });
                  
                  iteration++;
                  continue; // Relancer une nouvelle requête avec le résultat
                } catch (parseError) {
                  console.error("Erreur parsing function args:", parseError);
                  // En cas d'erreur, continuer avec le contenu streamé si disponible
                  if (!streamedContent) {
                    // Pas de contenu, on continue quand même
                    iteration++;
                    continue;
                  }
                }
              }

              // Pas de function call ou erreur, fin du streaming
              break;
            }

            // Fermer le stream proprement
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();

            // Estimer les tokens d'entrée (approximation si pas déjà calculé)
            if (tokensInput === 0) {
              const messageText = JSON.stringify(currentMessages);
              tokensInput = Math.ceil(messageText.length / 4);
            }

            // Logger l'utilisation (en arrière-plan, ne pas bloquer)
            const duration = Date.now() - startTime;
            logUsage({
              userId: auth.userId!,
              endpoint: "/api/assistant/chat",
              tokensInput,
              tokensOutput,
              model: modelToUse,
              hasImages: hasImages,
              hasFiles: hasFiles,
              requestType,
              duration,
              success: true,
            }).catch((err) => console.error("Erreur logging usage:", err));

            // Logger l'action d'audit
            logAction(
              auth.userId!,
              "message_sent",
              { fileType: hasFiles ? "file" : hasImages ? "image" : undefined },
              { ip: request.headers.get("x-forwarded-for") || undefined }
            ).catch((err) => console.error("Erreur logging audit:", err));
          } catch (error) {
            hasError = true;
            errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
            const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();

            // Logger l'erreur
            const duration = Date.now() - startTime;
            logUsage({
              userId: auth.userId!,
              endpoint: "/api/assistant/chat",
              tokensInput: 0,
              tokensOutput: 0,
              model: images && images.length > 0 ? "gpt-4o" : model,
              hasImages: hasImages,
              hasFiles: hasFiles,
              requestType,
              duration,
              success: false,
              error: errorMessage,
            }).catch((err) => console.error("Erreur logging usage:", err));
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Mode non-streaming (comportement par défaut) avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 secondes
    const startTime = Date.now();

    let completion;
    try {
      // Utiliser gpt-4o si des images sont présentes (support vision)
      const modelToUse = images && images.length > 0 ? "gpt-4o" : model;
      
      // Gérer les function calls en boucle (mode non-streaming)
      let currentMessages = [...enrichedMessages];
      let maxIterations = 5;
      let iteration = 0;

      while (iteration < maxIterations) {
        completion = await openaiWithRetry(
          () =>
            openai.chat.completions.create(
              {
                model: modelToUse,
                messages: currentMessages,
                temperature: 0.7,
                max_tokens: 2000,
                tools: tools.length > 0 ? tools : undefined,
              },
              {
                signal: controller.signal,
              }
            ),
          { maxRetries: 3, initialDelay: 1000 }
        );
        clearTimeout(timeoutId);

        const message = completion.choices[0]?.message;
        
        // Vérifier si c'est un function call
        if (message?.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          
          // Vérifier que c'est bien un function call (pas un custom tool call)
          if (toolCall.type === "function" && "function" in toolCall) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments || "{}");
            
            // Ajouter le message assistant avec tool call
            currentMessages.push({
              role: "assistant",
              content: null,
              tool_calls: message.tool_calls.map((tc: any) => ({
                id: tc.id,
                type: tc.type,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments,
                },
              })),
            });

            // Exécuter la fonction
            const functionResult = await executeFunctionCall(functionName, functionArgs);
            
            // Ajouter le résultat
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: functionResult,
            });
            
            iteration++;
            continue; // Relancer une nouvelle requête
          }
        }

        // Pas de function call, on a la réponse finale
        break;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === "AbortError") {
        const duration = Date.now() - startTime;
        // Logger le timeout
        logUsage({
          userId: auth.userId!,
          endpoint: "/api/assistant/chat",
          tokensInput: 0,
          tokensOutput: 0,
          model: images && images.length > 0 ? "gpt-4o" : model,
          hasImages: hasImages,
          hasFiles: hasFiles,
          requestType,
          duration,
          success: false,
          error: "Timeout après 60 secondes",
        }).catch((err) => console.error("Erreur logging usage:", err));

        return NextResponse.json(
          {
            error: "La requête a pris trop de temps. Réessayez.",
            details: "Timeout après 60 secondes",
          },
          { status: 408 }
        );
      }
      throw error;
    }

    if (!completion) {
      return NextResponse.json(
        {
          error: "Erreur lors de la génération de la réponse",
          details: "Aucune réponse générée",
        },
        { status: 500 }
      );
    }

    const response = completion.choices[0]?.message?.content || "";
    const duration = Date.now() - startTime;

    // Logger l'utilisation
    const usage = completion.usage;
    logUsage({
      userId: auth.userId!,
      endpoint: "/api/assistant/chat",
      tokensInput: usage?.prompt_tokens || 0,
      tokensOutput: usage?.completion_tokens || 0,
      model: images && images.length > 0 ? "gpt-4o" : model,
      hasImages: hasImages,
      hasFiles: hasFiles,
      requestType,
      duration,
      success: true,
    }).catch((err) => console.error("Erreur logging usage:", err));

    return NextResponse.json({
      success: true,
      response,
      rateLimit: {
        remaining: rateLimitResult.remaining - 1, // -1 car on a déjà incrémenté
        limit: rateLimitResult.limit,
        resetAt: rateLimitResult.resetAt,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/assistant/chat:", error);

    // Gestion des erreurs spécifiques OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Trop de requêtes. Réessayez dans quelques instants.",
            details: "Rate limit atteint",
          },
          { status: 429 }
        );
      } else if (error.status === 401) {
        return NextResponse.json(
          {
            error: "Erreur de configuration API. Contactez l'administrateur.",
          },
          { status: 401 }
        );
      } else if (error.status === 400) {
        // Vérifier si c'est une erreur de contexte trop long
        const errorMessage = error.message?.toLowerCase() || "";
        if (errorMessage.includes("context_length") || errorMessage.includes("token")) {
          return NextResponse.json(
            {
              error: "Conversation trop longue. Veuillez créer une nouvelle conversation.",
              details: "Limite de tokens dépassée",
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la génération de la réponse",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

