/**
 * Gestion des templates de prompts pour l'assistant IA
 * Ce fichier contient les types, constantes et fonctions utilitaires utilisables côté client
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  variables?: string[]; // Variables personnalisables (ex: ["nomClient", "typeContrat"])
  category?: string; // Catégorie du template (ex: "email", "analyse", "devis")
  tags?: string[]; // Tags pour filtrage et recherche (ex: ["commercial", "email", "relance"])
  knowledgeFiles?: string[]; // Références aux fichiers de connaissance (ex: ["process/sinistres.md"])
  isSystem?: boolean; // Template système (non modifiable par les utilisateurs)
  createdBy?: string; // userId du créateur (si template utilisateur)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Templates de base pour l'agence
 */
export const DEFAULT_TEMPLATES: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Email de relance client",
    description: "Rédiger un email professionnel de relance pour un client",
    prompt: `Rédige un email de relance professionnel pour le client {{nomClient}} concernant {{sujet}}.
L'email doit être courtois, professionnel et inciter le client à répondre.`,
    variables: ["nomClient", "sujet"],
    category: "email",
    tags: ["commercial", "email", "relance", "communication"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  {
    name: "Analyse de contrat d'assurance",
    description: "Analyser un contrat d'assurance et extraire les points clés",
    prompt: `Analyse le contrat d'assurance fourni et extrait les points clés suivants :
- Type de contrat
- Garanties incluses
- Franchises
- Exclusions
- Durée et conditions de résiliation
- Montants et primes

Présente les informations de manière claire et structurée.`,
    variables: [],
    category: "analyse",
    tags: ["analyse", "contrat", "documentation", "gestion"],
    knowledgeFiles: [],
    isSystem: true,
  },
  {
    name: "Génération de devis personnalisé",
    description: "Générer un devis personnalisé basé sur les besoins du client",
    prompt: `Génère un devis personnalisé pour {{nomClient}} avec les caractéristiques suivantes :
- Type d'assurance : {{typeAssurance}}
- Besoins spécifiques : {{besoins}}
- Budget approximatif : {{budget}}

Le devis doit être détaillé, professionnel et inclure les garanties recommandées.`,
    variables: ["nomClient", "typeAssurance", "besoins", "budget"],
    category: "devis",
    tags: ["commercial", "devis", "proposition", "vente"],
    knowledgeFiles: ["core/liens-devis.md"],
    isSystem: true,
  },
  {
    name: "Résumé de conversation téléphonique",
    description: "Résumer une conversation téléphonique avec un client",
    prompt: `Résume la conversation téléphonique avec {{nomClient}} en incluant :
- Points principaux discutés
- Demandes du client
- Actions à entreprendre
- Prochaines étapes

Le résumé doit être clair et actionnable.`,
    variables: ["nomClient"],
    category: "resume",
    tags: ["gestion", "résumé", "téléphone", "communication"],
    knowledgeFiles: [],
    isSystem: true,
  },
  {
    name: "Comparaison d'offres d'assurance",
    description: "Comparer deux offres d'assurance",
    prompt: `Compare les deux offres d'assurance suivantes :
- Offre 1 : {{offre1}}
- Offre 2 : {{offre2}}

Présente une comparaison détaillée incluant :
- Garanties
- Prix
- Franchises
- Avantages et inconvénients
- Recommandation`,
    variables: ["offre1", "offre2"],
    category: "comparaison",
    tags: ["commercial", "comparaison", "analyse", "conseil"],
    knowledgeFiles: [],
    isSystem: true,
  },
  {
    name: "Trouver les bons arguments de vente",
    description: "Aide à identifier les arguments de vente adaptés à la situation",
    prompt: `Je vais t'aider à trouver les bons arguments de vente pour convaincre ton client.

Pour te proposer les arguments les plus pertinents, j'ai besoin de mieux comprendre ta situation. Je vais te poser quelques questions :

1. **Quel produit d'assurance veux-tu vendre ?**
   - Santé individuelle, santé collective, dommages ouvrage, décennale, auto, habitation, autre ?

2. **Quel est le profil de ton client ?**
   - Particulier, professionnel, entreprise (TPE/PME/Grande entreprise) ?
   - Secteur d'activité si professionnel ?
   - Tranche d'âge approximative ?

3. **Quels sont ses besoins spécifiques ou préoccupations ?**
   - Budget limité, recherche de garanties maximales, besoin de rapidité ?
   - A-t-il déjà une assurance ? Pourquoi cherche-t-il à changer ?
   - Points de douleur identifiés ?

4. **Contexte de la vente :**
   - Premier contact, relance, client existant ?
   - Objections déjà exprimées ?

Réponds à ces questions et je te proposerai des arguments de vente personnalisés et percutants adaptés à ta situation ! 🎯`,
    variables: [],
    category: "vente",
    tags: ["commercial", "vente", "argumentaire", "prospection"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  // COMMERCIAL - Suite
  {
    name: "Préparer un appel commercial",
    description: "Préparer un appel commercial avec checklist et arguments",
    prompt: `Prépare-moi un appel commercial pour {{nomClient}} concernant {{produit}}.

Contexte : {{contexte}}

Je dois préparer :
- Checklist avant l'appel (documents, informations à vérifier)
- Points clés à aborder
- Arguments de vente adaptés
- Objections potentielles et réponses
- Objectifs de l'appel
- Prochaines étapes à proposer

Structure la préparation de manière claire et actionnable.`,
    variables: ["nomClient", "produit", "contexte"],
    category: "commercial",
    tags: ["commercial", "appel", "prospection", "préparation"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  {
    name: "Répondre à une objection client",
    description: "Trouver des réponses argumentées à une objection",
    prompt: `Comment répondre à l'objection suivante pour le produit {{produit}} ?

Objection : "{{objection}}"

Je dois :
- Comprendre l'origine de l'objection
- Proposer 3-5 réponses argumentées et professionnelles
- Utiliser des exemples concrets si possible
- Transformer l'objection en opportunité
- Proposer des solutions alternatives si nécessaire

Reste bienveillant, professionnel et orienté solution.`,
    variables: ["objection", "produit"],
    category: "commercial",
    tags: ["commercial", "objection", "argumentaire", "vente"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  {
    name: "Analyser un besoin client",
    description: "Analyser les besoins d'un client pour proposer la meilleure solution",
    prompt: `Analyse les besoins d'un client {{profilClient}} dans cette situation :

Situation : {{situation}}

Je dois analyser :
- Besoins identifiés (explicites et implicites)
- Profil et contraintes du client
- Solutions d'assurance adaptées
- Recommandations personnalisées
- Points d'attention spécifiques

Présente l'analyse de manière structurée avec des recommandations claires.`,
    variables: ["profilClient", "situation"],
    category: "commercial",
    tags: ["commercial", "analyse", "conseil", "besoins"],
    knowledgeFiles: [],
    isSystem: true,
  },
  // GESTION
  {
    name: "Préparer un renouvellement de contrat",
    description: "Préparer la relance et le renouvellement d'un contrat",
    prompt: `Prépare le renouvellement du contrat {{typeContrat}} pour {{nomClient}} échéant le {{dateEcheance}}.

Je dois préparer :
- Checklist de préparation (vérification du dossier, historique)
- Courrier/email de relance personnalisé
- Points à vérifier (changements de situation, sinistres)
- Proposition de renouvellement avec ajustements si nécessaire
- Calendrier des actions à mener
- Points de négociation potentiels

Sois proactif et orienté satisfaction client.`,
    variables: ["nomClient", "typeContrat", "dateEcheance"],
    category: "gestion",
    tags: ["gestion", "renouvellement", "contrat", "relance"],
    knowledgeFiles: ["process/preterme-auto.md", "process/preterme-ird.md"],
    isSystem: true,
  },
  {
    name: "Rédiger un courrier administratif",
    description: "Rédiger un courrier administratif professionnel",
    prompt: `Rédige un courrier administratif professionnel pour {{destinataire}}.

Objet : {{objet}}
Contenu à traiter : {{contenu}}

Le courrier doit être :
- Professionnel et courtois
- Clair et structuré
- Concis mais complet
- Conforme aux standards Allianz
- Avec appel à l'action si nécessaire

Utilise un ton adapté au destinataire et au contexte.`,
    variables: ["destinataire", "objet", "contenu"],
    category: "gestion",
    tags: ["gestion", "courrier", "administration", "communication"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  {
    name: "Vérifier la conformité d'un dossier",
    description: "Vérifier qu'un dossier est complet et conforme",
    prompt: `Vérifie la conformité d'un dossier {{typeDossier}}.

Documents fournis : {{documents}}

Je dois vérifier :
- Complétude du dossier (documents obligatoires présents)
- Conformité des documents (dates, signatures, informations)
- Cohérence des informations
- Points d'attention ou anomalies
- Actions correctives à mener si nécessaire

Présente un rapport de conformité clair avec les éléments manquants ou à corriger.`,
    variables: ["typeDossier", "documents"],
    category: "gestion",
    tags: ["gestion", "conformité", "dossier", "vérification"],
    knowledgeFiles: ["core/reglementation.md"],
    isSystem: true,
  },
  {
    name: "Préparer un rendez-vous client",
    description: "Préparer un rendez-vous avec checklist et ordre du jour",
    prompt: `Prépare un rendez-vous de {{durée}} avec {{nomClient}}.

Objectif : {{objectif}}

Je dois préparer :
- Checklist avant le rendez-vous (documents, informations)
- Ordre du jour structuré
- Points clés à aborder
- Questions à poser au client
- Solutions/produits à présenter
- Objectifs du rendez-vous
- Prochaines étapes envisagées

Structure la préparation pour maximiser l'efficacité du rendez-vous.`,
    variables: ["nomClient", "objectif", "durée"],
    category: "gestion",
    tags: ["gestion", "rendez-vous", "planning", "préparation"],
    knowledgeFiles: ["core/agences.md"],
    isSystem: true,
  },
  {
    name: "Gérer un changement de situation",
    description: "Gérer un changement de situation client (déménagement, mariage, etc.)",
    prompt: `Comment gérer le changement suivant pour {{nomClient}} sur son contrat {{typeContrat}} ?

Changement : {{changement}}

Je dois expliquer :
- Impact du changement sur le contrat
- Documents nécessaires
- Procédures à suivre
- Modifications de garanties/prime si applicable
- Délais et échéances
- Points d'attention spécifiques

Sois précis et guide l'utilisateur étape par étape.`,
    variables: ["nomClient", "changement", "typeContrat"],
    category: "gestion",
    tags: ["gestion", "changement", "modification", "contrat"],
    knowledgeFiles: [],
    isSystem: true,
  },
  // SINISTRE
  {
    name: "Déclarer un sinistre",
    description: "Guider la déclaration d'un sinistre étape par étape",
    prompt: `Guide-moi pour déclarer un sinistre {{typeSinistre}} pour {{client}}.

Je dois expliquer :
- Procédure de déclaration étape par étape
- Documents à fournir
- Délais de déclaration
- Informations à communiquer
- Contacts utiles
- Ce qu'il faut faire/ne pas faire
- Prochaines étapes après déclaration

Sois clair, rassurant et précis dans les instructions.`,
    variables: ["typeSinistre", "client"],
    category: "sinistre",
    tags: ["sinistre", "déclaration", "procédure", "assistance"],
    knowledgeFiles: ["process/sinistres.md", "core/numeros-assistance.md"],
    isSystem: true,
  },
  {
    name: "Suivre un dossier sinistre",
    description: "Expliquer le suivi et les étapes d'un dossier sinistre",
    prompt: `Quelles sont les étapes de suivi pour le dossier sinistre {{numeroDossier}} ?

Type de sinistre : {{typeSinistre}}

Je dois expliquer :
- Étapes du processus de traitement
- Délais moyens pour chaque étape
- Comment suivre l'avancement
- Qui contacter selon l'étape
- Documents complémentaires éventuels
- Indicateurs de progression

Rassure le client sur le suivi et la transparence du processus.`,
    variables: ["numeroDossier", "typeSinistre"],
    category: "sinistre",
    tags: ["sinistre", "suivi", "dossier", "processus"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Préparer une expertise",
    description: "Préparer et organiser une expertise de sinistre",
    prompt: `Comment préparer une expertise pour un sinistre {{typeSinistre}} ?

Dommages constatés : {{dommages}}

Je dois expliquer :
- Préparation avant l'expertise (documents, photos, constat)
- Ce que fait l'expert
- Comment se déroule l'expertise
- Documents à préparer
- Points à vérifier
- Comment optimiser le résultat de l'expertise

Guide l'utilisateur pour bien préparer l'expertise.`,
    variables: ["typeSinistre", "dommages"],
    category: "sinistre",
    tags: ["sinistre", "expertise", "évaluation", "préparation"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Calculer une indemnisation",
    description: "Expliquer le calcul d'une indemnisation",
    prompt: `Comment calculer l'indemnisation pour un sinistre {{typeSinistre}} ?

Montant des dommages : {{montantDommages}}

Je dois expliquer :
- Méthode de calcul utilisée
- Facteurs pris en compte (valeur, dépréciation, franchise)
- Formules appliquées
- Exemples de calcul
- Points d'attention
- Recours possibles si contestation

Sois pédagogique et transparent sur le calcul.`,
    variables: ["typeSinistre", "montantDommages"],
    category: "sinistre",
    tags: ["sinistre", "indemnisation", "calcul", "évaluation"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Gérer un litige sinistre",
    description: "Gérer un litige ou une contestation de sinistre",
    prompt: `Comment gérer le litige sur le dossier {{numeroDossier}} ?

Motif de contestation : {{motifContestation}}

Je dois expliquer :
- Procédure de gestion du litige
- Documents à rassembler
- Arguments à développer
- Délais et échéances
- Médiation possible
- Recours disponibles
- Conseils pour résoudre le litige

Sois objectif et orienté solution.`,
    variables: ["numeroDossier", "motifContestation"],
    category: "sinistre",
    tags: ["sinistre", "litige", "contestation", "médiation"],
    knowledgeFiles: ["process/sinistres.md", "core/reglementation.md"],
    isSystem: true,
  },
  {
    name: "Rédiger un rapport de sinistre",
    description: "Rédiger un rapport de sinistre professionnel",
    prompt: `Rédige un rapport de sinistre professionnel pour un sinistre {{typeSinistre}}.

Faits : {{faits}}

Le rapport doit inclure :
- Description détaillée des faits
- Constatations et observations
- Évaluation des dommages
- Analyse de la situation
- Recommandations
- Conclusion

Structure le rapport de manière professionnelle et complète.`,
    variables: ["typeSinistre", "faits"],
    category: "sinistre",
    tags: ["sinistre", "rapport", "documentation", "analyse"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  // IARD
  {
    name: "Analyser un contrat d'assurance habitation",
    description: "Analyser un contrat d'assurance habitation et extraire les points clés",
    prompt: `Analyse le contrat d'assurance habitation pour {{nomClient}} et extrait les garanties.

Je dois analyser :
- Type de contrat et formule
- Garanties incluses (incendie, dégâts des eaux, vol, etc.)
- Franchises par garantie
- Exclusions importantes
- Valeurs assurées
- Conditions particulières
- Points d'attention

Présente l'analyse de manière claire et structurée.`,
    variables: ["nomClient"],
    category: "iard",
    tags: ["iard", "habitation", "analyse", "contrat"],
    knowledgeFiles: ["produits/assurance-iard.md"],
    isSystem: true,
  },
  {
    name: "Comparer des offres d'assurance auto",
    description: "Comparer deux offres d'assurance automobile",
    prompt: `Compare les deux offres d'assurance auto suivantes :

Offre 1 : {{offre1}}
Offre 2 : {{offre2}}

Je dois comparer :
- Garanties et niveaux de couverture
- Prix et primes
- Franchises
- Services inclus
- Avantages et inconvénients
- Recommandation selon le profil

Présente une comparaison détaillée et objective.`,
    variables: ["offre1", "offre2"],
    category: "iard",
    tags: ["iard", "auto", "comparaison", "conseil"],
    knowledgeFiles: ["produits/assurance-iard.md", "produits/assurance-vtm-allianz.md"],
    isSystem: true,
  },
  {
    name: "Expliquer les garanties IARD",
    description: "Expliquer les garanties d'une assurance IARD",
    prompt: `Explique les garanties d'une assurance {{typeAssurance}} avec niveau {{niveauGarantie}}.

Je dois expliquer :
- Garanties incluses en détail
- Ce qui est couvert et ce qui ne l'est pas
- Franchises applicables
- Exclusions importantes
- Conditions d'application
- Exemples concrets de situations couvertes

Sois pédagogique et utilise des exemples concrets.`,
    variables: ["typeAssurance", "niveauGarantie"],
    category: "iard",
    tags: ["iard", "garanties", "explication", "conseil"],
    knowledgeFiles: ["produits/assurance-iard.md"],
    isSystem: true,
  },
  {
    name: "Calculer une prime IARD",
    description: "Expliquer le calcul d'une prime d'assurance IARD",
    prompt: `Comment calculer la prime pour une assurance {{typeAssurance}} ?

Caractéristiques : {{caracteristiques}}

Je dois expliquer :
- Facteurs de calcul (valeur, localisation, profil, etc.)
- Formules utilisées
- Coefficients appliqués
- Exemples de calcul
- Optimisations possibles
- Points d'attention

Sois pédagogique et transparent sur le calcul.`,
    variables: ["typeAssurance", "caracteristiques"],
    category: "iard",
    tags: ["iard", "prime", "calcul", "explication"],
    knowledgeFiles: ["produits/assurance-iard.md"],
    isSystem: true,
  },
  {
    name: "Gérer un changement de véhicule",
    description: "Gérer le changement de véhicule sur un contrat auto",
    prompt: `Comment gérer le changement de véhicule pour {{nomClient}} ?

Ancien véhicule : {{ancienVehicule}}
Nouveau véhicule : {{nouveauVehicule}}

Je dois expliquer :
- Procédure de modification
- Documents nécessaires
- Impact sur la prime
- Ajustements de garanties si nécessaire
- Délais et échéances
- Points d'attention

Guide l'utilisateur étape par étape.`,
    variables: ["nomClient", "ancienVehicule", "nouveauVehicule"],
    category: "iard",
    tags: ["iard", "auto", "modification", "véhicule"],
    knowledgeFiles: ["produits/assurance-vtm-allianz.md"],
    isSystem: true,
  },
  {
    name: "Préparer un devis IARD professionnel",
    description: "Préparer un devis pour une assurance professionnelle",
    prompt: `Prépare un devis assurance professionnelle pour {{entreprise}}.

Activité : {{activite}}
Risques identifiés : {{risques}}

Le devis doit inclure :
- Analyse des risques
- Garanties recommandées
- Montants de garantie
- Franchises proposées
- Prime estimée
- Options complémentaires
- Recommandations personnalisées

Sois précis et adapté à l'activité de l'entreprise.`,
    variables: ["entreprise", "activite", "risques"],
    category: "iard",
    tags: ["iard", "professionnel", "devis", "entreprise"],
    knowledgeFiles: ["produits/assurance-iard.md"],
    isSystem: true,
  },
  // SANTÉ
  {
    name: "Expliquer une garantie santé individuelle",
    description: "Expliquer les garanties d'une assurance santé individuelle",
    prompt: `Explique les garanties de la formule {{formule}} avec niveau {{niveauCouverture}}.

Je dois expliquer :
- Garanties par poste de soins (optique, dentaire, etc.)
- Taux de remboursement
- Plafonds et limites
- Franchises et participations
- Services inclus (tiers payant, etc.)
- Exclusions importantes
- Exemples concrets de remboursements

Sois clair et utilise des exemples chiffrés.`,
    variables: ["formule", "niveauCouverture"],
    category: "santé",
    tags: ["santé", "individuelle", "garanties", "explication"],
    knowledgeFiles: ["produits/assurance-sante.md"],
    isSystem: true,
  },
  {
    name: "Comparer des mutuelles santé",
    description: "Comparer différentes offres de mutuelles santé",
    prompt: `Compare les mutuelles {{offre1}} et {{offre2}} pour un particulier.

Je dois comparer :
- Garanties par poste de soins
- Taux de remboursement
- Plafonds et limites
- Primes
- Services inclus
- Avantages et inconvénients
- Recommandation selon le profil

Présente une comparaison détaillée et objective.`,
    variables: ["offre1", "offre2"],
    category: "santé",
    tags: ["santé", "mutuelle", "comparaison", "conseil"],
    knowledgeFiles: ["produits/assurance-sante.md"],
    isSystem: true,
  },
  {
    name: "Préparer un devis santé collective",
    description: "Préparer un devis pour une assurance santé collective",
    prompt: `Prépare un devis santé collective pour {{entreprise}}.

Nombre de salariés : {{nombreSalaries}}
Budget disponible : {{budget}}

Le devis doit inclure :
- Analyse des besoins de l'entreprise
- Formules recommandées
- Garanties proposées
- Coût par salarié
- Options complémentaires
- Avantages pour l'entreprise
- Recommandations personnalisées

Adapte la proposition au budget et aux besoins.`,
    variables: ["entreprise", "nombreSalaries", "budget"],
    category: "santé",
    tags: ["santé", "collective", "devis", "entreprise"],
    knowledgeFiles: ["produits/assurance-sante.md"],
    isSystem: true,
  },
  {
    name: "Expliquer le remboursement santé",
    description: "Expliquer le processus de remboursement santé",
    prompt: `Comment fonctionne le remboursement pour {{typeSoin}} avec la formule {{formule}} ?

Je dois expliquer :
- Processus de remboursement étape par étape
- Documents nécessaires
- Délais de remboursement
- Taux de remboursement applicable
- Plafonds et limites
- Franchises éventuelles
- Exemples de calcul

Sois pédagogique avec des exemples concrets.`,
    variables: ["typeSoin", "formule"],
    category: "santé",
    tags: ["santé", "remboursement", "procédure", "explication"],
    knowledgeFiles: ["produits/assurance-sante.md"],
    isSystem: true,
  },
  {
    name: "Gérer un changement de situation santé",
    description: "Gérer un changement de situation (mariage, naissance, etc.) sur un contrat santé",
    prompt: `Comment gérer le changement {{changement}} pour {{nomClient}} sur son contrat santé ?

Je dois expliquer :
- Impact du changement sur le contrat
- Procédures à suivre
- Documents nécessaires
- Modifications de garanties si nécessaire
- Ajustement de prime
- Délais et échéances
- Points d'attention

Guide l'utilisateur avec précision.`,
    variables: ["nomClient", "changement"],
    category: "santé",
    tags: ["santé", "changement", "modification", "contrat"],
    knowledgeFiles: ["produits/assurance-sante.md"],
    isSystem: true,
  },
  {
    name: "Analyser des besoins santé",
    description: "Analyser les besoins santé d'un client pour proposer la meilleure formule",
    prompt: `Analyse les besoins santé d'un client {{profilClient}} avec {{besoins}}.

Je dois analyser :
- Besoins identifiés (soins fréquents, famille, etc.)
- Profil et contraintes
- Formules adaptées
- Garanties recommandées
- Budget optimal
- Points d'attention spécifiques

Présente une analyse structurée avec recommandations personnalisées.`,
    variables: ["profilClient", "besoins"],
    category: "santé",
    tags: ["santé", "analyse", "conseil", "besoins"],
    knowledgeFiles: ["produits/assurance-sante.md"],
    isSystem: true,
  },
  // PRÉVOYANCE
  {
    name: "Expliquer une garantie prévoyance",
    description: "Expliquer les garanties d'une assurance prévoyance",
    prompt: `Explique la garantie prévoyance {{typeGarantie}} avec un capital de {{montant}}.

Je dois expliquer :
- Garanties incluses en détail
- Conditions d'activation
- Délais de carence
- Montants et plafonds
- Exclusions importantes
- Exemples de situations couvertes
- Processus d'indemnisation

Sois précis et utilise des exemples concrets.`,
    variables: ["typeGarantie", "montant"],
    category: "prévoyance",
    tags: ["prévoyance", "garanties", "explication", "conseil"],
    knowledgeFiles: ["produits/prevoyance.md"],
    isSystem: true,
  },
  {
    name: "Calculer une prime prévoyance",
    description: "Expliquer le calcul d'une prime d'assurance prévoyance",
    prompt: `Comment calculer la prime prévoyance pour un client de {{age}} ans, {{profession}}, avec capital {{capital}} ?

Je dois expliquer :
- Facteurs de calcul (âge, profession, capital, etc.)
- Formules utilisées
- Coefficients appliqués
- Exemples de calcul
- Optimisations possibles
- Points d'attention

Sois pédagogique et transparent.`,
    variables: ["age", "profession", "capital"],
    category: "prévoyance",
    tags: ["prévoyance", "prime", "calcul", "explication"],
    knowledgeFiles: ["produits/prevoyance.md"],
    isSystem: true,
  },
  {
    name: "Préparer un devis prévoyance",
    description: "Préparer un devis d'assurance prévoyance personnalisé",
    prompt: `Prépare un devis prévoyance pour {{nomClient}}.

Besoins identifiés : {{besoins}}
Budget disponible : {{budget}}

Le devis doit inclure :
- Analyse des besoins
- Garanties recommandées
- Montants de capital proposés
- Primes estimées
- Options complémentaires
- Avantages de la solution
- Recommandations personnalisées

Adapte la proposition au budget et aux besoins.`,
    variables: ["nomClient", "besoins", "budget"],
    category: "prévoyance",
    tags: ["prévoyance", "devis", "proposition", "conseil"],
    knowledgeFiles: ["produits/prevoyance.md"],
    isSystem: true,
  },
  {
    name: "Expliquer la garantie décès",
    description: "Expliquer en détail la garantie décès d'une assurance prévoyance",
    prompt: `Explique la garantie décès avec capital {{capital}} et bénéficiaires {{bénéficiaires}}.

Je dois expliquer :
- Fonctionnement de la garantie
- Conditions d'activation
- Montant versé
- Désignation des bénéficiaires
- Procédure d'indemnisation
- Points d'attention (délais, exclusions)
- Exemples de situations

Sois clair et rassurant dans l'explication.`,
    variables: ["capital", "bénéficiaires"],
    category: "prévoyance",
    tags: ["prévoyance", "décès", "garantie", "explication"],
    knowledgeFiles: ["produits/prevoyance.md"],
    isSystem: true,
  },
  {
    name: "Gérer un sinistre prévoyance",
    description: "Guider la gestion d'un sinistre prévoyance (invalidité, décès, etc.)",
    prompt: `Comment gérer un sinistre prévoyance {{typeSinistre}} pour {{nomClient}} ?

Je dois expliquer :
- Procédure de déclaration
- Documents nécessaires
- Délais et échéances
- Processus d'instruction
- Montant d'indemnisation
- Points d'attention
- Contacts utiles

Sois rassurant et guide l'utilisateur étape par étape.`,
    variables: ["typeSinistre", "nomClient"],
    category: "prévoyance",
    tags: ["prévoyance", "sinistre", "indemnisation", "procédure"],
    knowledgeFiles: ["produits/prevoyance.md", "process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Comparer des offres prévoyance",
    description: "Comparer différentes offres d'assurance prévoyance",
    prompt: `Compare les offres prévoyance {{offre1}} et {{offre2}}.

Je dois comparer :
- Garanties incluses
- Montants de capital
- Primes
- Conditions d'activation
- Exclusions
- Avantages et inconvénients
- Recommandation selon le profil

Présente une comparaison détaillée et objective.`,
    variables: ["offre1", "offre2"],
    category: "prévoyance",
    tags: ["prévoyance", "comparaison", "offres", "conseil"],
    knowledgeFiles: ["produits/prevoyance.md"],
    isSystem: true,
  },
  // RETRAITE
  {
    name: "Expliquer un contrat retraite complémentaire",
    description: "Expliquer un contrat de retraite complémentaire",
    prompt: `Explique le contrat retraite {{typeContrat}} avec versements de {{versements}}.

Je dois expliquer :
- Fonctionnement du contrat
- Versements et cotisations
- Capitalisation et rendement
- Avantages fiscaux
- Conditions de rachat
- Échéances et options
- Points d'attention

Sois pédagogique et utilise des exemples chiffrés.`,
    variables: ["typeContrat", "versements"],
    category: "retraite",
    tags: ["retraite", "complémentaire", "explication", "conseil"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  {
    name: "Calculer une pension de retraite",
    description: "Expliquer le calcul d'une pension de retraite",
    prompt: `Comment calculer la pension de retraite pour {{age}} ans, {{annéesCotisation}} années de cotisation, salaire {{salaire}} ?

Je dois expliquer :
- Méthode de calcul
- Formules utilisées
- Facteurs pris en compte
- Exemples de calcul
- Optimisations possibles
- Points d'attention

Sois pédagogique et transparent sur le calcul.`,
    variables: ["age", "annéesCotisation", "salaire"],
    category: "retraite",
    tags: ["retraite", "pension", "calcul", "explication"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  {
    name: "Préparer un devis épargne retraite",
    description: "Préparer un devis pour un produit d'épargne retraite",
    prompt: `Prépare un devis épargne retraite pour {{nomClient}}.

Objectif : {{objectif}}
Horizon : {{horizon}}

Le devis doit inclure :
- Analyse des besoins
- Produits recommandés
- Versements proposés
- Projections de capital
- Avantages fiscaux
- Options disponibles
- Recommandations personnalisées

Adapte la proposition à l'objectif et à l'horizon.`,
    variables: ["nomClient", "objectif", "horizon"],
    category: "retraite",
    tags: ["retraite", "épargne", "devis", "conseil"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  {
    name: "Expliquer les avantages fiscaux retraite",
    description: "Expliquer les avantages fiscaux de l'épargne retraite",
    prompt: `Explique les avantages fiscaux du produit {{typeProduit}} pour la tranche {{trancheImposition}}.

Je dois expliquer :
- Mécanismes fiscaux (déduction, abondement, etc.)
- Économies d'impôt réalisables
- Exemples chiffrés
- Conditions d'éligibilité
- Points d'attention
- Optimisations possibles

Sois précis avec des exemples concrets.`,
    variables: ["typeProduit", "trancheImposition"],
    category: "retraite",
    tags: ["retraite", "fiscal", "avantages", "explication"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  {
    name: "Gérer un rachat retraite",
    description: "Expliquer la procédure de rachat d'un contrat retraite",
    prompt: `Comment gérer un rachat retraite de {{montant}} pour {{nomClient}} ?

Je dois expliquer :
- Procédure de rachat
- Conditions et délais
- Fiscalité applicable
- Documents nécessaires
- Impact sur le contrat
- Points d'attention
- Alternatives possibles

Sois transparent sur les conséquences du rachat.`,
    variables: ["nomClient", "montant"],
    category: "retraite",
    tags: ["retraite", "rachat", "procédure", "fiscal"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  {
    name: "Comparer des produits retraite",
    description: "Comparer différents produits d'épargne retraite",
    prompt: `Compare les produits retraite {{produit1}} et {{produit2}}.

Je dois comparer :
- Caractéristiques des produits
- Rendements
- Frais
- Avantages fiscaux
- Flexibilité
- Avantages et inconvénients
- Recommandation selon le profil

Présente une comparaison détaillée et objective.`,
    variables: ["produit1", "produit2"],
    category: "retraite",
    tags: ["retraite", "comparaison", "produits", "conseil"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  // AUTRES
  {
    name: "Répondre à une question client",
    description: "Aider à répondre à une question client de manière professionnelle",
    prompt: `Comment répondre professionnellement à cette question client ?

Question : {{question}}
Contexte : {{contexte}}

Je dois :
- Analyser la question
- Proposer une réponse claire et professionnelle
- Utiliser un ton adapté (bienveillant, rassurant)
- Fournir des informations précises
- Proposer des solutions si applicable
- Anticiper les questions complémentaires

Reste professionnel et orienté solution.`,
    variables: ["question", "contexte"],
    category: "support",
    tags: ["support", "client", "question", "communication"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  {
    name: "Rédiger un email de support",
    description: "Rédiger un email de support client professionnel",
    prompt: `Rédige un email de support professionnel pour {{nomClient}}.

Sujet : {{sujet}}
Solution : {{solution}}

L'email doit être :
- Professionnel et courtois
- Clair et structuré
- Rassurant et empathique
- Orienté solution
- Avec appel à l'action si nécessaire

Utilise un ton adapté à la situation.`,
    variables: ["nomClient", "sujet", "solution"],
    category: "support",
    tags: ["support", "email", "client", "communication"],
    knowledgeFiles: ["core/identite-agence.md"],
    isSystem: true,
  },
  {
    name: "Préparer une formation produit",
    description: "Préparer une formation sur un produit d'assurance",
    prompt: `Prépare une formation de {{durée}} sur le produit {{produit}} pour {{audience}}.

Je dois préparer :
- Structure de la formation
- Contenu pédagogique (points clés, exemples)
- Supports visuels suggérés
- Exercices pratiques
- Questions/réponses anticipées
- Évaluation de compréhension

Adapte le contenu à la durée et à l'audience.`,
    variables: ["produit", "audience", "durée"],
    category: "formation",
    tags: ["formation", "produit", "pédagogie", "interne"],
    knowledgeFiles: [],
    isSystem: true,
  },
  {
    name: "Rédiger une note interne",
    description: "Rédiger une note interne professionnelle",
    prompt: `Rédige une note interne professionnelle pour {{destinataire}}.

Objet : {{objet}}
Contenu : {{contenu}}

La note doit être :
- Professionnelle et claire
- Structurée (contexte, points clés, actions)
- Concise mais complète
- Avec appel à l'action si nécessaire

Utilise un ton adapté à une communication interne.`,
    variables: ["destinataire", "objet", "contenu"],
    category: "interne",
    tags: ["interne", "note", "communication", "administration"],
    knowledgeFiles: [],
    isSystem: true,
  },
  {
    name: "Expliquer une procédure interne",
    description: "Expliquer une procédure interne de manière claire",
    prompt: `Explique la procédure {{procedure}} dans le contexte {{contexte}}.

Je dois expliquer :
- Objectif de la procédure
- Étapes détaillées
- Responsabilités
- Délais et échéances
- Documents nécessaires
- Points d'attention
- Exemples concrets

Sois clair et actionnable dans l'explication.`,
    variables: ["procedure", "contexte"],
    category: "procédure",
    tags: ["procédure", "interne", "explication", "formation"],
    knowledgeFiles: [],
    isSystem: true,
  },
  // NOUVEAUX TEMPLATES - SINISTRES (Conventions)
  {
    name: "Expliquer la Convention IRSA",
    description: "Expliquer la Convention IRSA pour les sinistres auto matériels",
    prompt: `Explique la Convention IRSA (Indemnisation et Recours des Sinistres Automobiles) pour un sinistre auto.

Type de sinistre : {{typeSinistre}}
Montant estimé : {{montant}}

Je dois expliquer :
- Périmètre d'application (au moins 2 véhicules, dommages matériels)
- Seuil conventionnel (6 500 € HT)
- Procédure simplifiée pour sinistres < 1 500 € HT
- Gestion conventionnelle vs droit commun
- Recours entre assureurs
- Conditions d'application
- Avantages de la convention

Référence : Convention IRSA (France Assureurs). Sois précis sur les seuils et conditions.`,
    variables: ["typeSinistre", "montant"],
    category: "sinistre",
    tags: ["sinistre", "irsa", "convention", "auto", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Expliquer la Convention IRCA",
    description: "Expliquer la Convention IRCA pour les sinistres auto corporels",
    prompt: `Explique la Convention IRCA (Indemnisation et Recours Corporels Automobiles) pour un sinistre auto avec dommages corporels.

Contexte : {{contexte}}

Je dois expliquer :
- Périmètre d'application (accidents auto avec dommages corporels)
- Coordination avec Convention IRSA
- Application de la loi Badinter
- Barèmes d'indemnisation standardisés
- Recours entre assureurs
- Processus d'indemnisation des victimes

Référence : Convention IRCA (France Assureurs) + Loi Badinter (1985).`,
    variables: ["contexte"],
    category: "sinistre",
    tags: ["sinistre", "irca", "convention", "corporel", "badinter", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Expliquer la Convention IRSI",
    description: "Expliquer la Convention IRSI pour les sinistres immeuble",
    prompt: `Explique la Convention IRSI (Indemnisation et Recours des Sinistres Immeuble) pour un sinistre dans un immeuble.

Type de sinistre : {{typeSinistre}} (dégâts des eaux, incendie, explosion)
Montant estimé : {{montant}}

Je dois expliquer :
- Périmètre d'application (immeubles, plusieurs assurés ou parties communes)
- Seuil conventionnel (5 000 € HT)
- Gestion directe et simplifiée sous seuil
- Recours forfaitaires entre assureurs
- Remplacement de CIDE-COP depuis 2018
- Conditions d'application

Référence : Convention IRSI (France Assureurs, 2018).`,
    variables: ["typeSinistre", "montant"],
    category: "sinistre",
    tags: ["sinistre", "irsi", "convention", "immeuble", "dégâts_des_eaux", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Déterminer gestion conventionnelle ou droit commun",
    description: "Aider à déterminer si un sinistre relève de la gestion conventionnelle ou du droit commun",
    prompt: `Détermine si ce sinistre relève de la gestion conventionnelle ou du droit commun.

Type de sinistre : {{typeSinistre}}
Montant estimé : {{montant}}
Contexte : {{contexte}}

Je dois analyser :
- Type de sinistre (auto, immeuble, etc.)
- Montant par rapport aux seuils conventionnels :
  * IRSA Auto : 6 500 € HT
  * IRSI Immeuble : 5 000 € HT
- Complexité du sinistre
- Présence de litige
- Recommandation : conventionnelle ou droit commun
- Justification de la recommandation

Sois précis sur les seuils et conditions d'application.`,
    variables: ["typeSinistre", "montant", "contexte"],
    category: "sinistre",
    tags: ["sinistre", "convention", "droit_commun", "analyse", "seuil"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Expliquer la loi Badinter",
    description: "Expliquer la loi Badinter pour les victimes d'accidents de la circulation",
    prompt: `Explique la loi Badinter (Loi n°85-677 du 5 juillet 1985) pour une victime d'accident de la circulation.

Profil de la victime : {{profilVictime}} (piéton, passager, cycliste, etc.)
Contexte : {{contexte}}

Je dois expliquer :
- Protection renforcée des victimes non conductrices
- Indemnisation quasi automatique
- Responsabilité atténuée du conducteur
- Droit à indemnisation même en cas de faute de la victime (sauf faute inexcusable)
- Coordination avec Convention IRCA
- Barèmes d'indemnisation (nomenclature Dintilhac)
- Types de préjudices indemnisables

Référence : Loi Badinter (1985). Sois clair sur les droits de la victime.`,
    variables: ["profilVictime", "contexte"],
    category: "sinistre",
    tags: ["sinistre", "badinter", "victime", "corporel", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Expliquer la nomenclature Dintilhac",
    description: "Expliquer la nomenclature Dintilhac pour l'évaluation des préjudices corporels",
    prompt: `Explique la nomenclature Dintilhac pour évaluer les préjudices corporels d'un sinistre.

Contexte : {{contexte}}

Je dois expliquer :
- Référentiel d'indemnisation des préjudices corporels
- Classification des préjudices :
  * Préjudice économique
  * Préjudice moral
  * Préjudice esthétique
  * Préjudice d'agrément
- Barèmes de référence
- Utilisation par assureurs et tribunaux
- Standardisation de l'indemnisation
- Exemples de calcul

Référence : Nomenclature Dintilhac (Cour de cassation).`,
    variables: ["contexte"],
    category: "sinistre",
    tags: ["sinistre", "dintilhac", "corporel", "indemnisation", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Expliquer les fonds de garantie (FGAO, FGTI, ONIAM)",
    description: "Expliquer le rôle des fonds de garantie pour l'indemnisation",
    prompt: `Explique le rôle des fonds de garantie pour ce sinistre.

Type de sinistre : {{typeSinistre}}
Contexte : {{contexte}}

Je dois expliquer :
- FGAO (Fonds de Garantie des Assurances Obligatoires) : accidents auto sans assureur
- FGTI (Fonds de Garantie des Victimes des actes de Terrorisme) : attentats
- ONIAM (Office National d'Indemnisation des Accidents Médicaux) : accidents médicaux
- Conditions d'intervention de chaque fonds
- Procédure d'indemnisation
- Recours possibles
- Contacts utiles

Sois précis sur le fonds applicable selon le type de sinistre.`,
    variables: ["typeSinistre", "contexte"],
    category: "sinistre",
    tags: ["sinistre", "fonds_garantie", "fgao", "fgti", "oniam", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  {
    name: "Indemnisation catastrophe naturelle (CAT-NAT)",
    description: "Expliquer l'indemnisation des catastrophes naturelles",
    prompt: `Explique l'indemnisation pour une catastrophe naturelle (CAT-NAT).

Type d'événement : {{typeEvenement}} (inondation, sécheresse, tempête, etc.)
Contexte : {{contexte}}

Je dois expliquer :
- Régime légal d'indemnisation (Code des assurances L.125-1)
- Nécessité d'un arrêté interministériel de reconnaissance
- Intervention CCR (Caisse Centrale de Réassurance) + assureurs
- Franchises légales :
  * Habitation : 380 €
  * Entreprise : 1 140 €
- Extension automatique des garanties habitation/entreprise
- Conditions d'application
- Procédure de déclaration

Référence : Code des assurances + Arrêté CAT-NAT.`,
    variables: ["typeEvenement", "contexte"],
    category: "sinistre",
    tags: ["sinistre", "cat-nat", "catastrophe_naturelle", "indemnisation", "explication"],
    knowledgeFiles: ["process/sinistres.md"],
    isSystem: true,
  },
  // NOUVEAUX TEMPLATES - PROCESSUS MÉTIER
  {
    name: "Qualifier un lead",
    description: "Qualifier un lead/prospect selon le processus métier",
    prompt: `Aide-moi à qualifier ce lead selon notre processus de qualification.

Informations du lead : {{informationsLead}}

Je dois qualifier selon :
- Profil (particulier, professionnel, entreprise)
- Besoins identifiés
- Budget approximatif
- Urgence
- Potentiel commercial
- Prochaines étapes recommandées
- Score de qualification

Référence : Processus de qualification des leads.`,
    variables: ["informationsLead"],
    category: "commercial",
    tags: ["leads", "qualification", "prospection", "commercial"],
    knowledgeFiles: ["process/leads.md"],
    isSystem: true,
  },
  {
    name: "Relance M+3 satisfaction client",
    description: "Préparer une relance M+3 pour mesurer la satisfaction client",
    prompt: `Prépare une relance M+3 (3 mois après souscription) pour mesurer la satisfaction du client {{nomClient}}.

Contrat souscrit : {{typeContrat}}
Date de souscription : {{dateSouscription}}

Je dois préparer :
- Email/appel de relance personnalisé
- Questions de satisfaction à poser
- Points à vérifier (utilisation, questions, problèmes)
- Opportunités de vente complémentaire
- Calendrier de suivi
- Actions correctives si nécessaire

Référence : Processus M+3 satisfaction client.`,
    variables: ["nomClient", "typeContrat", "dateSouscription"],
    category: "gestion",
    tags: ["m+3", "satisfaction", "relance", "client", "gestion"],
    knowledgeFiles: ["process/m-plus-3.md"],
    isSystem: true,
  },
  {
    name: "Préterme Auto - Renouvellement",
    description: "Préparer le renouvellement d'un contrat auto (préterme)",
    prompt: `Prépare le renouvellement d'un contrat auto (préterme) pour {{nomClient}}.

Contrat actuel : {{numeroContrat}}
Date d'échéance : {{dateEcheance}}
Véhicule : {{vehicule}}

Je dois préparer :
- Checklist de préparation (historique, sinistres, bonus-malus)
- Proposition de renouvellement
- Ajustements éventuels (changement véhicule, garanties)
- Courrier/email de relance
- Calendrier des actions
- Points de négociation

Référence : Processus préterme auto.`,
    variables: ["nomClient", "numeroContrat", "dateEcheance", "vehicule"],
    category: "gestion",
    tags: ["préterme", "auto", "renouvellement", "échéance", "gestion"],
    knowledgeFiles: ["process/preterme-auto.md"],
    isSystem: true,
  },
  {
    name: "Préterme Habitation - Renouvellement",
    description: "Préparer le renouvellement d'un contrat habitation (préterme)",
    prompt: `Prépare le renouvellement d'un contrat habitation (préterme) pour {{nomClient}}.

Contrat actuel : {{numeroContrat}}
Date d'échéance : {{dateEcheance}}
Bien assuré : {{bien}}

Je dois préparer :
- Checklist de préparation (historique, sinistres, changements)
- Vérification des valeurs assurées
- Proposition de renouvellement
- Ajustements éventuels (changement de situation, garanties)
- Courrier/email de relance
- Calendrier des actions

Référence : Processus préterme habitation.`,
    variables: ["nomClient", "numeroContrat", "dateEcheance", "bien"],
    category: "gestion",
    tags: ["préterme", "habitation", "renouvellement", "échéance", "gestion"],
    knowledgeFiles: ["process/preterme-ird.md"],
    isSystem: true,
  },
  {
    name: "Gérer un lead froid",
    description: "Stratégie pour relancer un lead froid",
    prompt: `Aide-moi à relancer ce lead froid.

Lead : {{nomLead}}
Dernier contact : {{dernierContact}}
Contexte : {{contexte}}

Je dois proposer :
- Stratégie de relance adaptée
- Message/email de relance personnalisé
- Timing optimal
- Arguments de relance
- Objections potentielles et réponses
- Alternatives si pas de réponse

Référence : Processus de gestion des leads.`,
    variables: ["nomLead", "dernierContact", "contexte"],
    category: "commercial",
    tags: ["leads", "relance", "prospection", "commercial"],
    knowledgeFiles: ["process/leads.md"],
    isSystem: true,
  },
  // NOUVEAUX TEMPLATES - INFORMATIONS AGENCE
  {
    name: "Trouver les horaires de l'agence",
    description: "Fournir les horaires d'ouverture de l'agence",
    prompt: `Fournis les horaires d'ouverture de l'agence pour le client {{nomClient}}.

Agence demandée : {{agence}} (Corniche ou Rouvière)

Je dois fournir :
- Horaires d'ouverture (lundi-vendredi, samedi)
- Adresse complète
- Coordonnées (téléphone, email)
- Contact WhatsApp si disponible
- Informations sur les rendez-vous

Référence : Informations agences.`,
    variables: ["nomClient", "agence"],
    category: "support",
    tags: ["agence", "horaires", "contact", "support"],
    knowledgeFiles: ["core/agences.md"],
    isSystem: true,
  },
  {
    name: "Obtenir un numéro d'assistance",
    description: "Fournir le numéro d'assistance approprié selon le type d'urgence",
    prompt: `Fournis le numéro d'assistance approprié pour cette situation.

Type d'urgence : {{typeUrgence}} (dépannage auto, plomberie, serrurerie, garde d'enfant, perte/vol carte, etc.)
Contexte : {{contexte}}

Je dois fournir :
- Numéro d'assistance approprié
- Horaires de disponibilité
- Informations sur le service
- Procédure à suivre
- Documents nécessaires si applicable

Référence : Numéros d'assistance.`,
    variables: ["typeUrgence", "contexte"],
    category: "support",
    tags: ["assistance", "urgence", "numéro", "support", "dépannage"],
    knowledgeFiles: ["core/numeros-assistance.md"],
    isSystem: true,
  },
  {
    name: "Générer un lien de devis personnalisé",
    description: "Fournir un lien de devis personnalisé avec code agence",
    prompt: `Génère un lien de devis personnalisé pour le client {{nomClient}}.

Type de devis : {{typeDevis}} (auto, habitation, santé, etc.)
Code agence : H91358

Je dois fournir :
- Lien de devis personnalisé avec code agence
- Instructions pour utiliser le lien
- Informations sur le suivi du devis
- Contact pour assistance

Référence : Liens de devis.`,
    variables: ["nomClient", "typeDevis"],
    category: "commercial",
    tags: ["devis", "lien", "code_agence", "commercial"],
    knowledgeFiles: ["core/liens-devis.md"],
    isSystem: true,
  },
  {
    name: "Prendre rendez-vous en agence",
    description: "Aider à organiser un rendez-vous en agence",
    prompt: `Aide-moi à organiser un rendez-vous en agence pour {{nomClient}}.

Agence : {{agence}} (Corniche ou Rouvière)
Objectif : {{objectif}}
Préférence horaire : {{horaire}}

Je dois préparer :
- Disponibilités de l'agence
- Proposition de créneaux
- Informations à communiquer au client
- Documents à préparer
- Confirmation du rendez-vous

Référence : Informations agences et liens de devis.`,
    variables: ["nomClient", "agence", "objectif", "horaire"],
    category: "gestion",
    tags: ["agence", "rendez-vous", "planning", "gestion"],
    knowledgeFiles: ["core/agences.md", "core/liens-devis.md"],
    isSystem: true,
  },
  {
    name: "Contact WhatsApp agence",
    description: "Fournir les informations de contact WhatsApp de l'agence",
    prompt: `Fournis les informations de contact WhatsApp de l'agence pour {{nomClient}}.

Agence : {{agence}} (Corniche ou Rouvière)

Je dois fournir :
- Numéro WhatsApp de l'agence
- Horaires de disponibilité WhatsApp
- Types de demandes traitées par WhatsApp
- Temps de réponse habituel
- Alternative si WhatsApp indisponible

Référence : Informations agences.`,
    variables: ["nomClient", "agence"],
    category: "support",
    tags: ["whatsapp", "contact", "agence", "support", "communication"],
    knowledgeFiles: ["core/agences.md"],
    isSystem: true,
  },
  // NOUVEAUX TEMPLATES - PRODUITS SPÉCIFIQUES
  {
    name: "Expliquer le bonus-malus auto",
    description: "Expliquer le système bonus-malus (coefficient de réduction majoration)",
    prompt: `Explique le système bonus-malus (CRM - Coefficient de Réduction Majoration) pour un contrat auto.

Coefficient actuel : {{coefficient}}
Historique : {{historique}}

Je dois expliquer :
- Fonctionnement du bonus-malus
- Calcul du coefficient (départ, évolution)
- Impact sur la prime
- Transfert de bonus entre véhicules
- Perte de bonus en cas de sinistre
- Récupération du bonus
- Exemples de calcul

Référence : Assurance VTM Allianz - Bonus-malus.`,
    variables: ["coefficient", "historique"],
    category: "iard",
    tags: ["auto", "bonus_malus", "crm", "explication", "calcul"],
    knowledgeFiles: ["produits/assurance-vtm-allianz.md"],
    isSystem: true,
  },
  {
    name: "Transfert de bonus entre véhicules",
    description: "Expliquer le transfert de bonus-malus entre véhicules",
    prompt: `Explique le transfert de bonus-malus entre deux véhicules pour {{nomClient}}.

Ancien véhicule : {{ancienVehicule}} (coefficient : {{ancienCoefficient}})
Nouveau véhicule : {{nouveauVehicule}}

Je dois expliquer :
- Conditions de transfert
- Procédure à suivre
- Documents nécessaires
- Délais et échéances
- Impact sur la prime du nouveau véhicule
- Points d'attention

Référence : Assurance VTM Allianz - Transfert de bonus.`,
    variables: ["nomClient", "ancienVehicule", "ancienCoefficient", "nouveauVehicule"],
    category: "iard",
    tags: ["auto", "bonus_malus", "transfert", "modification"],
    knowledgeFiles: ["produits/assurance-vtm-allianz.md"],
    isSystem: true,
  },
  {
    name: "PER - Avantages fiscaux",
    description: "Expliquer les avantages fiscaux du Plan Épargne Retraite",
    prompt: `Explique les avantages fiscaux du PER (Plan Épargne Retraite) pour {{nomClient}}.

Profil : {{profil}} (salarié, TNS, etc.)
Tranche d'imposition : {{trancheImposition}}

Je dois expliquer :
- Mécanismes fiscaux (déduction des cotisations)
- Économies d'impôt réalisables
- Plafonds de déduction
- Exemples chiffrés selon le profil
- Conditions d'éligibilité
- Optimisations possibles
- Fiscalité au déblocage

Référence : Produits épargne retraite.`,
    variables: ["nomClient", "profil", "trancheImposition"],
    category: "retraite",
    tags: ["retraite", "per", "fiscal", "avantages", "explication"],
    knowledgeFiles: ["produits/epargne.md"],
    isSystem: true,
  },
  {
    name: "Prévoyance TNS (Travailleurs Non Salariés)",
    description: "Expliquer les garanties prévoyance pour les TNS",
    prompt: `Explique les garanties prévoyance adaptées aux TNS (Travailleurs Non Salariés) pour {{nomClient}}.

Activité : {{activite}}
Revenus : {{revenus}}

Je dois expliquer :
- Garanties spécifiques TNS (décès, invalidité, incapacité)
- Capital recommandé selon l'activité
- Avantages de la prévoyance TNS
- Comparaison avec prévoyance salarié
- Optimisations possibles
- Points d'attention spécifiques TNS

Référence : Produits prévoyance TNS.`,
    variables: ["nomClient", "activite", "revenus"],
    category: "prévoyance",
    tags: ["prévoyance", "tns", "travailleur_non_salarié", "explication", "conseil"],
    knowledgeFiles: ["produits/prevoyance.md"],
    isSystem: true,
  },
];

/**
 * Remplacer les variables dans un template par leurs valeurs
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Extraire les variables d'un template
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

/**
 * Rechercher des templates par tags
 */
export function searchTemplatesByTags(
  templates: PromptTemplate[],
  tags: string[]
): PromptTemplate[] {
  if (tags.length === 0) {
    return templates;
  }
  
  return templates.filter(template => 
    tags.some(tag => template.tags?.includes(tag))
  );
}


