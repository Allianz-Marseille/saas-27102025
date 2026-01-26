# Chatbot IA M+3 - Spécifications complètes

## 🎯 Objectif

Développer un **chatbot IA M+3** pour la gestion du workflow du processus M+3. Le chatbot assiste les commerciaux dans l'analyse des fiches clients Lagon et la génération de diagnostics structurés selon les 3 objectifs du processus M+3.

---

## 📋 Qu'est-ce que le M+3 ?

Le **M+3** (Mois + 3) est un processus de suivi client systématique qui consiste à recontacter les nouveaux clients **environ 3 mois après la souscription** de leur premier contrat d'assurance.

### Pourquoi 3 mois ?

- **Période d'adaptation** : Le client a eu le temps de vivre avec son contrat
- **Moment optimal** : Assez tôt pour maintenir l'engagement, assez tard pour avoir du recul
- **Opportunité commerciale** : Le client est encore "chaud" et réceptif

### Critères d'éligibilité

Un client est éligible au M+3 si :
- ✅ Il a souscrit un contrat **Affaire Nouvelle (AN)** il y a **3 mois** (± 1 semaine)
- ✅ Aucun M+3 n'a encore été réalisé pour ce contrat
- ✅ Le contrat est toujours actif

**Exemple** :
- Contrat souscrit le **15 janvier 2025** (date d'effet)
- M+3 à réaliser autour du **15 avril 2025** (± 1 semaine)
- Fenêtre optimale : **8 avril - 22 avril 2025**

---

## 🎯 Les 3 objectifs du processus M+3

### Objectif 1 : Qualité du dossier (CRM)

**But** : S'assurer que le dossier est complet, fiable et exploitable.

#### Pour un **Particulier** — À valider :

| Champ | Description |
|-------|-------------|
| **Adresse** | Adresse complète et à jour |
| **Téléphone** | Numéro de téléphone valide |
| **Email** | Adresse email active |
| **Situation matrimoniale** | Célibataire, Marié(e), Pacsé(e), Divorcé(e), Veuf(ve) |
| **Situation professionnelle** | Employé, Retraité, Sans emploi, Étudiant, etc. |

#### Pour un **Professionnel (TNS)** — En plus :

| Champ | Description |
|-------|-------------|
| **SIRET / Code NAF** | Identifiants légaux de l'activité |
| **Activité exacte** | Description précise de l'activité |
| **Chiffre d'affaires** | CA annuel |
| **Effectif** | Nombre de salariés |

#### Pour une **Entreprise** — En plus :

| Champ | Description |
|-------|-------------|
| **SIRET / Code NAF** | Identifiants légaux |
| **Activité exacte** | Description précise de l'activité |
| **Chiffre d'affaires** | CA annuel |
| **Effectif** | Nombre de salariés |
| **Contact assurances** | Personne qui gère les assurances côté entreprise |

#### ⚠️ Point obligatoire

- Vérifier / corriger : **bonne agence** (Corniche ou Rouvière)
- Vérifier / corriger : **bon chargé de clientèle**

**Résultat attendu** : Le client perçoit une démarche sérieuse ("dossier carré").

---

### Objectif 2 : Finaliser les contrats en cours

**But** : Sécuriser la relation contractuelle et la conformité du dossier.

#### Checklist à contrôler :

- [ ] **Signatures** :
  - [ ] Dispositions particulières (DP) signées
  - [ ] Devis / projets signés

- [ ] **Pièces au dossier** :
  - [ ] Carte grise (pour auto/moto)
  - [ ] Permis de conduire
  - [ ] CNI / Passeport
  - [ ] Bail (pour habitation)
  - [ ] Justificatifs divers selon le risque

**Résultat attendu** : Contrat(s) finalisé(s) et dossier complet.

---

### Objectif 3 : Bilan global (développement commercial)

**But** : Identifier le potentiel commercial et les opportunités de multi-équipement.

#### Phrase déclencheur

> "Nous sommes à présent votre assureur pour l'auto (par exemple). Qui sont vos autres assureurs ?"

#### Déroulement

1. **Laisser le client parler**
   - Prendre des notes
   - Ne pas interrompre
   - Poser des questions ouvertes

2. **Identifier les contrats**
   - **Chez nous** : Liste des contrats déjà souscrits
   - **Ailleurs** : Liste des contrats chez la concurrence

3. **Repérer les manques logiques**
   
   Analyser selon :
   - Sa situation familiale (conjoint, enfants, dépendants)
   - Son métier/activité (risques professionnels)
   - Ses biens (véhicules, logement, biens mobiliers)
   - Ses besoins de protection (santé, prévoyance, retraite)

#### Résultat attendu

- ✅ Inventaire complet "chez nous / ailleurs"
- ✅ Identification des contrats manquants
- ✅ Définition des prochaines actions :
  - Devis à envoyer
  - Rendez-vous à planifier
  - Éléments à transmettre
  - Relances programmées

---

## 🔑 Architecture du chatbot IA

### ⚠️ POINT CRITIQUE : Workflow en 2 étapes

**Étape 1 - Identification client** :
- Upload screenshot fiche Lagon
- OCR → Extraction des **infos client uniquement** (nom, adresse, situation, SIRET/NAF si pro, etc.)
- Validation Objectif 1 (qualité CRM)

**Étape 2 - Saisie contrats + Diagnostic** :
- Le commercial **renseigne manuellement les contrats** (auto, MRH, RC Pro, santé, etc.)
- Le chatbot IA analyse : **infos client extraites + contrats renseignés manuellement**
- Identification des obligations légales (selon contrats renseignés)
- Calcul des scores par domaine
- Génération des Top 3 prioritaires + secondaires
- Questions de confirmation (3 max)
- Génération de recommandations structurées
- Création d'acte M+3

### Pipeline de traitement

```
1. Input : Screenshot fiche Lagon (image) [MÉTHODE PRINCIPALE]
   OU Copier-coller texte (optionnel)
   ↓
2. OCR sur image → texte brut (réutiliser OCR existant)
   ↓
3. Extraction structurée (regex + parsing par labels Lagon)
   → INFOS CLIENT UNIQUEMENT (nom, adresse, situation, etc.)
   ↓
4. Validation déterministe
   - Objectif 1 : qualité CRM (checks + missing + warnings)
   - Objectif 2 : signatures + pièces (checks + missing)
   ↓
5. SAISIE MANUELLE DES CONTRATS par le commercial
   → Interface dédiée pour renseigner : auto, MRH, RC Pro, santé, etc.
   ↓
6. Analyse IA : infos client + contrats renseignés
   - Objectif 3 (potentiel) + recommandations "bien écrites"
   - Structured outputs JSON pour éviter formats cassés
   ↓
7. UI : rapport + checklist interactive + bouton "Créer acte M+3"
```

### Règle d'or

**Ne laisse pas l'IA décider si un champ est présent ou pas** (sauf cas très ambigu).

L'IA sert à : **résumer**, **prioriser**, **expliquer**, **proposer**.

---

## 🔍 Extraction et validation

### Extraction OCR depuis screenshot Lagon

**Fonction** : `extractFromImage(file: File)`

**Ce qui est extrait** (infos client uniquement) :
- Nom / Raison sociale
- Adresse (adresse, code postal, ville)
- Téléphone (mobile, fixe)
- Email
- Situation matrimoniale
- Situation professionnelle
- SIRET / NAF (si pro/entreprise)
- Activité exacte
- Chiffre d'affaires / Effectif (si pro/entreprise)
- Agence (Corniche / Rouvière)
- Chargé de clientèle

**Ce qui N'EST PAS extrait automatiquement** :
- ❌ Les contrats (auto, MRH, RC Pro, etc.) → **Saisie manuelle**

### Extraction par regex

- Email : `/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i`
- Téléphone mobile : `/(\+33|0)\s?[67](?:[\s.-]?\d{2}){4}/`
- Téléphone fixe : `/(\+33|0)\s?[1-5](?:[\s.-]?\d{2}){4}/`
- SIRET : `/\b\d{14}\b/`
- Code NAF : `/\b\d{4}[A-Z]\b/i`
- Code postal : `/\b\d{5}\b/`

### Parsing par labels Lagon

- Nom : `/Nom\s*[:\-]\s*(.+)/i`
- Raison sociale : `/Raison sociale\s*[:\-]\s*(.+)/i`
- Chargé de clientèle : `/Chargé de clientèle\s*[:\-]\s*(.+)/i`
- Agence : `/corniche|kennedy|jf kennedy/i` → "Corniche"
- Agence : `/rouvière|redon|bd du redon/i` → "Rouvière"

### Détection des projets

Les projets sont détectés dans la fiche Lagon et impactent la priorisation :

**Projets particuliers** :
- Déménagement : `/déménagement|emménagement|nouveau logement|changement d'adresse/i`
- Achat voiture : `/achat voiture|nouvelle voiture|changement de véhicule/i`
- Départ retraite : `/départ retraite|retraite|cessation d'activité/i`

**Projets pros/entreprises** :
- Recrutement premier salarié : `/premier salarié|première embauche/i`
- Recrutement nouveau salarié : `/nouveau salarié|nouvelle embauche/i`
- Nouvelle activité : `/nouvelle activité|développement activité|nouveau service/i`
- Création site internet : `/site internet|site web|e-commerce|boutique en ligne/i`
- Ouverture local : `/nouveau local|ouverture local|nouveau bureau/i`
- Digitalisation : `/cyber|numérique|digitalisation|transformation digitale/i`

### Validation Objectif 1 (qualité CRM)

```typescript
export function validateObjective1(clientType: ClientType, data: LagonOCRData) {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Checks déterministes
  const addressOk = Boolean(data.address && data.postalCode && data.city);
  const phoneOk = Boolean(data.phoneMobile || data.phoneFixed);
  const emailOk = Boolean(data.email);
  const matriOk = Boolean(data.maritalStatus);
  const proOk = Boolean(data.jobSituation);
  const agenceOk = Boolean(data.agency && /Corniche|Rouvière/.test(String(data.agency)));
  const managerOk = Boolean(data.accountManager);
  const siretNafOk = Boolean(data.siret && data.naf);
  const caEffectifOk = Boolean(data.revenue && data.headcount);

  // Remplir missing[] et warnings[]
  // Calculer score /10

  return {
    score, // 0-10
    checks: { address, phone, email, ... },
    missing,
    warnings,
  };
}
```

### Validation Objectif 2 (signatures + pièces)

```typescript
export function validateObjective2(data: LagonOCRData, contracts: ContractItem[]) {
  const missing: string[] = [];

  // Détection signatures
  const dp = data.mentions?.includes("DP") ?? false;
  const devis = data.mentions?.includes("DEVIS") ?? false;

  // Détection pièces
  const carteGrise = data.mentions?.includes("CARTE_GRISE") ?? false;
  const permis = data.mentions?.includes("PERMIS") ?? false;
  const cni = data.mentions?.includes("CNI") ?? false;
  const bail = data.mentions?.includes("BAIL") ?? false;

  // Règles conditionnelles (selon contrats structurés)
  const hasAuto = contracts.some(c => c.productKey === "AUTO/MOTO");
  const hasMrh = contracts.some(c => c.productKey === "MRH");

  if (hasAuto && !carteGrise) missing.push("Carte grise (si auto/moto)");
  if (hasAuto && !permis) missing.push("Permis de conduire (si auto/moto)");
  if (hasMrh && !bail) missing.push("Bail / justificatif logement (si MRH)");

  return {
    score,
    signatures: { dp, devis },
    pieces: { carteGrise, permis, cni, bail, autres: [] },
    missing,
  };
}
```

---

## 💡 Système de scoring par domaines d'exposition (Objectif 3)

### Principe

Au lieu de lister des produits par type de client, on utilise une **grille par domaines d'exposition** + un **moteur de scoring**.

L'IA sort **3 objectifs prioritaires** (domaines les plus critiques) + des **objectifs secondaires** (domaines importants mais moins urgents), avec une explication claire.

### Les 7 domaines d'exposition

1. **A. Mobilité** (particuliers + pros)
   - Assurance Auto (incl. options type assistance / véhicule de remplacement via packs) ([Allianz](https://www.allianz.fr/assurance-particulier/vehicules/assurance-auto.html))
   - Nouvelles mobilités / EDPM : trottinette électrique, gyroroue, etc. (RC obligatoire + formules Allianz) ([Allianz](https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/nouvelles-mobilites.html))
   - Flotte / véhicules pro (si entreprise / plusieurs véhicules) ([Allianz](https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/mes-vehicules/flotte-automobile.html))

2. **B. Logement & biens**
   - Assurance Habitation / MRH ([Allianz](https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation.html))
   - Offre "petites surfaces" (étudiants/jeunes actifs) ([Allianz](https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation/petite-surface.html))
   - Assurance Emprunteur (crédit immo) ([Allianz](https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-emprunteur/conseils-pratiques/garanties-du-contrat.html))

3. **C. Santé**
   - Complémentaire santé / mutuelle ([Allianz](https://www.allianz.fr/assurance-particulier/sante-prevoyance/assurance-sante.html))
   - Assurance chien/chat (si animal) ([Allianz](https://www.allianz.fr/assurance-particulier/sante-prevoyance/assurance-chien-chat.html))
   - Santé collective salariés (côté employeur) ([Allianz](https://www.allianz.fr/assurances-professionnels-entreprises/la-protection-de-mes-salaries/assurer-la-sante-de-mes-salaries.html))

4. **D. Revenus / Prévoyance / Protection des personnes**
   - Prévoyance (arrêt de travail / invalidité) ([Allianz](https://www.allianz.fr/assurance-particulier/sante-prevoyance/prevoyance-dependance/prevoyance/arret-travail-invalidite.html))
   - Prévoyance "famille" (décès/invalidité/arrêt) ([Allianz](https://www.allianz.fr/assurance-particulier/sante-prevoyance/prevoyance-dependance/conseils-pratiques/protection-famille.html))
   - GAV (Garantie des accidents de la vie) ([Allianz](https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/garantie-des-accidents-de-la-vie-privee.html))
   - Obsèques ([Allianz](https://www.allianz.fr/assurance-particulier/sante-prevoyance/prevoyance-dependance/assurance-obseques.html))

5. **E. Juridique**
   - Protection juridique (litiges du quotidien, prise en charge frais, juriste dédié) ([Allianz](https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-juridique.html))

6. **F. Patrimoine / Retraite / Transmission**
   - Assurance vie (capital/projets/transmission) ([Allianz](https://www.allianz.fr/assurance-particulier/epargne-retraite/assurance-vie.html))
   - PER Allianz PER Horizon ([Allianz](https://www.allianz.fr/assurance-particulier/epargne-retraite/retraite/epargne-deduction-fiscale.html))
   - Retraite (univers PER / solutions retraite) ([Allianz](https://www.allianz.fr/assurance-particulier/epargne-retraite/retraite.html))

7. **G. Professionnel** (domaine à part, qui peut écraser les autres)
   - Multirisque professionnelle (MRP) ([Allianz](https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mon-entreprise.html))
   - RC Pro ([Allianz](https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mes-responsabilites.html))
   - BTP / décennale / RC / dommages en cours de travaux (Solution BTP) ([Allianz](https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mon-entreprise/je-travaille-dans-le-btp.html))
   - Cyber risques ([Allianz](https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/proteger-mon-entreprise-des-cyberattaques.html))

👉 L'IA ne priorise pas des "produits", elle priorise des **domaines**.  
Ensuite, dans chaque domaine, on propose 2–5 garanties/assurances Allianz.

---

### Formule de scoring par domaine

```
scoreDomaine = exposition (0–60) + gap (0–30) + obligation (0–100 override)
```

- **exposition** (0–60) : règles "persona" basées sur âge, statut, famille, logement, mobilité, métier, salariés, etc.
- **gap** (0–30) : si rien n'est détecté (contrat/mention/pièce) dans la fiche Lagon → +X points
- **obligation override** (0–100) : si obligation détectée → le domaine passe directement en "prioritaire" (score = 100)

**Classement** :
- **Prioritaires** = tous les domaines avec **obligation override**, puis les meilleurs scores jusqu'à en avoir **3**
- **Secondaires** = les autres domaines avec score ≥ **40** (seuil à ajuster)

### ⚠️ Mécanismes anti-biais

#### A) Normalisation (éviter que "pro" écrase tout)

Le domaine **Pro** peut "écraser" les autres domaines. Contrôle nécessaire :

**Règle de normalisation** :
- Si `clientType = entreprise/tns` **ET** aucun contrat pro renseigné → "Pro" monte très haut (légitime)
- Sinon "Pro" reste haut, mais ne doit **pas empêcher** de faire sortir un 2e et 3e objectif utiles
  - Exemple : Santé collective + Mobilité flotte peuvent coexister avec Pro

**Implémentation** :
```typescript
// Après calcul des scores
if (clientType !== "particulier") {
  const hasProContract = contracts.some(c => 
    c.domain === "pro" && c.bucket === "chez_nous"
  );
  
  if (!hasProContract) {
    // Pro sans contrat = critique, score élevé justifié
    scores.pro = Math.min(100, scores.pro + 20);
  } else {
    // Pro avec contrat = limiter pour laisser place aux autres domaines
    if (scores.pro > 80) {
      scores.pro = 80; // Permet à Santé/Mobilité d'apparaître
    }
  }
}
```

#### B) "3 questions max" = réellement 3, optimisées par gain d'information

Les questions doivent être choisies pour **maximiser l'impact** sur le scoring :

**Algorithme de sélection** :
1. Calculer le **gain d'information** de chaque question potentielle
2. Sélectionner les 3 questions avec le gain le plus élevé
3. Éviter les questions redondantes ou inutiles selon le type de client

**Questions prioritaires par type** :
- **Entreprise/TNS** : "Salariés ? combien ?" (change Santé + Pro), "Local pro / stock / matériel ?" (change MRP), "Véhicules ? (nb + usage)" (change Mobilité)
- **Particulier** : "Âge ?" (change Mobilité, Santé, Patrimoine), "Enfants ?" (change Revenus/Prévoyance, Logement), "Statut logement ?" (change Logement)

**À éviter** :
- Demander l'âge à une entreprise
- Demander des enfants à un pro sans contexte familial
- Questions redondantes avec données déjà extraites

---

### Triggers "obligation" (à coder en dur)

Ces triggers doivent "forcer" le domaine en priorité, même si la fiche est pauvre.

**⚠️ IMPORTANT** : Chaque obligation override doit inclure :
- `legalBasisSource` : URL vers la source légale officielle
- `explainToUser` : 1-2 phrases copiables pour expliquer au commercial

#### Obligations légales

1. **EDPM / nouvelles mobilités** : RC spécifique obligatoire si usage détecté
   - **Source légale** : [Service Public - Circulation à trottinette électrique](https://www.service-public.fr/particuliers/vosdroits/F308)
   - **Explication** : "La RC habitation ne couvre pas forcément l'EDPM. Une assurance dédiée est requise selon les cas. ([Sécurité Routière](https://www.securite-routiere.gouv.fr/actualites/trottinettes-electriques-monoroues-gyropodes-hoverboards-la-deleguee-interministerielle))"
   - Si détection EDPM/trottinette/VAE → domaine Mobilité = score 100 (prioritaire)
   - Produit Allianz : [Nouvelles mobilités / EDPM](https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/nouvelles-mobilites.html)

2. **BTP / construction** : RC décennale obligatoire pour les pros de la construction
   - **Source légale** : [Légifrance - Assurance des travaux de construction](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006073984/LEGISCTA000006142820/)
   - **Explication** : "L'assurance décennale est obligatoire pour toute activité relevant du champ décennal (référence Code des assurances + fondement 1792 C. civil)."
   - Si activité bâtiment/construction détectée → domaine Professionnel = score 100 (prioritaire)
   - Produit Allianz : [Solution BTP](https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mon-entreprise/je-travaille-dans-le-btp.html)

3. **Santé collective salariés** : obligations liées à la complémentaire santé collective
   - **Source légale** : [Service Public Entreprendre - Obligation mutuelle entreprise](https://entreprendre.service-public.gouv.fr/vosdroits/F33754)
   - **Explication** : "L'employeur a l'obligation de proposer une complémentaire santé collective à ses salariés, avec participation employeur obligatoire."
   - Si entreprise avec salariés détectée → domaine Santé = score 100 (prioritaire)
   - Produit Allianz : [Santé collective salariés](https://www.allianz.fr/assurances-professionnels-entreprises/la-protection-de-mes-salaries/assurer-la-sante-de-mes-salaries.html)

#### Projets (priorité forte, score élevé)

4. **Déménagement** (particulier) : Assurance habitation obligatoire pour nouveau logement
   - Si projet "déménagement" détecté → domaine Logement & biens = score 100 (prioritaire)

5. **Achat voiture** (particulier) : Assurance auto obligatoire
   - Si projet "achat voiture" détecté → domaine Mobilité = score 100 (prioritaire)

6. **Départ retraite** (particulier) : Optimisation patrimoine/transmission
   - Si projet "départ retraite" détecté → domaine Patrimoine/Retraite = score 100 (prioritaire)

7. **Recrutement premier salarié** (pro/entreprise) : Santé collective obligatoire
   - Si projet "premier salarié" détecté → domaine Santé = score 100 (prioritaire) + domaine Professionnel = score 80

8. **Nouvelle activité** (pro/entreprise) : Assurances professionnelles adaptées
   - Si projet "nouvelle activité" détecté → domaine Professionnel = score 90

9. **Création site internet** (pro/entreprise) : Cyber risques
   - Si projet "site internet" détecté → domaine Professionnel (cyber) = score 85

---

## 📊 Catalogues de contrats

### Particuliers (10 familles)

1. **Mobilité** : Auto, Moto, Scooter, Quad, Camping-car, Remorque, Voiture sans permis, Utilitaire privé, EDPM (trottinette, gyroroue, hoverboard), Vélo, VAE, Bateau, Jet-ski, Kayak/canoë
2. **Logement & immobilier** : MRH (locataire/propriétaire/résidence secondaire), PNO, GLI, Propriétaire bailleur complète, PJ immobilière, Travaux/rénovation
3. **Santé** : Complémentaire santé, Surcomplémentaire, Hospitalisation seule, Dentaire/Optique/Audioprothèse, Santé internationale/expatrié
4. **Prévoyance, accidents, dépendance** : Décès, Invalidité, Arrêt de travail/ITT-IPT, GAV, Dépendance, Obsèques, Protection famille
5. **Responsabilités civiles spécifiques** : RC vie privée, RC scolaire/extra-scolaire, RC chasse, RC sport/licence, RC animaux, RC propriétaire terrain
6. **Protection juridique** : PJ du quotidien, PJ auto, PJ habitation/immobilière, PJ consommation/e-réputation/cyber-harcèlement
7. **Épargne, retraite, transmission** : Assurance vie, Capitalisation, PER individuel, Rente viagère, Épargne projet
8. **Emprunteur / crédit** : Emprunteur prêt immobilier, Emprunteur prêt consommation/auto, Moyens de paiement, Perte d'emploi
9. **Famille / loisirs / événements** : Scolaire, Voyage, Location saisonnière, Événements, Instruments de musique, Objets nomades, Valeurs (bijoux/objets d'art)
10. **Animaux** : Chien/chat, RC animal

### TNS (Socle + Métier + Employeur)

**Socle commun** :
- Responsabilités : RC Pro, RC Exploitation, RC Produits/Après livraison, RC Dirigeant/Mandataire social, PJ professionnelle
- Activité/Biens : MRP, Perte d'exploitation, Bris de machine/matériel, Informatique & données, Vol de fonds/caisse, Marchandises transportées
- Véhicules : Auto pro/utilitaire, Flotte, Mission
- Protection dirigeant : Santé TNS, Prévoyance TNS, Frais généraux, Épargne/retraite, Chômage dirigeant

**Blocs métier** :
- Artisan/BTP : Décennale, RC Pro BTP, TRC, Matériel chantier, Véhicules chantier
- Technique : RC pro immatériels, Cyber-risques, PJ + e-réputation
- Commercial : MRP renforcée, Perte d'exploitation, Caisse/fonds, RC produits
- Libéral : RCP, PJ pro, Local/matériel spécifique

**Pack employeur** (si salariés) :
- Santé collective (obligatoire)
- Prévoyance collective
- Accidents du travail (compléments)
- RC employeur/faute inexcusable
- PJ employeur

**Contrats perso** : MRH, Auto perso, Santé perso, Prévoyance famille, Assurance vie/PER, GAV, PJ familiale

### Entreprises (Socle + Métier + Employeur + Dirigeant)

**Socle commun** :
- Responsabilité : RCP, RC Exploitation, RC Après livraison/Produits, PJ professionnelle
- Entreprise/Biens : MRP, Perte d'exploitation, Bris de machines/matériel, Tous risques informatique
- Véhicules : Auto pro/utilitaire, Flotte automobile, Marchandises transportées
- Risques modernes : Cyber-risques, Fraude/détournement/caisse, E-réputation/litiges numériques

**Blocs métier** :
- BTP/Construction : RC Décennale (obligatoire), RC Pro BTP, TRC, Matériel/engins/outil pro, Véhicules chantier
- Commerce : MRP renforcée, Perte d'exploitation, RC produits, Caisse/fonds/transport recettes
- Industrie : Bris de machine, Perte d'exploitation, Marchandises/stocks, RC produits
- Services/Conseil/IT : RC pro immatériels, Cyber, PJ
- Libéral (en société) : RC Pro, PJ pro, Locaux/matériel spécifique

**Pack employeur** (si salariés) :
- Santé collective (obligatoire)
- Prévoyance collective
- PJ employeur
- RC employeur/faute inexcusable

**Protection dirigeant** : Santé dirigeant, Prévoyance dirigeant, Homme-clé, RC mandataires sociaux (D&O), Épargne/retraite/transmission

---

## 🗄️ Structure Firestore

### Collection `m3_diagnostics`

```typescript
{
  orgId?: string;
  createdBy: string; // userId
  sourceType: "text" | "image";
  
  // RGPD : Minimisation des données sensibles
  // Ne PAS stocker rawText par défaut
  rawTextHash?: string; // Hash du texte brut (pour déduplication/débogage)
  rawTextPreview?: string; // 20-40 premiers caractères uniquement (pour contexte)
  
  extractedData: LagonOCRData; // structuré (infos client)
  contracts: ContractItem[]; // Contrats structurés (chez nous/ailleurs/à vérifier)
  result: M3Diagnostic; // résultat complet
  
  // TTL pour suppression automatique (ex: 90 jours)
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}
```

**⚠️ RGPD - Minimisation des données** :
- `rawText` : **NE PAS stocker** par défaut (ou masquer emails/téléphones + TTL court)
- Préférer : `rawTextHash` (déduplication) + `rawTextPreview` (contexte limité)
- `extractedData` : structuré et anonymisé si possible
- TTL automatique : suppression après 90 jours (configurable)

### Collection `m3_catalog_domains`

Catalogue des domaines avec leurs produits Allianz associés.

```typescript
{
  id: string; // "mobility", "home", "health", "income", "legal", "wealth", "pro"
  label: string; // "Mobilité", "Logement & biens", etc.
  allianzProducts: Array<{
    id: string;
    label: string;
    url: string;
    tags: string[]; // ["jeune", "étudiant", "obligatoire"], etc.
    domain: Domain;
  }>;
}
```

### Collection `m3_rules`

Règles de scoring configurables.

```typescript
{
  id: string;
  when: Array<{ 
    field: string; 
    op: "eq" | "in" | "gte" | "lte" | "contains"; 
    value: any 
  }>;
  addScore: Partial<Record<Domain, number>>; // Points d'exposition (0-60)
  addGap?: Partial<Record<Domain, number>>; // Points de gap (0-30)
  obligationOverride?: Partial<Record<Domain, {
    isOverride: boolean;
    legalBasisSource: string; // URL vers source légale
    explainToUser: string; // 1-2 phrases copiables pour le commercial
  }>>; // Force score = 100 avec explication
  mustHave?: Array<{ 
    domain: Domain; 
    productId: string; 
    reason: string;
    legalBasisSource?: string; // URL si obligation légale
  }>;
  suggest?: Array<{ 
    domain: Domain; 
    productId: string; 
    reason: string; 
    priorityHint?: "high"|"medium"|"low" 
  }>;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Avantage** : Les règles et le catalogue sont éditables sans redéployer le code.

**Exemple de règle avec obligation** :
```typescript
{
  id: "rule_edpm_obligation",
  when: [
    { field: "mentions", op: "contains", value: "EDPM" }
  ],
  obligationOverride: {
    mobility: {
      isOverride: true,
      legalBasisSource: "https://www.service-public.fr/particuliers/vosdroits/F308",
      explainToUser: "La RC habitation ne couvre pas forcément l'EDPM. Une assurance dédiée est requise selon les cas."
    }
  },
  mustHave: [{
    domain: "mobility",
    productId: "edpm",
    reason: "RC obligatoire pour EDPM / nouvelles mobilités",
    legalBasisSource: "https://www.service-public.fr/particuliers/vosdroits/F308"
  }],
  active: true
}
```

### Sécurité

- Lecture/écriture uniquement pour users authentifiés de l'org
- Pas d'accès public
- **Rappel** : les subcollections n'héritent pas automatiquement des règles, penser `glob/match` propre

---

## 📝 Types TypeScript

### `types/m3-diagnostic.ts`

```typescript
export type ClientType = "particulier" | "tns" | "entreprise";
export type Priority = "high" | "medium" | "low";

export interface LagonOCRData {
  fullName?: string;
  companyName?: string;

  address?: string;
  postalCode?: string;
  city?: string;

  phoneMobile?: string;
  phoneFixed?: string;
  email?: string;

  maritalStatus?: string;
  jobSituation?: string; // situation pro (salarié, retraité, etc.)

  siret?: string;
  naf?: string;
  activity?: string;
  revenue?: string; // CA
  headcount?: string; // effectif

  agency?: "Corniche" | "Rouvière" | string;
  accountManager?: string; // chargé de clientèle

  // infos utiles objectif 2/3
  mentions?: string[];      // tokens détectés (dp, devis, etc.)
  projects?: string[];      // projets détectés (déménagement, achat voiture, retraite, recrutement, etc.)
  
  // NOTE : contracts n'est PAS extrait automatiquement, mais renseigné manuellement
  // contracts?: string[];     // auto, mrh, sante, prev, pro... → SAISIE MANUELLE
}

export interface M3Opportunity {
  type: string;
  reason: string;
  priority: Priority;
}

export type Domain = "mobility" | "home" | "health" | "income" | "legal" | "wealth" | "pro";

export interface DomainScore {
  domain: Domain;
  score: number; // 0-100
  priority: "primary" | "secondary" | "none";
}

export type ContractBucket = "chez_nous" | "ailleurs" | "a_verifier";

export interface ContractItem {
  domain: Domain;
  productKey: string;        // ex: "AUTO", "MRH", "SANTE", "RC_PRO", "MRP", "PJ", "GAV"
  bucket: ContractBucket;
  details?: { 
    insurer?: string;         // Nom de l'assureur si "ailleurs"
    notes?: string;           // Notes libres
  };
}

export interface M3Diagnostic {
  clientName: string;
  clientType: ClientType;
  extractedData: LagonOCRData;
  contracts: ContractItem[]; // Contrats structurés (chez nous/ailleurs/à vérifier)

  objective1: {
    score: number; // 0-10
    checks: {
      address: boolean;
      phone: boolean;
      email: boolean;
      situationMatrimoniale: boolean;
      situationPro: boolean;
      siretNaf?: boolean;
      caEffectif?: boolean;
      contactAssurances?: boolean;
      agence: boolean;
      chargeClientele: boolean;
    };
    missing: string[];
    warnings: string[];
  };

  objective2: {
    score: number; // 0-10
    signatures: { dp: boolean; devis: boolean; };
    pieces: {
      carteGrise: boolean;
      permis: boolean;
      cni: boolean;
      bail: boolean;
      autres: string[];
    };
    missing: string[];
  };

  objective3: {
    score: number; // 0-10
    domainScores: DomainScore[]; // Scores par domaine
    contracts: ContractItem[]; // Contrats structurés (remplace contratsChezNous/contratsAilleurs)
    opportunities: M3Opportunity[];
    questionsToConfirm: string[]; // Questions si info manquante (3 max, optimisées par gain d'information)
  };

  globalScore: number; // 0-30
  recommendations: string[];
  createdAt: string; // ISO
}
```

---

## 🎯 Système de scoring par domaines

### Fonction `scoreDomains`

```typescript
function scoreDomains(
  clientType: ClientType, 
  data: LagonOCRData, 
  contracts: ContractItem[], // Contrats structurés
  age?: number
): Record<string, number> {
  const scores: Record<string, number> = {
    mobility: 0,
    home: 0,
    health: 0,
    income: 0,
    legal: 0,
    wealth: 0,
    pro: 0,
  };

  // Convertir ContractItem[] en Set pour compatibilité
  const contractKeys = new Set(contracts.map(c => c.productKey));

  // === DOMAINE 1 : MOBILITÉ ===
  
  // PROJET : Achat voiture (OBLIGATION OVERRIDE)
  if (data.projects?.some(p => p.includes("ACHAT_VOITURE") || p.includes("NOUVELLE_VOITURE"))) {
    scores.mobility = 100; // Assurance auto obligatoire (obligation override)
  }
  
  // EDPM / VAE détectés (OBLIGATION OVERRIDE)
  if (data.mentions?.some(m => m.includes("EDPM") || m.includes("VAE") || m.includes("TROT") || m.includes("TROTTINETTE"))) {
    scores.mobility = 100; // RC obligatoire pour EDPM (obligation override)
  }
  
  if (contractKeys.has("AUTO/MOTO")) {
    scores.mobility += 30; // Déjà assuré, mais peut optimiser
  } else {
    // Pas d'auto renseignée
    if (age && age >= 18 && age <= 25) {
      scores.mobility += 50; // Jeune conducteur potentiel
    }
    if (data.jobSituation?.toLowerCase().includes("étudiant")) {
      scores.mobility += 40; // Étudiant = mobilité importante
    }
  }

  // === DOMAINE 2 : LOGEMENT & BIENS ===
  
  // PROJET : Déménagement (OBLIGATION OVERRIDE)
  if (data.projects?.some(p => p.includes("DEMENAGEMENT") || p.includes("EMMENAGEMENT"))) {
    scores.home = 100; // Assurance habitation obligatoire pour nouveau logement (obligation override)
  }
  
  if (contractKeys.has("MRH")) {
    scores.home += 20; // Déjà assuré
  } else {
    // Pas de MRH renseignée
    if (data.address) {
      scores.home += 60; // A une adresse mais pas d'assurance habitation
    }
  }
  if (data.jobSituation?.toLowerCase().includes("propriétaire")) {
    scores.home += 30;
  }
  // Enfants détectés (à confirmer)
  if (data.mentions?.some(m => m.includes("ENFANT") || m.includes("SCOLAIRE"))) {
    scores.home += 25; // Assurance scolaire potentielle
  }
  if (!contractKeys.has("PJ")) {
    scores.home += 20; // Protection juridique manquante
  }

  // === DOMAINE 3 : SANTÉ ===
  
  // PROJET : Recrutement premier salarié (OBLIGATION OVERRIDE)
  if (data.projects?.some(p => p.includes("PREMIER_SALARIE") || p.includes("PREMIERE_EMBAUCHE"))) {
    scores.health = 100; // Santé collective obligatoire (obligation override)
    scores.pro += 30; // Impact aussi sur le domaine pro
  }
  
  // PROJET : Recrutement nouveau salarié
  if (data.projects?.some(p => p.includes("NOUVEAU_SALARIE") || p.includes("NOUVELLE_EMBAUCHE"))) {
    scores.health += 50; // Santé collective à vérifier/ajuster
    scores.pro += 20;
  }
  
  if (contractKeys.has("SANTE")) {
    scores.health += 20; // Déjà assuré
  } else {
    scores.health += 70; // Pas de santé = gros trou
    if (clientType === "tns") {
      scores.health += 20; // TNS sans santé = très critique
    }
  }
  if (age && age >= 60) {
    scores.health += 30; // Seniors = santé prioritaire
  }
  if (data.mentions?.some(m => m.includes("DEPENDANCE"))) {
    scores.health += 25;
  }

  // === DOMAINE 4 : REVENUS / PRÉVOYANCE ===
  if (!contractKeys.has("PREVOYANCE")) {
    scores.income += 50; // Pas de prévoyance
    if (data.jobSituation?.toLowerCase().includes("salarié") || data.jobSituation?.toLowerCase().includes("cadre")) {
      scores.income += 30; // Salarié/cadre = prévoyance importante
    }
  }
  // Enfants = protection famille
  if (data.mentions?.some(m => m.includes("ENFANT") || m.includes("FAMILLE"))) {
    scores.income += 40; // Décès/ITT/IPT pour protéger famille
  }
  if (!contractKeys.has("GAV")) {
    scores.income += 25; // GAV manquante
  }
  if (clientType === "tns") {
    scores.income += 35; // TNS = protection revenus critique (Madelin)
  }

  // === DOMAINE 5 : JURIDIQUE ===
  if (!contractKeys.has("PJ")) {
    scores.legal += 30; // Protection juridique manquante
    if (data.jobSituation?.toLowerCase().includes("propriétaire")) {
      scores.legal += 20; // Propriétaire = litiges immobiliers possibles
    }
  }

  // === DOMAINE 6 : PROFESSIONNEL ===
  if (clientType !== "particulier") {
    // PROJET : Nouvelle activité (score élevé)
    if (data.projects?.some(p => p.includes("NOUVELLE_ACTIVITE") || p.includes("DEVELOPPEMENT_ACTIVITE"))) {
      scores.pro += 90; // Assurances professionnelles à adapter
    }
    
    // PROJET : Création site internet (cyber risques)
    if (data.projects?.some(p => p.includes("SITE_INTERNET") || p.includes("E_COMMERCE") || p.includes("DIGITALISATION"))) {
      scores.pro += 85; // Cyber risques à considérer
    }
    
    // PROJET : Ouverture local
    if (data.projects?.some(p => p.includes("OUVERTURE_LOCAL") || p.includes("NOUVEAU_LOCAL"))) {
      scores.pro += 70; // Assurance locaux professionnels
    }
    
    if (!contractKeys.has("PRO/IRD") && !contractKeys.has("MRP") && !contractKeys.has("RC_PRO")) {
      scores.pro += 80; // Pro sans assurance pro = critique
    }
    // Métier bâtiment = décennale obligatoire (OVERRIDE)
    if (data.activity?.toLowerCase().includes("bâtiment") || 
        data.activity?.toLowerCase().includes("construction") ||
        data.naf?.startsWith("43") || data.naf?.startsWith("41")) {
      scores.pro = 100; // Must-have décennale (obligation override)
    }
    if (data.mentions?.some(m => m.includes("LOCAL") || m.includes("BUREAU"))) {
      scores.pro += 30; // Locaux professionnels
    }
    if (data.headcount && parseInt(data.headcount) > 0) {
      scores.pro += 20; // Salariés = responsabilités
      // Santé collective obligatoire si salariés (OVERRIDE)
      if (!contractKeys.has("SANTE_COLLECTIVE")) {
        scores.health = 100; // Obligation override
      }
    }
  }

  // === DOMAINE 7 : PATRIMOINE / RETRAITE / TRANSMISSION ===
  
  // PROJET : Départ retraite (OBLIGATION OVERRIDE)
  if (data.projects?.some(p => p.includes("DEPART_RETRAITE") || p.includes("RETRAITE"))) {
    scores.wealth = 100; // Optimisation patrimoine/transmission prioritaire (obligation override)
  }
  
  if (age && age >= 40) {
    scores.wealth += 30; // 40+ = réflexion patrimoine
  }
  if (age && age >= 50) {
    scores.wealth += 40; // 50+ = retraite approche
  }
  if (age && age >= 60) {
    scores.wealth += 50; // 60+ = retraite + transmission
  }
  if (data.jobSituation?.toLowerCase().includes("propriétaire")) {
    scores.wealth += 25; // Propriétaire = patrimoine
  }
  if (!contractKeys.has("EPARGNE/RETRAITE") && !contractKeys.has("VIE") && !contractKeys.has("PER")) {
    scores.wealth += 35; // Pas d'épargne détectée
  }
  if (data.mentions?.some(m => m.includes("SUCCESSION") || m.includes("TRANSMISSION"))) {
    scores.wealth += 45;
  }

  // Appliquer la formule : exposition (0-60) + gap (0-30) + obligation (0-100 override)
  // Les obligations override (score = 100) sont déjà appliquées ci-dessus
  // Pour les autres, limiter à 90 (exposition max 60 + gap max 30)
  Object.keys(scores).forEach(key => {
    if (scores[key] < 100) {
      scores[key] = Math.min(90, scores[key]);
    }
  });

  // ⚠️ NORMALISATION : Éviter que "pro" écrase tout
  if (clientType !== "particulier") {
    const hasProContract = contracts.some(c => 
      c.domain === "pro" && c.bucket === "chez_nous"
    );
    
    if (!hasProContract) {
      // Pro sans contrat = critique, score élevé justifié
      scores.pro = Math.min(100, scores.pro + 20);
    } else {
      // Pro avec contrat = limiter pour laisser place aux autres domaines
      if (scores.pro > 80) {
        scores.pro = 80; // Permet à Santé/Mobilité d'apparaître
      }
    }
  }

  return scores;
}
```

### Fonction `buildOpportunitiesFromScores`

```typescript
async function buildOpportunitiesFromScores(
  scores: Record<string, number>,
  clientType: ClientType,
  data: LagonOCRData,
  contracts: ContractItem[]
): Promise<M3Opportunity[]> {
  const opps: M3Opportunity[] = [];
  
  // Récupérer les produits depuis Firestore (externalisation complète)
  // const domainCatalogs = await Promise.all(
  //   Object.keys(scores).map(domain => getDomainCatalog(domain as Domain))
  // );

  // Trier les domaines par score décroissant
  const sortedDomains = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  // Top 3 = prioritaires (score >= 50)
  const primaryDomains = sortedDomains
    .filter(([, score]) => score >= 50)
    .slice(0, 3);

  // Suivants = secondaires (score entre 40 et 50)
  const secondaryDomains = sortedDomains
    .filter(([, score]) => score >= 40 && score < 50)
    .slice(0, 3);

  // ⚠️ IMPORTANT : Ne PAS hardcoder les produits ici
  // Les produits doivent être récupérés depuis Firestore (m3_catalog_domains)
  // Ce code est un exemple - en production, utiliser getProductsFromFirestore(domain)
  
  // Exemple de récupération depuis Firestore :
  // const domainCatalog = await getDomainCatalog(domain);
  // const products = domainCatalog.allianzProducts.slice(0, 2);
  
  // Mapping temporaire (à remplacer par Firestore)
  const domainToProducts: Record<string, Array<{ label: string; reason: string; url?: string }>> = {
    mobility: [
      { label: "Assurance Auto Allianz", reason: "Protection véhicule + assistance / pack mobilité", url: "https://www.allianz.fr/assurance-particulier/vehicules/assurance-auto.html" },
      { label: "Nouvelles mobilités / EDPM", reason: "RC obligatoire trottinette électrique, gyroroue", url: "https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/nouvelles-mobilites.html" },
      { label: "Flotte / véhicules pro", reason: "Si entreprise / plusieurs véhicules", url: "https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/mes-vehicules/flotte-automobile.html" },
    ],
    home: [
      { label: "Assurance Habitation / MRH", reason: "Multirisque habitation", url: "https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation.html" },
      { label: "Petites surfaces (étudiants/jeunes actifs)", reason: "Studio, colocation", url: "https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation/petite-surface.html" },
      { label: "Assurance Emprunteur", reason: "Crédit immobilier", url: "https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-emprunteur/conseils-pratiques/garanties-du-contrat.html" },
    ],
    health: [
      { label: "Complémentaire santé / mutuelle", reason: "Couverture santé complète", url: "https://www.allianz.fr/assurance-particulier/sante-prevoyance/assurance-sante.html" },
      { label: "Assurance chien/chat", reason: "Si animal de compagnie", url: "https://www.allianz.fr/assurance-particulier/sante-prevoyance/assurance-chien-chat.html" },
      { label: "Santé collective salariés", reason: "Côté employeur (obligatoire si salariés)", url: "https://www.allianz.fr/assurances-professionnels-entreprises/la-protection-de-mes-salaries/assurer-la-sante-de-mes-salaries.html" },
    ],
    income: [
      { label: "Prévoyance (arrêt de travail / invalidité)", reason: "Protection revenus", url: "https://www.allianz.fr/assurance-particulier/sante-prevoyance/prevoyance-dependance/prevoyance/arret-travail-invalidite.html" },
      { label: "Prévoyance famille (décès/invalidité/arrêt)", reason: "Protection famille", url: "https://www.allianz.fr/assurance-particulier/sante-prevoyance/prevoyance-dependance/conseils-pratiques/protection-famille.html" },
      { label: "GAV (Garantie des accidents de la vie)", reason: "Accidents de la vie courante", url: "https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/garantie-des-accidents-de-la-vie-privee.html" },
      { label: "Obsèques", reason: "Anticipation des frais", url: "https://www.allianz.fr/assurance-particulier/sante-prevoyance/prevoyance-dependance/assurance-obseques.html" },
    ],
    legal: [
      { label: "Protection juridique", reason: "Litiges du quotidien, prise en charge frais, juriste dédié", url: "https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-juridique.html" },
    ],
    wealth: [
      { label: "Assurance vie", reason: "Capital/projets/transmission", url: "https://www.allianz.fr/assurance-particulier/epargne-retraite/assurance-vie.html" },
      { label: "PER Allianz PER Horizon", reason: "Plan Épargne Retraite (déduction fiscale)", url: "https://www.allianz.fr/assurance-particulier/epargne-retraite/retraite/epargne-deduction-fiscale.html" },
      { label: "Retraite (univers PER / solutions retraite)", reason: "Solutions retraite", url: "https://www.allianz.fr/assurance-particulier/epargne-retraite/retraite.html" },
    ],
    pro: [
      { label: "Multirisque professionnelle (MRP)", reason: "Protection activité professionnelle", url: "https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mon-entreprise.html" },
      { label: "RC Pro", reason: "Responsabilité civile professionnelle", url: "https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mes-responsabilites.html" },
      { label: "BTP / décennale / RC / dommages en cours de travaux", reason: "Solution BTP (obligatoire si construction)", url: "https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/assurer-mon-entreprise/je-travaille-dans-le-btp.html" },
      { label: "Cyber risques", reason: "Protection cybercriminalité", url: "https://www.allianz.fr/assurances-professionnels-entreprises/mon-activite/proteger-mon-entreprise-des-cyberattaques.html" },
    ],
  };

  // Générer opportunités prioritaires
  for (const [domain, score] of primaryDomains) {
    // En production : récupérer depuis Firestore
    // const catalog = await getDomainCatalog(domain as Domain);
    // const products = catalog.allianzProducts.slice(0, 2);
    
    // Exemple temporaire (à remplacer)
    const products = domainToProducts[domain] || [];
    products.slice(0, 2).forEach(product => {
      opps.push({
        type: product.label,
        reason: product.reason,
        priority: "high" as Priority,
      });
    });
  }

  // Générer opportunités secondaires
  for (const [domain, score] of secondaryDomains) {
    // En production : récupérer depuis Firestore
    // const catalog = await getDomainCatalog(domain as Domain);
    // const products = catalog.allianzProducts.slice(0, 1);
    
    // Exemple temporaire (à remplacer)
    const products = domainToProducts[domain] || [];
    products.slice(0, 1).forEach(product => {
      opps.push({
        type: product.label,
        reason: product.reason,
        priority: "medium" as Priority,
      });
    });
  }

  return opps;
}
```

### Fonction principale `runM3Diagnostic`

```typescript
export async function runM3Diagnostic(params: {
  clientNameFallback?: string;
  rawText: string;
  extractedData: LagonOCRData;
  contracts: ContractItem[]; // Contrats structurés (chez nous/ailleurs/à vérifier)
  age?: number; // Optionnel, peut être extrait du texte ou demandé
}): Promise<M3Diagnostic> {
  const clientType = inferClientType(params.extractedData);

  const clientName =
    params.extractedData.fullName ??
    params.extractedData.companyName ??
    params.clientNameFallback ??
    "Client";

  const objective1 = validateObjective1(clientType, params.extractedData);
  const objective2 = validateObjective2(params.extractedData, params.contracts);

  // Calculer les scores par domaine (en utilisant les contrats structurés)
  const domainScores = scoreDomains(clientType, params.extractedData, params.contracts, params.age);
  
  // Générer les opportunités depuis les scores (récupérer produits depuis Firestore)
  const opportunities = await buildOpportunitiesFromScores(
    domainScores, 
    clientType, 
    params.extractedData, 
    params.contracts
  );

  // Les contrats sont déjà structurés dans params.contracts (ContractItem[])
  // Plus besoin de filtrer manuellement - la structure ContractItem le fait déjà

  // Convertir domainScores en DomainScore[]
  const domainScoresArray: DomainScore[] = Object.entries(domainScores).map(([domain, score]) => ({
    domain: domain as Domain,
    score,
    priority: score >= 50 ? "primary" : score >= 40 ? "secondary" : "none",
  })).sort((a, b) => b.score - a.score);

  // Score objectif 3 : basé sur le nombre de domaines prioritaires
  const primaryCount = domainScoresArray.filter(d => d.priority === "primary").length;
  const score3 = Math.max(0, Math.min(10, Math.round((primaryCount / 3) * 10)));

  // Générer questions de confirmation (3 max, optimisées par gain d'information)
  const questionsToConfirm = selectTop3QuestionsByInformationGain(
    clientType,
    params.extractedData,
    params.contracts,
    params.age
  );
  
  /**
   * Sélectionne les 3 questions avec le gain d'information le plus élevé
   * Évite les questions redondantes ou inutiles selon le type de client
   */
  function selectTop3QuestionsByInformationGain(
    clientType: ClientType,
    data: LagonOCRData,
    contracts: ContractItem[],
    age?: number
  ): string[] {
    const candidateQuestions: Array<{ question: string; gain: number }> = [];
    
    // Questions pour particuliers
    if (clientType === "particulier") {
      if (!age) {
        candidateQuestions.push({
          question: "Quel est l'âge du client ?",
          gain: 30 // Impacte Mobilité, Santé, Patrimoine
        });
      }
      if (!data.maritalStatus && !data.mentions?.some(m => m.includes("ENFANT"))) {
        candidateQuestions.push({
          question: "Y a-t-il des enfants ?",
          gain: 25 // Impacte Revenus/Prévoyance, Logement
        });
      }
      if (data.address && !data.jobSituation?.toLowerCase().includes("propriétaire") && !data.jobSituation?.toLowerCase().includes("locataire")) {
        candidateQuestions.push({
          question: "Statut logement : propriétaire ou locataire ?",
          gain: 20 // Impacte Logement
        });
      }
    }
    
    // Questions pour entreprises/TNS
    if (clientType !== "particulier") {
      if (!data.headcount || parseInt(data.headcount) === 0) {
        candidateQuestions.push({
          question: "Avez-vous des salariés ? Combien ?",
          gain: 35 // Impacte Santé collective (obligatoire) + Pro
        });
      }
      if (!data.mentions?.some(m => m.includes("LOCAL") || m.includes("BUREAU"))) {
        candidateQuestions.push({
          question: "Avez-vous un local professionnel ? Stock ? Matériel ?",
          gain: 30 // Impacte MRP + perte d'exploitation
        });
      }
      if (!contracts.some(c => c.domain === "mobility")) {
        candidateQuestions.push({
          question: "Combien de véhicules professionnels ? Usage ?",
          gain: 25 // Impacte Mobilité (flotte)
        });
      }
      // Vérifier activité BTP si non détectée
      if (!data.activity?.toLowerCase().includes("bâtiment") && 
          !data.activity?.toLowerCase().includes("construction") &&
          !data.naf?.startsWith("43") && !data.naf?.startsWith("41")) {
        candidateQuestions.push({
          question: "Votre activité relève-t-elle du BTP/construction ?",
          gain: 40 // Impacte décennale (obligatoire)
        });
      }
    }
    
    // Questions sur projets (tous types)
    if (data.mentions?.some(m => m.includes("DEMENAGEMENT")) && !data.projects?.includes("DEMENAGEMENT")) {
      candidateQuestions.push({
        question: "Projet de déménagement confirmé ?",
        gain: 30 // Impacte Logement (obligation override)
      });
    }
    if (data.mentions?.some(m => m.includes("VOITURE") || m.includes("VÉHICULE")) && !data.projects?.includes("ACHAT_VOITURE")) {
      candidateQuestions.push({
        question: "Projet d'achat de véhicule ?",
        gain: 30 // Impacte Mobilité (obligation override)
      });
    }
    
    // Trier par gain décroissant et prendre les 3 meilleures
    return candidateQuestions
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 3)
      .map(q => q.question);
  }

  const globalScore = objective1.score + objective2.score + score3;

  // Générer recommandations structurées
  const recommendations: string[] = [
    ...objective1.missing.map(m => `⚠️ Compléter : ${m}`),
    ...objective2.missing.map(m => `⚠️ Obtenir : ${m}`),
    ...opportunities
      .filter(o => o.priority === "high")
      .slice(0, 3)
      .map(o => `💡 Prioritaire : ${o.type} — ${o.reason}`),
    ...opportunities
      .filter(o => o.priority === "medium")
      .slice(0, 2)
      .map(o => `💡 Secondaire : ${o.type} — ${o.reason}`),
  ];

  return {
    clientName,
    clientType,
    extractedData: params.extractedData,
    contracts: params.contracts, // Contrats structurés
    objective1,
    objective2,
    objective3: {
      score: score3,
      domainScores: domainScoresArray,
      contracts: params.contracts, // Contrats structurés
      opportunities,
      questionsToConfirm,
    },
    globalScore,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}
```

---

## 📊 Exemples concrets de scoring

### Profil : 20 ans, étudiant, hébergé (+ EDPM ou jeune conducteur)

**Scores typiques** :
- Mobilité 85 (jeune conducteur / EDPM)
- Santé 60
- Revenus/Prévoyance 45
- Logement & biens 25
- Patrimoine 10
- Pro 0

**Top 3 objectifs prioritaires** :
1. **Mobilité** : Auto jeune conducteur + assistance + responsabilité EDPM (selon usage)
2. **Santé** : Mutuelle (et vérifier rattachement/étudiant)
3. **Protection perso** : GAV / options accident (selon pratique sport, déplacements)

**Secondaires** :
- PJ (si besoin)
- Protection des biens (téléphone/ordi) si valeur élevée

**Avec projet "Achat voiture"** :
- **Mobilité** devient prioritaire absolu (score 100) → Assurance auto obligatoire

**Avec projet "Déménagement"** :
- **Logement & biens** devient prioritaire absolu (score 100) → Assurance habitation obligatoire

---

### Profil : 70 ans, retraité

**Scores** :
- Santé 90
- Logement & biens 70
- Patrimoine/Transmission 65
- Mobilité 55
- Revenus/Prévoyance 40 (dépendance/décès)
- Pro 0

**Top 3** :
1. **Santé** : Complémentaire + renforts (optique/dentaire/audio)
2. **Logement & biens** : MRH + PJ + prévention (vol/incendie/dégâts eaux)
3. **Patrimoine/Transmission** : AV/capi + stratégie succession

**Secondaires** :
- Obsèques (selon souhait / capacité)
- Auto (si conduite) + assistance 0 km

**Avec projet "Départ retraite"** :
- **Patrimoine/Transmission** devient prioritaire absolu (score 100) → Optimisation retraite/transmission

---

### Profil : TNS artisan bâtiment

**Scores** :
- Pro 95 (décennale/RC/local/outils)
- Mobilité 80 (véhicules chantier)
- Revenus/Prévoyance 70 (ITT/IPT/décès)
- Santé 55
- Logement & biens 35
- Patrimoine 30

**Top 3** :
1. **Pro** : RC Pro + **décennale** (must-have) + local + outils/chantier
2. **Mobilité** : Auto pro / flotte légère + assistance + usage pro
3. **Revenus/Prévoyance** : Madelin (ITT/IPT/décès) = continuité de revenus

**Secondaires** :
- Santé Madelin
- Si salariés : santé groupe + prévoyance groupe

**Avec projet "Recrutement premier salarié"** :
- **Santé** devient prioritaire absolu (score 100) → Santé collective obligatoire
- **Pro** +30 points → Vérifier/ajuster assurances professionnelles

**Avec projet "Nouvelle activité"** :
- **Pro** +90 points → Assurances professionnelles à adapter (RC, MRP, etc.)

**Avec projet "Création site internet"** :
- **Pro** +85 points → Cyber risques à considérer en priorité

---

### Profil : 45 ans, cadre, marié, enfants

**Scores** :
- Logement & biens 85
- Revenus/Prévoyance 75
- Mobilité 65
- Santé 60
- Patrimoine/Retraite 55
- Pro 0

**Top 3** :
1. **Logement & biens** : MRH + PJ + sécurisation scolaire
2. **Revenus/Prévoyance** : Décès / ITT-IPT (protection famille) + GAV
3. **Mobilité** : Auto + garanties conducteur / assistance

**Secondaires** :
- Santé (optimisation couverture famille)
- Épargne/retraite (PER/AV selon objectif)

---

## 🎨 Interface de saisie manuelle des contrats

### Structure UI

```tsx
// Interface pour renseigner les contrats manuellement
<div className="space-y-4">
  <h2>Contrats du client</h2>
  <p className="text-sm text-muted-foreground">
    Renseignez les contrats que le client possède (chez nous ou ailleurs)
  </p>
  
  {/* Checklist des contrats principaux */}
  <div className="grid grid-cols-2 gap-3">
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("AUTO/MOTO")} onChange={...} />
      <span>Auto / Moto</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("MRH")} onChange={...} />
      <span>Habitation (MRH)</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("SANTE")} onChange={...} />
      <span>Santé / Mutuelle</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("PREVOYANCE")} onChange={...} />
      <span>Prévoyance</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("PRO/IRD")} onChange={...} />
      <span>RC Pro / Multirisque Pro</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("PJ")} onChange={...} />
      <span>Protection Juridique</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("GAV")} onChange={...} />
      <span>GAV</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={contracts.includes("VIE")} onChange={...} />
      <span>Assurance Vie</span>
    </label>
    {/* ... autres contrats selon le type de client */}
  </div>
  
  {/* Champ libre pour autres contrats */}
  <div>
    <label>Autres contrats (séparés par virgule)</label>
    <input type="text" placeholder="Ex: PER, Obsèques, Dépendance..." />
  </div>
</div>
```

---

## 📊 Générateur de rapport

### `lib/assistant/m3-diagnostic/m3-report-generator.ts`

```typescript
import type { M3Diagnostic } from "@/types/m3-diagnostic";

const domainLabels: Record<string, string> = {
  mobility: "Mobilité",
  home: "Logement & biens",
  health: "Santé",
  income: "Revenus / Prévoyance / Protection des personnes",
  legal: "Juridique",
  wealth: "Patrimoine / Retraite / Transmission",
  pro: "Professionnel",
};

export function formatReport(d: M3Diagnostic) {
  const okMiss = (missing: string[]) => missing.length === 0 ? "✅ COMPLET" : `❌ MANQUANT (${missing.length})`;

  // Top 3 domaines prioritaires
  const top3Domains = d.objective3.domainScores
    .filter(ds => ds.priority === "primary")
    .slice(0, 3);

  // Domaines secondaires
  const secondaryDomains = d.objective3.domainScores
    .filter(ds => ds.priority === "secondary")
    .slice(0, 3);

  return [
    `📊 DIAGNOSTIC M+3 - ${d.clientName}`,
    ``,
    `SCORE GLOBAL : ${d.globalScore}/30`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `OBJECTIF 1 - Qualité fiche CRM (${d.objective1.score}/10) - ${okMiss(d.objective1.missing)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ...d.objective1.missing.map(x => `❌ ${x}`),
    ...d.objective1.warnings.map(x => `⚠️ ${x}`),
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `OBJECTIF 2 - Contrats finalisés (${d.objective2.score}/10) - ${okMiss(d.objective2.missing)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ...d.objective2.missing.map(x => `⚠️ ${x}`),
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `OBJECTIF 3 - Potentiel commercial (${d.objective3.score}/10)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎯 TOP 3 DOMAINES PRIORITAIRES :`,
    ...top3Domains.map((ds, i) => `${i + 1}. ${domainLabels[ds.domain]} (score: ${ds.score}/100)`),
    ``,
    `💡 OPPORTUNITÉS PRIORITAIRES :`,
    ...d.objective3.opportunities
      .filter(o => o.priority === "high")
      .slice(0, 3)
      .map(o => `  • ${o.type} — ${o.reason}`),
    ``,
    `📋 DOMAINES SECONDAIRES :`,
    ...secondaryDomains.map(ds => `  • ${domainLabels[ds.domain]} (score: ${ds.score}/100)`),
    ``,
    `💡 OPPORTUNITÉS SECONDAIRES :`,
    ...d.objective3.opportunities
      .filter(o => o.priority === "medium")
      .slice(0, 2)
      .map(o => `  • ${o.type} — ${o.reason}`),
    ``,
    ...(d.objective3.questionsToConfirm.length > 0 ? [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `❓ QUESTIONS À CONFIRMER (peuvent changer le classement) :`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...d.objective3.questionsToConfirm.map((q, i) => `${i + 1}. ${q}`),
      ``,
    ] : []),
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `ACTIONS RECOMMANDÉES :`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ...d.recommendations.map((r, i) => `${i + 1}. ${r}`),
  ].join("\n");
}
```

---

## 📞 Méthode : Le cadre de l'appel M+3

### Le prétexte administratif

Le contact M+3 se fait sous un **prétexte administratif** : "mise à jour du dossier".

**Pourquoi ?**
- Moins intrusif qu'un appel commercial pur
- Légitime aux yeux du client
- Permet d'aborder naturellement les sujets

### Accroche téléphonique (standard)

> "Bonjour [Prénom], c'est [Votre prénom] de l'agence [Nom]. C'est [Prénom vendeur] qui a assuré votre contrat auto et c'est moi qui vais vous suivre et gérer votre dossier. Est-ce que vous avez quelques minutes, ou on prend un rendez-vous téléphonique ?"

### Points importants

- ✅ Se présenter clairement
- ✅ Mentionner le vendeur initial (créer un lien)
- ✅ Proposer un créneau si pas disponible
- ✅ Être souriant et professionnel

---

## 🎯 Finalité : "Client complet"

### Définition

Un **"Client complet"** est un client qui a :
- ✅ Tous ses contrats d'assurance chez nous
- ✅ Des contrats adaptés à sa situation
- ✅ Une relation de confiance solide

### Le M+3 : process "qualité + commercial"

| Aspect | Actions |
|--------|---------|
| **Qualité** | Fiche CRM à jour + Contrats finalisés |
| **Commercial** | Bilan global + Opportunités concrètes |

### Objectif final

**Augmenter le multi-équipement** et la **solidité de la relation client**.

---

## 📊 Suivi dans le SaaS

### Tags de suivi M+3

Dans le système, chaque M+3 est suivi avec des tags :

| Tag | Valeurs | Description |
|-----|---------|-------------|
| **Appel téléphonique** | OK / KO | Contact établi avec le client |
| **Mise à jour fiche Lagon** | OK / KO | Fiche CRM validée et mise à jour |
| **Bilan effectué** | OK / KO | Bilan global réalisé |
| **SMS/Mail coordonnées** | OK / KO | Coordonnées envoyées (si KO sur appel) |

### Statut d'un M+3

- **À faire** : Client éligible, pas encore contacté
- **En cours** : Contact établi, objectifs en cours
- **Terminé** : Tous les objectifs atteints (tous les tags à OK)

---

## 💡 Bonnes pratiques

### Avant l'appel

- [ ] Consulter le dossier client dans Lagon
- [ ] Vérifier le contrat initial (type, garanties, prime)
- [ ] Noter les éventuels sinistres depuis la souscription
- [ ] Préparer les questions selon le type de client

### Pendant l'appel

- [ ] Être à l'écoute, ne pas précipiter
- [ ] Prendre des notes en temps réel
- [ ] Valider les informations au fur et à mesure
- [ ] Ne pas forcer, proposer un rappel si besoin

### Après l'appel

- [ ] Mettre à jour immédiatement la fiche Lagon
- [ ] Créer l'acte M+3 dans le système avec tous les tags
- [ ] Noter les opportunités identifiées
- [ ] Planifier les actions de suivi (devis, RDV, etc.)

---

## ⚠️ Points de vigilance

### À éviter

- ❌ Appeler trop tôt (moins de 2,5 mois)
- ❌ Appeler trop tard (plus de 4 mois)
- ❌ Oublier de valider la fiche CRM
- ❌ Passer directement au commercial sans valider les objectifs 1 et 2
- ❌ Ne pas documenter les opportunités

### À privilégier

- ✅ Respecter la fenêtre de 3 mois (± 1 semaine)
- ✅ Suivre les 3 objectifs dans l'ordre
- ✅ Documenter tout dans le système
- ✅ Planifier les actions de suivi immédiatement

---

## 🚀 Prochaines étapes de développement

### Priorité 1 : Structuration des contrats

1. **Implémenter `ContractItem` et `ContractBucket`**
   - Interface de saisie avec distinction "chez nous / ailleurs / à vérifier"
   - Mapping automatique des contrats vers les domaines
   - Génération de phrases propres : "Chez nous : Auto, MRH" / "Ailleurs : Santé (à vérifier)"

### Priorité 2 : Sources légales et explications

2. **Enrichir les obligations avec sources légales**
   - Ajouter `legalBasisSource` et `explainToUser` dans `m3_rules`
   - Afficher les explications dans l'UI pour le commercial
   - Lier vers Service Public, Légifrance, etc.

### Priorité 3 : Optimisation des questions

3. **Implémenter l'algorithme de sélection des 3 questions**
   - Calcul du gain d'information par question
   - Sélection des 3 questions avec le gain le plus élevé
   - Éviter les questions redondantes selon le type de client

### Priorité 4 : RGPD et minimisation

4. **Mise en place de la minimisation RGPD**
   - Ne PAS stocker `rawText` par défaut
   - Utiliser `rawTextHash` + `rawTextPreview` (20-40 caractères)
   - Masquer emails/téléphones dans les données stockées
   - TTL automatique (90 jours)

### Priorité 5 : Externalisation Firestore

5. **Externaliser 100% des mappings produits**
   - Migrer `domainToProducts` vers `m3_catalog_domains` (Firestore)
   - Récupérer les produits dynamiquement depuis Firestore
   - Permettre l'édition sans redéployer le code

### Priorité 6 : Normalisation du scoring

6. **Implémenter la normalisation anti-biais**
   - Contrôler que "pro" n'écrase pas les autres domaines
   - Permettre à Santé/Mobilité d'apparaître même avec Pro élevé
   - Tester sur profils réels (TNS avec salariés, etc.)

### Priorité 7 : Intégration technique

7. **Brancher l'OCR réel** dans `extractFromImage()`
   - Intégrer avec le système OCR existant (`extractLagonOCRData`)
   - Tester avec des screenshots réels de fiches Lagon

8. **Créer l'interface de saisie des contrats**
   - Checklist des contrats principaux avec buckets
   - Champ libre pour autres contrats
   - Validation et envoi au moteur de diagnostic

9. **Créer la grille de règles initiale**
   - Écrire les 30-50 premières règles avec sources légales
   - Tester sur 10 profils types
   - Ajuster les scores
   - Identifier les must-have

10. **Intégrer avec le chatbot IA**
    - Workflow conversationnel
    - Gestion des questions de confirmation (3 max optimisées)
    - Génération de recommandations structurées

---

## 📚 Références

- OCR Lagon : `lib/assistant/ocr-parser.ts`
- Création actes : `lib/firebase/acts.ts`
- Next.js App Router : [nextjs.org/docs/app](https://nextjs.org/docs/app)
- Firestore Security Rules : [Firebase Docs](https://firebase.google.com/docs/firestore/security/rules-structure)
- OpenAI Structured Outputs : [OpenAI Platform](https://platform.openai.com/docs/guides/structured-outputs)
- Google Cloud Vision OCR : [Cloud Vision API](https://docs.cloud.google.com/vision/docs/ocr)

---

## ✅ Critères de succès

L'outil est réussi si :
1. ✅ Le commercial peut analyser une fiche Lagon en < 30 secondes
2. ✅ Le diagnostic identifie tous les champs manquants
3. ✅ Les opportunités commerciales sont détectées
4. ✅ L'acte M+3 peut être créé en 1 clic depuis le diagnostic
5. ✅ Le taux d'erreur d'analyse est < 5%

---

---

## 🔒 Conformité RGPD et sécurité

### Minimisation des données

**Principe** : Ne stocker que le strict nécessaire.

**Implémentation** :
- ❌ **Ne PAS stocker** `rawText` complet (données sensibles)
- ✅ Utiliser `rawTextHash` (SHA-256) pour déduplication/débogage
- ✅ Utiliser `rawTextPreview` (20-40 premiers caractères) pour contexte limité
- ✅ Masquer automatiquement emails/téléphones dans `extractedData` si stockage long terme
- ✅ TTL automatique : suppression après 90 jours (configurable)

**Exemple de masquage** :
```typescript
function maskPII(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL_MASQUÉ]")
    .replace(/(\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g, "[TÉLÉPHONE_MASQUÉ]");
}
```

### Sécurité Firestore

- Lecture/écriture uniquement pour users authentifiés de l'org
- Pas d'accès public
- **Rappel** : les subcollections n'héritent pas automatiquement des règles, penser `glob/match` propre

---

## 📋 Checklist d'améliorations prioritaires

### ✅ Améliorations implémentées dans cette version

- [x] Structuration des contrats (`ContractItem` avec buckets)
- [x] Sources légales pour obligations (`legalBasisSource`, `explainToUser`)
- [x] Optimisation des 3 questions par gain d'information
- [x] Minimisation RGPD (hash + preview au lieu de rawText)
- [x] Normalisation anti-biais (éviter que "pro" écrase tout)
- [x] Externalisation Firestore (structure prête pour `m3_catalog_domains`)

### 🔄 À implémenter en priorité

- [ ] Interface UI pour saisie contrats avec buckets (chez nous/ailleurs/à vérifier)
- [ ] Récupération dynamique des produits depuis Firestore (remplacer hardcoding)
- [ ] Algorithme de sélection des 3 questions (gain d'information)
- [ ] Masquage automatique PII dans `extractedData`
- [ ] TTL automatique pour suppression après 90 jours
- [ ] Tests sur profils réels avec normalisation

---

**Dernière mise à jour** : Janvier 2025
