# Catalogue des Templates Assistant IA

Ce document liste toutes les amorces de chat possibles pour l'assistant IA, organisées par catégories métier pour une agence d'assurance Allianz.

## 📋 Guide d'utilisation

- **Format** : Chaque template peut être utilisé directement comme prompt dans l'assistant
- **Variables** : Les variables `{{variable}}` peuvent être remplacées par des valeurs réelles
- **Tags** : Permettent de filtrer et rechercher les templates par domaine
- **Catégories** : Organisation par domaine métier de l'assurance

---

## 🎯 COMMERCIAL

### 1. Trouver les bons arguments de vente
**Description** : Aide à identifier les arguments de vente adaptés à la situation  
**Tags** : `commercial`, `vente`, `argumentaire`  
**Variables** : Aucune (le bot pose des questions)  
**Exemple** : "Je vais t'aider à trouver les bons arguments de vente. Quel produit veux-tu vendre ?"

### 2. Rédiger un email de relance client
**Description** : Rédiger un email professionnel de relance pour un client  
**Tags** : `commercial`, `email`, `relance`  
**Variables** : `{{nomClient}}`, `{{sujet}}`  
**Exemple** : "Rédige un email de relance professionnel pour le client {{nomClient}} concernant {{sujet}}."

### 3. Générer un devis personnalisé
**Description** : Générer un devis personnalisé basé sur les besoins du client  
**Tags** : `commercial`, `devis`, `proposition`  
**Variables** : `{{nomClient}}`, `{{typeAssurance}}`, `{{besoins}}`, `{{budget}}`  
**Exemple** : "Génère un devis personnalisé pour {{nomClient}} avec type d'assurance {{typeAssurance}}."

### 4. Préparer un appel commercial
**Description** : Préparer un appel commercial avec checklist et arguments  
**Tags** : `commercial`, `appel`, `prospection`  
**Variables** : `{{nomClient}}`, `{{produit}}`, `{{contexte}}`  
**Exemple** : "Prépare-moi un appel commercial pour {{nomClient}} concernant {{produit}}."

### 5. Répondre à une objection client
**Description** : Trouver des réponses argumentées à une objection  
**Tags** : `commercial`, `objection`, `argumentaire`  
**Variables** : `{{objection}}`, `{{produit}}`  
**Exemple** : "Comment répondre à l'objection '{{objection}}' pour le produit {{produit}} ?"

### 6. Analyser un besoin client
**Description** : Analyser les besoins d'un client pour proposer la meilleure solution  
**Tags** : `commercial`, `analyse`, `conseil`  
**Variables** : `{{profilClient}}`, `{{situation}}`  
**Exemple** : "Analyse les besoins d'un client {{profilClient}} dans cette situation : {{situation}}."

---

## 📊 GESTION

### 1. Résumer une conversation téléphonique
**Description** : Résumer une conversation téléphonique avec un client  
**Tags** : `gestion`, `résumé`, `téléphone`  
**Variables** : `{{nomClient}}`  
**Exemple** : "Résume la conversation téléphonique avec {{nomClient}} en incluant les points principaux."

### 2. Préparer un renouvellement de contrat
**Description** : Préparer la relance et le renouvellement d'un contrat  
**Tags** : `gestion`, `renouvellement`, `contrat`  
**Variables** : `{{nomClient}}`, `{{typeContrat}}`, `{{dateEcheance}}`  
**Exemple** : "Prépare le renouvellement du contrat {{typeContrat}} pour {{nomClient}} échéant le {{dateEcheance}}."

### 3. Rédiger un courrier administratif
**Description** : Rédiger un courrier administratif professionnel  
**Tags** : `gestion`, `courrier`, `administration`  
**Variables** : `{{destinataire}}`, `{{objet}}`, `{{contenu}}`  
**Exemple** : "Rédige un courrier administratif pour {{destinataire}} concernant {{objet}}."

### 4. Vérifier la conformité d'un dossier
**Description** : Vérifier qu'un dossier est complet et conforme  
**Tags** : `gestion`, `conformité`, `dossier`  
**Variables** : `{{typeDossier}}`, `{{documents}}`  
**Exemple** : "Vérifie la conformité d'un dossier {{typeDossier}} avec ces documents : {{documents}}."

### 5. Préparer un rendez-vous client
**Description** : Préparer un rendez-vous avec checklist et ordre du jour  
**Tags** : `gestion`, `rendez-vous`, `planning`  
**Variables** : `{{nomClient}}`, `{{objectif}}`, `{{durée}}`  
**Exemple** : "Prépare un rendez-vous de {{durée}} avec {{nomClient}} pour {{objectif}}."

