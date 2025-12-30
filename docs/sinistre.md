# Sinistre

## Accès

- **Condition d'accès** : Uniquement pour les utilisateurs connectés en tant qu'admin
- **Point d'entrée** : Bouton "Sinistre" dans la sidebar
- **Page** : Nouvelle page dédiée au pilotage des sinistres

### Permissions

- **Admin** : Accès complet (lecture, modification, suppression, upload CSV)
- **Chargé de clientèle** : Accès limité aux sinistres qui lui sont affectés
  - Lecture et modification des sinistres affectés
  - Possibilité d'ajouter des notes/commentaires
  - Pas d'accès aux fonctionnalités d'administration (upload CSV, affectation globale, etc.)

## Données sources

- **Répertoire** : `sinistres-csv`
- **Contenu** : État du stock des sinistres de l'agence à ce jour
- **Format** : CSV
- **Convention de nommage** : `DDMMYYYY.csv` (date à laquelle le fichier a été créé)
  - Exemple : `29122025.csv` (29 décembre 2025)
- **Structure** : Fichier sans en-têtes, colonnes dans l'ordre suivant :
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

- **Lignes complètes** : Chaque ligne représente un sinistre avec toutes les informations
- **Lignes partielles** : Parfois, des lignes contiennent uniquement une information dans la colonne "Montant déjà payé"
  - Dans ce cas, le montant payé doit être rattaché à la première ligne supérieure qui est pleinement renseignée (avec nom, numéro client, etc.)
- **Multiplicité** : Un sinistre pour un client peut avoir plusieurs lignes (ligne principale + lignes de montants payés supplémentaires)

## Implémentation

### Initialisation (Point 0)

- **Création de la base de données** : Importer les données du fichier `docs/sinistres-csv/29122025.csv`
- Ce fichier servira de point de départ (point 0) pour la base de données des sinistres

### Upload de fichiers

- **Fonctionnalité** : Possibilité de télécharger depuis le front de nouveaux fichiers CSV
- **Convention de nommage** : `DDMMYYYY.csv` (même logique que pour les fichiers sources)
- **Interface** : Upload depuis la page admin dédiée aux sinistres
- **Gestion des versions** :
  - Lors d'un nouvel upload, conserver l'historique des versions précédentes
  - Permettre de comparer les versions (diff)
  - Identifier les sinistres nouveaux, modifiés ou supprimés entre deux versions
  - Option de fusion intelligente : préserver les modifications manuelles (affectation, route, statut, notes) lors de la mise à jour

### Mapping CSV → Base de données

Correspondance entre les colonnes CSV et les champs de la base de données :

| Colonne CSV | Champ Base de données | Notes |
|-------------|----------------------|-------|
| 1. Nom du client | `clientName` | |
| 2. Numéro Lagon du client | `clientLagonNumber` | Identifiant unique client |
| 3. Numéro de la police | `policyNumber` | |
| 4. Catégorie de la police | `policyCategory` | |
| 5. Type de produit | `productType` | |
| 6. Numéro de sinistre | `claimNumber` | Identifiant unique sinistre |
| 7. Date de survenance | `incidentDate` | Format date à parser |
| 8. Montant déjà payé | `amountPaid` | Peut être multiple (lignes partielles) |
| 9. Reste à payer | `remainingAmount` | |
| 10. Recours | `recourse` | Booléen ou texte |
| 11. Garantie sinistrée | `damagedCoverage` | Correspond au type de garantie |

**Champs calculés/ajoutés lors de l'import** :
- `totalAmountPaid` : Somme de tous les montants payés (lignes principales + partielles)
- `totalAmount` : `amountPaid` + `remainingAmount`
- `importDate` : Date d'import du CSV
- `csvVersion` : Référence au fichier CSV source

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

- **Métriques** : Indicateurs de performance qui respectent la logique de filtrage par année, mois, semaine et type de garantie sinistrée
- **Affichage** : KPIs adaptés selon les critères de filtrage sélectionnés

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
  - Upload de nouveaux CSV (impact sur le sinistre)
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
