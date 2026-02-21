# Outil Pappers — Documentation

Ce document décrit l’usage de l’API Pappers dans le SaaS (clé API configurée) et les fonctionnalités qu’il serait possible d’ajouter en s’appuyant sur l’offre Pappers.

---

## Ce que l’on fait avec Pappers aujourd’hui

L’application utilise l’**API Pappers v2** (`https://api.pappers.fr/v2`) avec une clé API stockée dans `PAPPERS_API_KEY` (`.env.local`). Les appels passent par des routes Next.js protégées par authentification Firebase.

### Routes API internes

| Route | Rôle |
|-------|------|
| `POST /api/pappers/recherche` | Recherche d’entreprises par **nom** (paramètre `q`). Retourne une liste de résultats (SIREN, dénomination, forme juridique, adresse, code NAF, date de création, statut, etc.). |
| `POST /api/pappers/entreprise` | Fiche **complète** d’une entreprise par **SIREN ou SIRET** (paramètre `siren` ou `selectedSiren`). Une seule requête vers Pappers pour tout récupérer. |
| `POST /api/pappers/beneficiaires` | **Bénéficiaires effectifs** d’une entreprise à partir du SIREN. S’appuie sur les données renvoyées par l’endpoint entreprise. |

Toutes ces routes vérifient la présence de `PAPPERS_API_KEY` et renvoient des erreurs explicites si la clé est absente ou si Pappers répond en erreur (quota, clé invalide, etc.).

### Interface utilisateur

- **Entrée** : depuis **Commun → Outils**, la carte « Informations entreprise (Pappers) » mène à l’outil.
- **Page** : `app/commun/outils/beneficiaires-effectifs/page.tsx` (recherche par **nom** ou par **SIREN**, affichage de la fiche entreprise).
- **Fonctionnalités actuelles** :
  - Recherche par nom → liste de sociétés → choix d’une société.
  - Recherche par SIREN/SIRET → fiche directe.
  - Affichage en **onglets** :
    - **Informations** : dénomination, forme juridique, adresse, SIREN, SIRET siège, RCS, TVA, capital, NAF, effectifs, dates de création/clôture, statut, etc.
    - **Bénéficiaires** : bénéficiaires effectifs (nom, prénom, date de naissance, nationalité, % parts directes/indirectes, % votes).
    - **Dirigeants** : liste des dirigeants avec fonction, dates de début/fin, parts éventuelles.
    - **Financier** : bilans (chiffre d’affaires, résultat net, actif/passif, effectif, etc.) par exercice.
  - Copie des informations formatées dans le presse-papier.

En résumé : **recherche (nom ou SIREN/SIRET), fiche entreprise complète, bénéficiaires effectifs, dirigeants et bilans**, le tout via l’API Pappers v2 et une clé API.

---

## Fonctionnalités possibles (d’après l’offre Pappers)

En s’appuyant sur la documentation de l’API Pappers, le site [pappers.fr](https://www.pappers.fr/) et les services associés, les développements suivants seraient envisageables.

### 1. Documents officiels

- **Extraits Kbis**, **statuts**, **bilans** (PDF) : Pappers met à disposition ces documents pour un grand nombre d’entreprises. Possibilité d’ajouter des endpoints ou des liens pour télécharger ou afficher ces pièces depuis l’app (sous réserve des droits selon l’abonnement API).

### 2. Recherche et filtres avancés

- Recherche par **code postal**, **APE/NAF**, **forme juridique**, **tranche d’effectif**, **date de création**, **chiffre d’affaires**, etc.
- **Export** des résultats (CSV, Excel) pour exploitation en prospection ou reporting.

### 3. Surveillance (veille)

- **Surveillance d’entreprises** : alerter en cas de changement (dirigeants, capital, statut, bilans, etc.).
- **Surveillance de dirigeants** : être notifié quand une personne change de poste ou de société.
- Implémentation possible via **webhooks** Pappers (si offerts dans l’abonnement) ou via des jobs planifiés qui rappellent l’API et comparent aux données stockées.

### 4. Scoring et risque

- Utilisation du **scoring Pappers** (anticipation des défaillances, risque financier) pour afficher un indicateur de risque sur la fiche entreprise ou dans des listes (prospection, renouvellement, souscription).

### 5. Enrichissement et conformité

- **Enrichissement de fichiers** : à partir d’une liste de SIREN/SIRET (ou de noms), appels API pour compléter des champs (adresse, NAF, dirigeants, etc.) et alimenter un CRM ou des exports.
- **KYC / LCB-FT** : réutilisation des données entreprise et bénéficiaires effectifs déjà intégrées pour renforcer les processus de conformité (identification, traçabilité).

### 6. Données complémentaires

- **Établissements** : liste des établissements secondaires (adresses, SIRET) à partir du SIREN.
- **Procédures collectives** : historique ou statut (liquidation, sauvegarde, etc.) si exposé par l’API.
- **Publicités légales** : extraits BODACC, annonces (création, modification, dissolution, etc.) pour les afficher ou les lier depuis la fiche entreprise.

### 7. Intégration métier

- **CRM** : synchronisation ou mise à jour des fiches clients/prospects avec les données Pappers (rappel API lors de l’ouverture d’un dossier ou via un job).
- **Veille commerciale** : ciblage d’entreprises selon critères (secteur, zone, effectif, CA) pour générer des listes de prospection à partir des endpoints de recherche avancée.

---

## Références

- **Documentation API** : [https://www.pappers.fr/api](https://www.pappers.fr/)
- **Documentation technique (services)** : [https://services.pappers.fr/api/documentation](https://services.pappers.fr/api/documentation)
- **Configuration dans le projet** : `PAPPERS_API_KEY` dans `.env.local` ; routes sous `app/api/pappers/`.