### 6. Gérer un changement de situation
**Description** : Gérer un changement de situation client (déménagement, mariage, etc.)  
**Tags** : `gestion`, `changement`, `modification`  
**Variables** : `{{nomClient}}`, `{{changement}}`, `{{typeContrat}}`  
**Exemple** : "Comment gérer le changement {{changement}} pour {{nomClient}} sur son contrat {{typeContrat}} ?"

---

## 🚨 SINISTRE

### 1. Déclarer un sinistre
**Description** : Guider la déclaration d'un sinistre étape par étape  
**Tags** : `sinistre`, `déclaration`, `procédure`  
**Variables** : `{{typeSinistre}}`, `{{client}}`  
**Exemple** : "Guide-moi pour déclarer un sinistre {{typeSinistre}} pour {{client}}."

### 2. Suivre un dossier sinistre
**Description** : Expliquer le suivi et les étapes d'un dossier sinistre  
**Tags** : `sinistre`, `suivi`, `dossier`  
**Variables** : `{{numeroDossier}}`, `{{typeSinistre}}`  
**Exemple** : "Quelles sont les étapes de suivi pour le dossier sinistre {{numeroDossier}} ?"

### 3. Préparer une expertise
**Description** : Préparer et organiser une expertise de sinistre  
**Tags** : `sinistre`, `expertise`, `évaluation`  
**Variables** : `{{typeSinistre}}`, `{{dommages}}`  
**Exemple** : "Comment préparer une expertise pour un sinistre {{typeSinistre}} avec {{dommages}} ?"

### 4. Calculer une indemnisation
**Description** : Expliquer le calcul d'une indemnisation  
**Tags** : `sinistre`, `indemnisation`, `calcul`  
**Variables** : `{{typeSinistre}}`, `{{montantDommages}}`  
**Exemple** : "Comment calculer l'indemnisation pour un sinistre {{typeSinistre}} avec dommages de {{montantDommages}} ?"

### 5. Gérer un litige sinistre
**Description** : Gérer un litige ou une contestation de sinistre  
**Tags** : `sinistre`, `litige`, `contestation`  
**Variables** : `{{numeroDossier}}`, `{{motifContestation}}`  
**Exemple** : "Comment gérer le litige sur le dossier {{numeroDossier}} pour {{motifContestation}} ?"

### 6. Rédiger un rapport de sinistre
**Description** : Rédiger un rapport de sinistre professionnel  
**Tags** : `sinistre`, `rapport`, `documentation`  
**Variables** : `{{typeSinistre}}`, `{{faits}}`  
**Exemple** : "Rédige un rapport de sinistre {{typeSinistre}} avec ces faits : {{faits}}."

---

## 🏠 IARD (Incendie, Accidents, Risques Divers)

### 1. Analyser un contrat d'assurance habitation
**Description** : Analyser un contrat d'assurance habitation et extraire les points clés  
**Tags** : `iard`, `habitation`, `analyse`  
**Variables** : `{{nomClient}}`  
**Exemple** : "Analyse le contrat d'assurance habitation pour {{nomClient}} et extrait les garanties."

### 2. Comparer des offres d'assurance auto
**Description** : Comparer deux offres d'assurance automobile  
**Tags** : `iard`, `auto`, `comparaison`  
**Variables** : `{{offre1}}`, `{{offre2}}`  
**Exemple** : "Compare les deux offres d'assurance auto : {{offre1}} et {{offre2}}."

### 3. Expliquer les garanties IARD
**Description** : Expliquer les garanties d'une assurance IARD  
**Tags** : `iard`, `garanties`, `explication`  
**Variables** : `{{typeAssurance}}`, `{{niveauGarantie}}`  
**Exemple** : "Explique les garanties d'une assurance {{typeAssurance}} avec niveau {{niveauGarantie}}."

### 4. Calculer une prime IARD
**Description** : Expliquer le calcul d'une prime d'assurance IARD  
**Tags** : `iard`, `prime`, `calcul`  
**Variables** : `{{typeAssurance}}`, `{{caracteristiques}}`  
**Exemple** : "Comment calculer la prime pour une assurance {{typeAssurance}} avec {{caracteristiques}} ?"

### 5. Gérer un changement de véhicule
**Description** : Gérer le changement de véhicule sur un contrat auto  
**Tags** : `iard`, `auto`, `modification`  
**Variables** : `{{nomClient}}`, `{{ancienVehicule}}`, `{{nouveauVehicule}}`  
**Exemple** : "Comment gérer le changement de véhicule pour {{nomClient}} de {{ancienVehicule}} vers {{nouveauVehicule}} ?"

### 6. Préparer un devis IARD professionnel
**Description** : Préparer un devis pour une assurance professionnelle  
**Tags** : `iard`, `professionnel`, `devis`  
**Variables** : `{{entreprise}}`, `{{activite}}`, `{{risques}}`  
**Exemple** : "Prépare un devis assurance professionnelle pour {{entreprise}} ({{activite}}) avec risques {{risques}}."

