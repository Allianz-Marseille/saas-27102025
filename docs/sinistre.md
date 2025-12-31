# Sinistre

## Accès

- **Condition d'accès** : Uniquement pour les utilisateurs connectés en tant qu'admin
- **Point d'entrée** : Bouton "Sinistre" dans la sidebar
- **Page** : Nouvelle page dédiée au pilotage des sinistres

### Permissions

- **Admin** : Accès complet (lecture, modification, suppression, import de fichiers Excel)
- **Chargé de clientèle** : Accès à tous les sinistres
  - Peut lire et modifier tous les sinistres
  - Possibilité d'ajouter des notes/commentaires
  - Ne peut pas accéder aux fonctions d'administration (ex : import de fichiers Excel)
  - Après qu'un admin ait importé un fichier Excel, les chargés de clientèle voient immédiatement le résultat de cet import, au même titre que les admins

## Données sources

- **Source principale** : Fichiers Excel exportés directement depuis le CRM Lagon
- **Format** : Fichier Excel (`.xlsx`) - Format standard Microsoft Excel
- **Format stable** : ⚠️ **Important** : Les fichiers Excel exportés depuis le CRM Lagon ont **toujours le même format**. La structure des colonnes, l'ordre des données et le format des valeurs sont constants. Cette stabilité permet de s'appuyer sur une structure fixe pour l'implémentation du parser.
- **Convention de nommage** : Le nom du fichier peut contenir la date (ex: `LISTE SINISTRES202512311032.xlsx`)
  - Pour l'import initial (Point 0) : Utiliser le fichier Excel du 29 décembre 2025
  - Pour les imports ultérieurs : Utiliser le fichier Excel le plus récent exporté depuis Lagon
- **Structure** : Fichier Excel avec une feuille de calcul contenant les données, colonnes dans l'ordre suivant (format fixe et constant) :
  1. Nom du client
  2. Numéro Lagon du client
  3. Numéro de la police
  4. Catégorie de la police
  5. Type de produit
  6. Numéro de sinistre
  7. Date de survenance
  8. Montant déjà payé
  9. Reste à payer
  10. Recours
  11. Garantie sinistrée

### Structure des lignes

- **Lignes complètes** : Chaque ligne de la feuille Excel représente un sinistre avec toutes les informations
- **Lignes partielles** : Parfois, des lignes contiennent uniquement une information dans la colonne "Montant déjà payé"
  - Dans ce cas, le montant payé doit être rattaché à la première ligne supérieure qui est pleinement renseignée (avec nom, numéro client, etc.)
  - Détection automatique : une ligne est considérée comme partielle si seule la colonne "Montant déjà payé" (colonne 8) contient une valeur
- **Multiplicité** : Un sinistre pour un client peut avoir plusieurs lignes (ligne principale + lignes de montants payés supplémentaires)
- **Gestion des en-têtes** : ⚠️ **Important** : La première ligne du fichier Excel contient **toujours les en-têtes de colonne**. Cette ligne doit être **ignorée lors du parsing** et les données commencent à partir de la deuxième ligne

## Implémentation

### Initialisation (Point 0)

- **Source de données** : Fichier Excel exporté depuis le CRM Lagon
- **Fichier initial** : Fichier Excel du 29 décembre 2025 (ex: `LISTE SINISTRES202512291032.xlsx` ou similaire)
- **Création de la base de données** : Importer les données du fichier Excel initial dans Firebase (Firestore)
- Ce fichier servira de point de départ (point 0) pour la base de données des sinistres
- **Collection Firestore** : Créer une collection `sinistres` dans Firestore pour stocker les données
- **Script d'import** : `scripts/import-sinistres-initial.ts` (utilise la bibliothèque `xlsx` pour parser le fichier Excel)

### Import de fichiers Excel

- **Source principale** : Fichiers Excel exportés directement depuis le CRM Lagon
- **Workflow d'import** :
  1. Export du fichier Excel depuis le CRM Lagon (format `.xlsx`)
  2. Upload du fichier Excel depuis le frontend via un bouton "Importer un fichier Excel"
  3. Le système parse automatiquement le fichier Excel (première feuille de calcul)
  4. Import automatique des nouveaux sinistres uniquement (déduplication basée sur `policyNumber`)
  5. Affichage d'un rapport d'import : X nouveaux sinistres importés, Y sinistres déjà existants ignorés
- **Interface** : 
  - Bouton d'upload de fichier Excel visible uniquement pour les administrateurs sur la page admin dédiée aux sinistres
  - Zone de drag & drop ou sélection de fichier
  - Indicateur de progression pendant l'import
