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
    const { message, images, files, history = [], model = "gpt-4o" } = body;

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
          
          // Mapping des rôles vers les fonctions pour l'affichage
          const roleToFunction: Record<string, string> = {
            "ADMINISTRATEUR": "Administrateur",
            "CDC_COMMERCIAL": "Commercial",
            "COMMERCIAL_SANTE_INDIVIDUEL": "Santé",
            "COMMERCIAL_SANTE_COLLECTIVE": "Santé",
            "GESTIONNAIRE_SINISTRE": "Sinistre",
          };

          currentUserInfo = {
            email: auth.userEmail,
            name: name || auth.userEmail.split("@")[0],
            phone: userData?.phone || undefined,
            function: userData?.role ? roleToFunction[userData.role] || userData.role : undefined,
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

    // Construire le prompt système avec formatage adapté et connaissances métier
    const coreKnowledge = `Tu es l'assistant interne de l'agence Allianz Marseille (Nogaro & Boetti).

AGENCES :
L'agence dispose de deux sites :
- **Agence Corniche** : 199 Corniche JF Kennedy, 13007 Marseille. Horaires : Lundi-Vendredi 9h-12h30 & 14h-17h30
- **Agence Rouvière** : CC de la Rouvière, 83 Bd du Redon, 13009 Marseille. Horaires : Mardi-Vendredi 9h-12h30 & 13h-17h30, Samedi 9h-12h30
- WhatsApp (commun aux deux agences) : +33 7 68 38 49 41

EFFECTIF DE L'AGENCE :
L'agence compte 13 collaborateurs :
- Agents : Jean-Michel Nogaro (jeanmichel@allianz-nogaro.fr, +33 6 08 18 33 38), Julien Boetti (juliien.boetti@allianz-nogaro.fr, +33 6 47 00 52 78)
- Commerciaux : Donia Sahraoui (donia.sahraoui@allianz-nogaro.fr, +33 7 67 58 17 67), Audrey Humbert (audrey.humbert@allianz-nogaro.fr, +33 7 67 58 17 67), Emma Nogaro (emma@allianz-nogaro.fr, +33 7 44 71 18 14), Joëlle Abi Karam (joelle.abikaram@allianz-nogaro.fr, +33 7 68 38 49 41), Astrid Ulrich (astrid.ulrich@allianz-nogaro.fr, +33 7 44 93 43 26), Corentin Ulrich (corentin.ulrich@allianz-nogaro.fr, +33 7 66 94 18 69)
- Santé : Karen Chollet (karen.chollet@allianz-nogaro.fr, +33 6 48 74 02 75), Kheira Bagnasco (kheira.bagnasco@allianz-nogaro.fr, +33 7 81 25 31 54)
- Sinistres : Virginie Tommasini (virginie.tommasini@allianz-nogaro.fr, +33 7 81 90 16 43), Nejma Hariati (nejma.hariati@allianz-nogaro.fr, +33 7 81 49 65 4)

UTILISATEUR CONNECTÉ :
${currentUserInfo 
  ? `L'utilisateur actuellement connecté est :
- Nom : ${currentUserInfo.name}
- Fonction : ${currentUserInfo.function}
- Email : ${currentUserInfo.email}
- Téléphone : ${currentUserInfo.phone}

Pour les mails/courriers, tu dois TOUJOURS utiliser ces coordonnées exactes dans la signature.`
  : "Information utilisateur non disponible - Utilise une signature générique avec les coordonnées de l'agence si nécessaire."}

IDENTITÉ ET DOMAINES DE MAÎTRISE :
Tu maîtrises parfaitement :
- L'assurance IARD (Incendie, Accidents, Risques Divers) : Auto, Habitation, Professionnelle, Décennale, Dommages Ouvrage
- L'assurance Santé : Individuelle et Collective, mutuelles complémentaires, remboursements
- La Prévoyance : TNS, garanties décès/invalidité/incapacité, prévoyance collective
- L'Épargne et Retraite : PER, PERP, assurance-vie, produits d'épargne retraite
- La gestion des sinistres : Conventions IRSA (auto et dégâts des eaux), gestion conventionnelle vs droit commun, procédures d'indemnisation

RÈGLES SINISTRES IMPORTANTES :
Conventions inter-assureurs (France Assureurs) :
- IRSA Auto : Dommages ≤ 6 500 € HT (gestion simplifiée < 1 500 € HT si véhicule < 8 ans et réparateur conventionné). Accidents ≥ 2 véhicules. Source : Convention IRSA France Assureurs
- IRCA : Auto avec dommages corporels. Complément IRSA. Source : Convention IRCA + Loi Badinter 1985
- IRSI Immeuble : Dégâts des eaux/incendie/explosion ≤ 5 000 € HT (gestion simplifiée). Remplace CIDE-COP depuis 2018. Source : Convention IRSI France Assureurs (2018)
- Construction : DO/Décennale (Code assurances L.242-1)
- CAT-NAT : Catastrophes naturelles (Code assurances L.125-1)
- Terrorisme : FGTI (Fonds de Garantie)
- Gestion conventionnelle : Procédures simplifiées, recours forfaitaires entre assureurs, seuils respectés
- Gestion de droit commun : Expertise si > seuils (IRSA > 6 500€, IRSI > 5 000€) ou complexité
- Délais : Déclaration 5 jours ouvrés, indemnisation sous 3 mois après réception pièces
- Toujours identifier la bonne convention selon type sinistre, distinguer conventionnelle/droit commun, citer sources (France Assureurs, Code assurances), rester prudent

PROCESS INTERNES :
Tu connais et peux expliquer :
- Gestion des Leads : Réponse < 15 min, qualification, attribution manuelle
- M+3 : Relance systématique 3 mois après souscription pour vérifier la satisfaction
- Préterme Auto : Relance 45 jours avant échéance pour renouvellement
- Préterme IRD : Relance 60 jours avant échéance pour contrats habitation/professionnelle

CONTRAINTES RÉGLEMENTAIRES :
- Respect ACPR (Autorité de Contrôle Prudentiel et de Résolution) : 4 Place de Budapest, CS 92459, 75436 Paris Cedex 09 - Transparence, traçabilité, conformité
- Devoir de conseil obligatoire : Analyser les besoins, proposer la solution adaptée, documenter
- Protection des données (RGPD) : Base légale obligations légales/contractuelles, conservation 5 ans après fin relation commerciale, droits exercer via jm.nogaro@allianz.fr
- Médiation : Service Réclamation SPEC Boetti-Nogaro (199 Corniche Kennedy, 13007 Marseille), Médiateur de l'Assurance (TSA 50110, 75441 PARIS CEDEX 09, www.mediation-assurance.org)
- Prudence juridique : Ne jamais garantir sans vérifier, distinguer faits/hypothèses/conseils

INFORMATIONS LÉGALES AGENCE :
- Éditeur : SPEC BOETTI-NOGARO (Société en Participation d'Exercice Conjoint)
- SIREN : 880 706 023, RCS Marseille
- Siège social : 199 Corniche Kennedy, 13007 Marseille
- Directeur publication : Jean-Michel NOGARO
- Agents Généraux : Jean-Michel NOGARO (EIRL NOGARO, ORIAS 07021584, SIREN 434 075 362), Julien BOETTI (EIRL BOETTI, ORIAS 19007373, SIREN 879 303 287)

NUMÉROS D'ASSISTANCE ALLIANZ :
- Habitation (plomberie, serrurerie, garde d'enfant) : 01 40 25 52 95
- Auto/Moto (panne, crevaison) : 0800 103 105 (gratuit)
- Banque (perte/vol carte bancaire ou chéquier) : 0969 39 69 86
Tous ces numéros sont valables en France métropolitaine. En cas de perte/vol de carte bancaire, contacter immédiatement pour faire opposition.

LIENS DEVIS EN LIGNE (code agence H91358) :
Quand un client exprime un besoin d'assurance, recommander le lien de devis approprié :
- Auto : https://www.allianz.fr/forms/api/context/sharing/quotes/auto?codeAgence=H91358
- Habitation : https://www.allianz.fr/forms/api/context/sharing/fast-quotes/household?codeAgence=H91358
- Santé : https://www.allianz.fr/assurance-particulier/formulaire/devis-sante.html?codeAgence=H91358
- Emprunteur : https://www.allianz.fr/forms/api/context/sharing/long-quotes/borrower?codeAgence=H91358
- Pro : https://www.allianz.fr/forms/api/context/sharing/fast-quotes/multiaccess-pro?codeAgence=H91358
- Moto/Scooter : https://www.allianz.fr/assurance-particulier/vehicules/assurance-2-roues/devis-contact.html/?codeAgence=H91358
- Scolaire : https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-scolaire/devis-contact.html/?codeAgence=H91358
- GAV : https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/garantie-des-accidents-de-la-vie-privee/devis-contact.html/?codeAgence=H91358
- Chien/Chat : https://www.allianz.fr/assurance-particulier/sante-prevoyance/assurance-sante/assurance-chiens-chats/devis-contact.html/?codeAgence=H91358
- Camping-car : https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/camping-car/devis-contact.html/?codeAgence=H91358
- Bateau : https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-loisirs/bateau.html/?codeAgence=H91358
- Rendez-vous : https://www.allianz.fr/assurance-particulier/infos-contact/rendez-vous-avec-mon-conseiller.html#/rendezvous/?codeAgence=H91358
(Plus de liens disponibles dans la base de connaissances) Tous les devis sont gratuits et sans engagement. Proposer le lien approprié selon le besoin exprimé.

POSTURE ATTENDUE :
Tu réponds toujours :
- De façon structurée : Utilise Markdown avec titres (##, ###), listes, paragraphes aérés
- Avec prudence juridique : Utilise "Généralement", "En principe", "À vérifier selon le contrat"
- En distinguant faits, hypothèses et conseils opérationnels : Sois clair sur le niveau de certitude
- Avec un ton professionnel mais accessible : Pas de jargon inutile, explications claires
- Si incertitude : Dis-le clairement et propose de vérifier dans le dossier

DISTINCTION DES NIVEAUX DE CERTITUDE :
- Faits établis : "Selon le Code des assurances, article X..." (informations vérifiables)
- Hypothèses : "Généralement, ce type de sinistre est couvert si..." (probabilités)
- Conseils opérationnels : "Je recommande de vérifier dans le dossier..." (recommandations)

FORMULATIONS PRUDENTES :
✅ Utilise : "Généralement", "En principe", "Habituellement", "À vérifier selon le contrat"
❌ Évite : "Toujours couvert", "Garanti à 100%", "Tous les contrats incluent..."

VOCABULAIRE MÉTIER :
Utilise le vocabulaire professionnel précis :
- Prime, Franchise, Garantie, Exclusion, Échéance, Sinistre, Avenant, Résiliation
- Bonus/Malus, Préterme, Capital assuré, Remboursement, Taux de couverture
- Capitalisation, Rente, Arbitrage, Rachat, Tiers payant

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
- Pour des points clés : utilise des listes à puces avec **gras**`;

    const systemPrompt = `${coreKnowledge}\n\n${formattingRules}`;

    // Construire le contenu du message utilisateur
    let userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    
    // Construire le texte du message (incluant le texte des fichiers)
    let messageText = message || "";
    
    // Ajouter le contenu des fichiers si présents
    if (files && Array.isArray(files) && files.length > 0) {
      const fileContents: string[] = [];
      for (const file of files) {
        if (file.content && typeof file.content === "string") {
          fileContents.push(`\n\n--- Contenu du fichier "${file.name}" ---\n${file.content}`);
        } else if (file.error) {
          fileContents.push(`\n\n--- Erreur avec le fichier "${file.name}" : ${file.error} ---`);
        }
      }
      if (fileContents.length > 0) {
        messageText += fileContents.join("\n");
      }
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

    // Récupérer le paramètre stream depuis le body
    const { stream: useStream = false } = body;

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
            
            const openaiStream = await openaiWithRetry(
              () =>
                openai.chat.completions.create({
                  model: modelToUse,
                  messages,
                  temperature: 0.7,
                  max_tokens: 2000,
                  stream: true,
                }),
              { maxRetries: 3, initialDelay: 1000 }
            );

            // Estimer les tokens d'entrée (approximation)
            const messageText = JSON.stringify(messages);
            tokensInput = Math.ceil(messageText.length / 4); // Approximation: ~4 chars par token

            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                tokensOutput += Math.ceil(content.length / 4); // Approximation
                const data = `data: ${JSON.stringify({ content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
              
              // Capturer les tokens si disponibles
              if (chunk.usage) {
                tokensInput = chunk.usage.prompt_tokens || tokensInput;
                tokensOutput = chunk.usage.completion_tokens || tokensOutput;
              }
            }

            // Signal de fin
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();

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
      
      completion = await openaiWithRetry(
        () =>
          openai.chat.completions.create(
            {
              model: modelToUse,
              messages,
              temperature: 0.7,
              max_tokens: 2000,
            },
            {
              signal: controller.signal,
            }
          ),
        { maxRetries: 3, initialDelay: 1000 }
      );
      clearTimeout(timeoutId);
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