---

## 🏥 SANTÉ

### 1. Expliquer une garantie santé individuelle
**Description** : Expliquer les garanties d'une assurance santé individuelle  
**Tags** : `santé`, `individuelle`, `garanties`  
**Variables** : `{{formule}}`, `{{niveauCouverture}}`  
**Exemple** : "Explique les garanties de la formule {{formule}} avec niveau {{niveauCouverture}}."

### 2. Comparer des mutuelles santé
**Description** : Comparer différentes offres de mutuelles santé  
**Tags** : `santé`, `mutuelle`, `comparaison`  
**Variables** : `{{offre1}}`, `{{offre2}}`  
**Exemple** : "Compare les mutuelles {{offre1}} et {{offre2}} pour un particulier."

### 3. Préparer un devis santé collective
**Description** : Préparer un devis pour une assurance santé collective  
**Tags** : `santé`, `collective`, `devis`  
**Variables** : `{{entreprise}}`, `{{nombreSalaries}}`, `{{budget}}`  
**Exemple** : "Prépare un devis santé collective pour {{entreprise}} avec {{nombreSalaries}} salariés et budget {{budget}}."

### 4. Expliquer le remboursement santé
**Description** : Expliquer le processus de remboursement santé  
**Tags** : `santé`, `remboursement`, `procédure`  
**Variables** : `{{typeSoin}}`, `{{formule}}`  
**Exemple** : "Comment fonctionne le remboursement pour {{typeSoin}} avec la formule {{formule}} ?"

### 5. Gérer un changement de situation santé
**Description** : Gérer un changement de situation (mariage, naissance, etc.) sur un contrat santé  
**Tags** : `santé`, `changement`, `modification`  
**Variables** : `{{nomClient}}`, `{{changement}}`  
**Exemple** : "Comment gérer le changement {{changement}} pour {{nomClient}} sur son contrat santé ?"

### 6. Analyser des besoins santé
**Description** : Analyser les besoins santé d'un client pour proposer la meilleure formule  
**Tags** : `santé`, `analyse`, `conseil`  
**Variables** : `{{profilClient}}`, `{{besoins}}`  
**Exemple** : "Analyse les besoins santé d'un client {{profilClient}} avec {{besoins}}."

---

## 💼 PRÉVOYANCE

### 1. Expliquer une garantie prévoyance
**Description** : Expliquer les garanties d'une assurance prévoyance  
**Tags** : `prévoyance`, `garanties`, `explication`  
**Variables** : `{{typeGarantie}}`, `{{montant}}`  
**Exemple** : "Explique la garantie prévoyance {{typeGarantie}} avec un capital de {{montant}}."

### 2. Calculer une prime prévoyance
**Description** : Expliquer le calcul d'une prime d'assurance prévoyance  
**Tags** : `prévoyance`, `prime`, `calcul`  
**Variables** : `{{age}}`, `{{profession}}`, `{{capital}}`  
**Exemple** : "Comment calculer la prime prévoyance pour un client de {{age}} ans, {{profession}}, avec capital {{capital}} ?"

### 3. Préparer un devis prévoyance
**Description** : Préparer un devis d'assurance prévoyance personnalisé  
**Tags** : `prévoyance`, `devis`, `proposition`  
**Variables** : `{{nomClient}}`, `{{besoins}}`, `{{budget}}`  
**Exemple** : "Prépare un devis prévoyance pour {{nomClient}} avec besoins {{besoins}} et budget {{budget}}."

### 4. Expliquer la garantie décès
**Description** : Expliquer en détail la garantie décès d'une assurance prévoyance  
**Tags** : `prévoyance`, `décès`, `garantie`  
**Variables** : `{{capital}}`, `{{bénéficiaires}}`  
**Exemple** : "Explique la garantie décès avec capital {{capital}} et bénéficiaires {{bénéficiaires}}."

### 5. Gérer un sinistre prévoyance
**Description** : Guider la gestion d'un sinistre prévoyance (invalidité, décès, etc.)  
**Tags** : `prévoyance`, `sinistre`, `indemnisation`  
**Variables** : `{{typeSinistre}}`, `{{nomClient}}`  
**Exemple** : "Comment gérer un sinistre prévoyance {{typeSinistre}} pour {{nomClient}} ?"

### 6. Comparer des offres prévoyance
**Description** : Comparer différentes offres d'assurance prévoyance  
**Tags** : `prévoyance`, `comparaison`, `offres`  
**Variables** : `{{offre1}}`, `{{offre2}}`  
**Exemple** : "Compare les offres prévoyance {{offre1}} et {{offre2}}."