- **Bibliothèque utilisée** : `xlsx` (SheetJS) pour parser les fichiers Excel
- **Version** : Le nom du fichier Excel est utilisé comme `excelVersion` pour tracer l'origine des données
- **Gestion des feuilles** : Par défaut, le système utilise la première feuille de calcul du fichier Excel

#### Logique de déduplication et comparaison

- **Source de vérité pour l'identification** : Le numéro de contrat (Numéro de la police - colonne 3 du fichier Excel)
- **Comparaison avec l'existant** : Lors d'un nouvel upload, comparer systématiquement avec les sinistres déjà enregistrés dans Firebase
- **Règle de non-réintégration** :
  - Si un sinistre existe déjà en base de données (même numéro de contrat), **ne pas le réintégrer**
  - Les sinistres existants ont déjà été affectés, gérés, modifiés manuellement (route, statut, notes, etc.)
  - Préserver toutes les modifications manuelles existantes
- **Intégration uniquement des nouveaux** :
  - Importer uniquement les sinistres avec un numéro de contrat **inconnu** (non présent en base)
  - Les nouveaux sinistres sont créés avec les données du fichier Excel
- **Gestion des versions** :
  - Chaque import utilise le nom du fichier Excel comme version
  - Conserver l'historique des versions précédentes via le champ `excelVersion`
  - Permettre de comparer les versions (diff)
  - Identifier les sinistres nouveaux, modifiés ou supprimés entre deux versions
  - Afficher un rapport après l'import : X nouveaux sinistres importés, Y sinistres déjà existants ignorés

### Mapping Excel → Base de données

Correspondance entre les colonnes du fichier Excel et les champs de la base de données :

| Colonne Excel | Champ Base de données | Notes |
|---------------|----------------------|-------|
| 1. Nom du client | `clientName` | |
| 2. Numéro Lagon du client | `clientLagonNumber` | Identifiant unique client |
| 3. Numéro de la police | `policyNumber` | **Source de vérité pour la déduplication** |
| 4. Catégorie de la police | `policyCategory` | |
| 5. Type de produit | `productType` | |
| 6. Numéro de sinistre | `claimNumber` | Identifiant unique sinistre |
| 7. Date de survenance | `incidentDate` | Format date Excel à parser (peut être un nombre de jours depuis 1900 ou une date) |
| 8. Montant déjà payé | `amountPaid` | Peut être multiple (lignes partielles) |
| 9. Reste à payer | `remainingAmount` | |
| 10. Recours | `recourse` | Booléen ou texte |
| 11. Garantie sinistrée | `damagedCoverage` | Correspond au type de garantie |

**Champs calculés/ajoutés lors de l'import** :
- `totalAmountPaid` : Somme de tous les montants payés (lignes principales + partielles)
- `totalAmount` : `amountPaid` + `remainingAmount`
- `importDate` : Date d'import du fichier Excel
- `excelVersion` : Nom du fichier Excel source (ex: `LISTE SINISTRES202512311032.xlsx`)

**Notes techniques sur le parsing Excel** :
- **Format stable** : Le format des fichiers Excel étant constant, le parser peut s'appuyer sur une structure fixe (11 colonnes dans un ordre déterminé), ce qui simplifie l'implémentation et réduit les risques d'erreurs
- **Première ligne = en-têtes** : La première ligne du fichier Excel contient toujours les en-têtes de colonne et doit être ignorée lors du parsing (les données commencent à la ligne 2)
- Utilisation de la bibliothèque `xlsx` (SheetJS) pour lire les fichiers Excel
- Gestion des formats de date Excel (conversion depuis le format Excel vers Date JavaScript)
- Gestion des formats numériques (montants avec séparateurs de milliers, décimales)
- Détection automatique des lignes partielles (lignes avec seulement le montant payé rempli)

### Implémentation technique de l'import Excel

#### Bibliothèque requise
- **`xlsx`** (SheetJS) : Bibliothèque JavaScript pour lire et écrire des fichiers Excel
- Installation : `npm install xlsx` ou `npm install xlsx @types/xlsx` (pour TypeScript)

#### Workflow d'import depuis le frontend

1. **Upload du fichier** :
   - L'utilisateur sélectionne ou glisse-dépose un fichier Excel (`.xlsx`) depuis l'interface
   - Le fichier est envoyé via une requête POST multipart/form-data vers `/api/sinistres/upload-excel`

2. **Traitement côté serveur** :
   - Le serveur reçoit le fichier Excel
   - Utilisation de `xlsx.readFile()` ou `xlsx.read()` pour parser le fichier
   - Extraction de la première feuille de calcul
   - **Ignorer la première ligne** : La première ligne (index 0) contient les en-têtes de colonne et doit être ignorée
   - **Parsing par index de colonnes** : Grâce au format stable, le parser peut accéder directement aux colonnes par leur index (0-10) à partir de la deuxième ligne
   - Conversion des lignes en objets JavaScript selon la structure fixe
   - Application de la logique de déduplication (comparaison avec les `policyNumber` existants)
   - Import en batch dans Firestore des nouveaux sinistres uniquement

3. **Gestion des formats Excel** :
   - **Dates** : Conversion depuis le format Excel (nombre de jours depuis le 1er janvier 1900) vers Date JavaScript
   - **Montants** : Gestion des formats numériques français (virgule comme séparateur décimal, espace comme séparateur de milliers)
   - **Lignes partielles** : Détection des lignes où seule la colonne "Montant déjà payé" est remplie

4. **Rapport d'import** :
   - Retour d'un rapport JSON contenant :
     - Nombre total de lignes traitées
     - Nombre de nouveaux sinistres importés
     - Nombre de sinistres existants ignorés
     - Liste des erreurs éventuelles (lignes avec des données invalides)

#### Structure de l'API route

```typescript
// app/api/sinistres/upload-excel/route.ts
POST /api/sinistres/upload-excel
- Body: FormData avec le fichier Excel
- Response: {
    success: boolean,
    result: {
      totalLines: number,
      newSinistres: number,
      existingSinistres: number,
      errors: Array<{ line: number; error: string }>,
      excelVersion: string,
      importDate: Date
    }
  }
```

#### Script d'import initial

```typescript
// scripts/import-sinistres-initial.ts
- Lit le fichier Excel depuis le système de fichiers
- Parse le fichier avec xlsx
- Importe toutes les données dans Firestore (sans déduplication pour le point 0)
- Génère un rapport d'import
```

## Outil de pilotage

### Interface utilisateur