---

## 🏦 RETRAITE

### 1. Expliquer un contrat retraite complémentaire
**Description** : Expliquer un contrat de retraite complémentaire  
**Tags** : `retraite`, `complémentaire`, `explication`  
**Variables** : `{{typeContrat}}`, `{{versements}}`  
**Exemple** : "Explique le contrat retraite {{typeContrat}} avec versements de {{versements}}."

### 2. Calculer une pension de retraite
**Description** : Expliquer le calcul d'une pension de retraite  
**Tags** : `retraite`, `pension`, `calcul`  
**Variables** : `{{age}}`, `{{annéesCotisation}}`, `{{salaire}}`  
**Exemple** : "Comment calculer la pension de retraite pour {{age}} ans, {{annéesCotisation}} années de cotisation, salaire {{salaire}} ?"

### 3. Préparer un devis épargne retraite
**Description** : Préparer un devis pour un produit d'épargne retraite  
**Tags** : `retraite`, `épargne`, `devis`  
**Variables** : `{{nomClient}}`, `{{objectif}}`, `{{horizon}}`  
**Exemple** : "Prépare un devis épargne retraite pour {{nomClient}} avec objectif {{objectif}} et horizon {{horizon}}."

### 4. Expliquer les avantages fiscaux retraite
**Description** : Expliquer les avantages fiscaux de l'épargne retraite  
**Tags** : `retraite`, `fiscal`, `avantages`  
**Variables** : `{{typeProduit}}`, `{{trancheImposition}}`  
**Exemple** : "Explique les avantages fiscaux du produit {{typeProduit}} pour la tranche {{trancheImposition}}."

### 5. Gérer un rachat retraite
**Description** : Expliquer la procédure de rachat d'un contrat retraite  
**Tags** : `retraite`, `rachat`, `procédure`  
**Variables** : `{{nomClient}}`, `{{montant}}`  
**Exemple** : "Comment gérer un rachat retraite de {{montant}} pour {{nomClient}} ?"

### 6. Comparer des produits retraite
**Description** : Comparer différents produits d'épargne retraite  
**Tags** : `retraite`, `comparaison`, `produits`  
**Variables** : `{{produit1}}`, `{{produit2}}`  
**Exemple** : "Compare les produits retraite {{produit1}} et {{produit2}}."

---

## 🔧 AUTRES

### 1. Répondre à une question client
**Description** : Aider à répondre à une question client de manière professionnelle  
**Tags** : `support`, `client`, `question`  
**Variables** : `{{question}}`, `{{contexte}}`  
**Exemple** : "Comment répondre professionnellement à cette question : {{question}} ?"

### 2. Rédiger un email de support
**Description** : Rédiger un email de support client professionnel  
**Tags** : `support`, `email`, `client`  
**Variables** : `{{nomClient}}`, `{{sujet}}`, `{{solution}}`  
**Exemple** : "Rédige un email de support pour {{nomClient}} concernant {{sujet}} avec solution {{solution}}."

### 3. Préparer une formation produit
**Description** : Préparer une formation sur un produit d'assurance  
**Tags** : `formation`, `produit`, `pédagogie`  
**Variables** : `{{produit}}`, `{{audience}}`, `{{durée}}`  
**Exemple** : "Prépare une formation de {{durée}} sur le produit {{produit}} pour {{audience}}."

### 4. Analyser un contrat d'assurance
**Description** : Analyser un contrat d'assurance et extraire les points clés  
**Tags** : `analyse`, `contrat`, `documentation`  
**Variables** : Aucune  
**Exemple** : "Analyse le contrat d'assurance fourni et extrait les points clés."

### 5. Rédiger une note interne
**Description** : Rédiger une note interne professionnelle  
**Tags** : `interne`, `note`, `communication`  
**Variables** : `{{destinataire}}`, `{{objet}}`, `{{contenu}}`  
**Exemple** : "Rédige une note interne pour {{destinataire}} concernant {{objet}}."

### 6. Expliquer une procédure interne
**Description** : Expliquer une procédure interne de manière claire  
**Tags** : `procédure`, `interne`, `explication`  
**Variables** : `{{procedure}}`, `{{contexte}}`  
**Exemple** : "Explique la procédure {{procedure}} dans le contexte {{contexte}}."

---

## 📊 Statistiques

- **Total de templates** : 48 templates
- **Catégories** : 8 domaines métier
- **Templates par catégorie** : 6 templates en moyenne

## 🔄 Mise à jour

Ce catalogue est évolutif et peut être enrichi selon les besoins de l'agence.  
Pour ajouter un nouveau template, suivre le format existant avec nom, description, tags et variables.

---

*Document créé le : 2025-12-21*  
*Dernière mise à jour : 2025-12-21*