- **Modale explicative des routes** : Sur le tableau de bord, prévoir une modale qui explique les 6 routes de gestion (A à F)
  - Accessible depuis le tableau de bord pour aider les utilisateurs à comprendre le système de routes
  - Contient les informations détaillées sur chaque route (quand l'utiliser, étapes typiques, contexte)

### Alertes

- **Dossiers qui traînent** : Système d'alertes pour identifier les sinistres en attente ou nécessitant un suivi particulier

### Identification et filtrage

- **Critères de filtrage** :
  - Année
  - Mois
  - Semaine
  - Type de garantie sinistrée
  - Route (A/B/C/D/E/F)
  - Statut
  - Chargé de clientèle (affecté à)
  - Date de survenance (plage de dates)
  - Montant (min/max)
  - Présence de tiers (oui/non)
  - Recours (oui/non)

### Recherche

- **Fonctionnalité** : Recherche textuelle dans les sinistres
- **Champs recherchables** :
  - Nom du client
  - Numéro Lagon du client
  - Numéro de la police
  - Numéro de sinistre
  - Type de produit
  - Garantie sinistrée
  - Notes/Commentaires
- **Recherche avancée** : Combinaison de critères de filtrage + recherche textuelle

### KPIs (Indicateurs de performance)

#### KPIs permanents (affichés en permanence sur le tableau de bord)

1. **Nombre de sinistres ouverts** (à minima)
2. **Nombre de sinistres en retard / avec alertes** (dossiers qui traînent)
3. **Nombre de sinistres non affectés** (sans chargé de clientèle)
4. **Montant total des sinistres ouverts** (somme des montants restants à payer)
5. **Nombre de sinistres par route** (répartition A/B/C/D/E/F)
6. **Nombre de sinistres par statut** (répartition des statuts)
7. **Sinistres en attente de pièces** (depuis plus de X jours)
8. **Délai moyen de traitement** (jours depuis ouverture)
9. **Taux de clôture** (sinistres clos / sinistres totaux)
10. **Sinistres avec recours** (nombre et montant)

#### KPIs contextuels (selon filtres appliqués)

- **Métriques** : Indicateurs de performance qui respectent la logique de filtrage par année, mois, semaine et type de garantie sinistrée
- **Affichage** : KPIs adaptés selon les critères de filtrage sélectionnés
- **Comparaisons** : Possibilité de comparer les KPIs entre différentes périodes (mois précédent, année précédente, etc.)

### Affectation des sinistres

- **Fonctionnalité** : Possibilité d'affecter un sinistre à un chargé de clientèle
- **Rôle** : Le rôle de chargé de clientèle est déclaré depuis la page users
- **Utilisateurs actuels** : Nejma et Virginie
- **Select dynamique** :
  - Affiche uniquement les utilisateurs ayant le rôle de chargé de clientèle
  - Si un nouvel utilisateur obtient ce rôle à l'avenir, il apparaît automatiquement dans le select
- **Gestion des utilisateurs supprimés/désactivés** :
  - Si un utilisateur avec ce rôle est supprimé ou désactivé
  - Les sinistres qui lui étaient affectés affichent la mention "à affecter" dans le listing

### Notes et commentaires

- **Fonctionnalité** : Possibilité d'ajouter des notes/commentaires sur chaque sinistre
- **Caractéristiques** :
  - Notes visibles par tous les utilisateurs ayant accès au sinistre
  - Horodatage automatique (date + auteur)
  - Historique des notes conservé
  - Possibilité d'éditer/supprimer ses propres notes (admin peut tout modifier)
  - Format texte simple ou markdown selon besoin
  - Pièces jointes optionnelles (documents, photos)

### Historique et traçabilité

- **Fonctionnalité** : Historique complet des modifications sur chaque sinistre
- **Éléments tracés** :
  - Changements de statut
  - Changements de route
  - Modifications d'affectation (changement de chargé de clientèle)
  - Modifications de montants
  - Ajout/modification/suppression de notes
  - Import de fichiers Excel (impact sur le sinistre)
- **Informations enregistrées** :
  - Date et heure de la modification
  - Auteur de la modification
  - Valeur avant / valeur après
  - Type de modification
- **Affichage** : Timeline ou journal des modifications accessible depuis la fiche sinistre

## Concept : Routes de gestion

Un sinistre = un dossier, mais surtout **un mode de gestion** (assistance / artisan / expert / convention / juridique). Standardiser 6–7 routes max permet de couvrir 95% des cas tout en gardant le CRM simple.

### Périmètre "sinistres" dans une agence (vue large)

En pratique, les sinistres se répartissent en 5 grandes familles :

1. **Auto/Moto** : accident matériel, bris de glace, vol, incendie, événements climatiques, corporel
2. **Habitation (MRH)** : dégât des eaux, incendie, vol, bris, événements climatiques, RC vie privée, assistance
3. **Pro/Entreprise (MRP / IARD Pro)** : dégâts des eaux/incendie/vol/bris machines, pertes d'exploitation, responsabilité exploitation
4. **Responsabilités & juridique** : RC pro, RC décennale/RC exploitation, protection juridique (litige), défense-recours
5. **Personnes** (intégration future) : GAV, prévoyance, santé → gestion "prestations" plus que "réparation"

## Les 6 routes de gestion à modéliser

### Route A — Réparation pilotée / réseau d'artisans (assistance)

- **Quand** : Petits/moyens dommages "réparables vite", besoin de sécurisation/organisation, préférence pour un parcours court
- **Étapes typiques** : déclaration → triage → mission artisan → **devis** → accord → travaux → facture → règlement → clôture
- **Contexte** : Allianz a ce modèle via **réseau d'artisans** (accord rapide, organisation intervention, évaluation, etc.). Côté assistance, Allianz Partners pousse aussi du **diagnostic vidéo** type Visi'Home (dépannage/auto-réparation/artisan)

### Route B — Expertise dommages (IARD / auto)

- **Quand** : Dommage important, suspicion, désaccord, montant élevé, besoin d'un rapport opposable
- **Étapes** : déclaration → collecte pièces → **mission expert** → RDV → rapport → chiffrage → offre/règlement → clôture

### Route C — Auto matériel "conventionnel" (IRSA)

- **Quand** : Accident matériel avec tiers, gestion inter-assureurs
- **Étapes** : constat/infos tiers → application barème / responsabilités → réparation/expert → indemnisation → recours inter-compagnies
- **Contexte** : La convention IRSA organise l'indemnisation/recours entre assureurs pour les dommages matériels

### Route D — Auto corporel (IRCA / droit commun)

- **Quand** : Blessés, ITT, préjudices corporels
- **Étapes** : ouverture corporel → pièces médicales / avocat éventuel → médecin-conseil/expertises → offres → transaction/recours
- **Contexte** : La convention IRCA est un cadre inter-assureurs pour l'indemnisation corporelle dans beaucoup de cas (sinon droit commun / Badinter)

### Route E — Immeuble / dégât des eaux / incendie "conventionnel" (IRSI)

- **Quand** : Dégâts des eaux/incendie dans immeuble (copro/locatif), multi-acteurs (occupant, copro, voisin…)
- **Étapes** : tri "qui est gestionnaire ?" → recherche fuite/mesures conservatoires → devis/travaux → indemnisation/recours
- **Contexte** : La convention **IRSI** (en vigueur depuis 01/06/2018) remplace CIDRE pour faciliter la gestion/recours des sinistres immeuble

### Route F — Responsabilité / litige / protection juridique

- **Quand** : Réclamation d'un tiers, mise en cause, assignation, ou litige PJ
- **Étapes** : réception réclamation → analyse garantie (RC/PJ) → stratégie (défense, expertise contradictoire, transaction) → position (prise en charge / refus motivé) → clôture

## Le "tronc commun" (étapes quasi identiques partout)

Pipeline standardisé en 9 blocs, puis branchement de la route :

1. **Ouverture** (date, contrat, évènement, urgence, contact)
2. **Qualification** (garantie probable, tiers ?, corporel ?, convention ?, montant estimé ?)
3. **Affectation de route** (A/B/C/D/E/F)
4. **Pièces & preuves** (checklist dynamique)
5. **Mission** (artisan / expert / assistance / juridique)
6. **Chiffrage** (devis / rapport / évaluation)
7. **Décision** (accord / refus / complément)
8. **Règlement & exécution** (travaux / indemnité / recours)
9. **Clôture** (solde, satisfaction, relances stoppées, archivage)

> **Astuce "CRM simple"** : Chaque dossier doit toujours afficher **(a) sa Route**, **(b) son Statut**, **(c) la Prochaine action**, **(d) une Date limite**.

## Les statuts à utiliser (peu mais efficaces)

Garde 10–12 statuts universels, et mets le détail en "tags" :

1. **À qualifier**
2. **En attente pièces assuré**
3. **En attente infos tiers** (si tiers)
4. **Mission en cours** (artisan/expert/assistance/juridique)
5. **En attente devis**
6. **En attente rapport** (expert / médical / contradictoire)
7. **En attente accord compagnie** (validation offre / prise en charge)
8. **Travaux en cours**
9. **En attente facture / justificatifs**
10. **Règlement en cours**
11. **Clos**
12. **Litige / contestation** (exception)

## Champs minimum à stocker (pour piloter + faire des alertes)

### Sinistre

- Contrat / garantie / risque (adresse) / date sinistre / date déclaration
- Type évènement (DEGÂT DES EAUX, ACCIDENT, VOL, etc.)
- Route (A…F) + statut
- Montant estimé (même grossier)
- Tiers ? (oui/non) + coordonnées si oui
- Prestataire : artisan / expert / avocat + RDV prévu
- "Prochaine action" + échéance (la base des relances)

### Alertes (automatiques)

- "Statut inchangé > X jours"
- "En attente devis/rapport > X jours"
- "RDV dépassé"
- "Pièces manquantes depuis X jours"
- "Sinistre > 30/60/90 jours ouverts" (selon type)

> **Note** : Délais de déclaration selon cas — 5 jours ouvrés en général, 2 jours pour vol, Cat Nat 30 jours après arrêté — à utiliser surtout pour un voyant "hors délai".

## Exemples concrets

### Exemple 1 — MRH dégât des eaux "artisan réseau"

- Route A → **Mission artisan**
- Statuts : À qualifier → Mission en cours → Attente devis → Travaux en cours → Attente facture → Règlement → Clos
- Checklist : photos, cause (fuite?), coordonnées bailleur/copro si besoin, devis+facture

### Exemple 2 — Auto accident matériel avec tiers

- Route C (IRSA) + parfois Route B (expert)
- Statuts : À qualifier → Attente infos tiers/constat → Mission en cours (garage/expert) → Attente rapport → Règlement → Clos (+ recours en back)

### Exemple 3 — RC pro mise en cause

- Route F
- Statuts : À qualifier → Attente pièces (réclamation, devis adverse, PV) → Mission juridique → Attente position compagnie → Transaction/refus motivé → Clos

## MVP (pour ne pas se noyer)

1. Implémenter d'abord **Routes A + B + C + E + F** (couvrir déjà l'essentiel agence IARD/auto)
2. Ajouter Route D (corporel) ensuite, car c'est un monde à part (médical, délais, avocat…)
3. Dans l'UI : une vue **Kanban par statut** + une vue **Table par route** + un filtre **"en retard"**
