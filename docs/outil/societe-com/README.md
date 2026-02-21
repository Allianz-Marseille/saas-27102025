# Outil Societe.com — Documentation

Ce document décrit l’usage de l’API Societe.com dans le projet (clé API configurée), ce qu’il est possible de faire avec une clé API, et comment Societe.com se positionne par rapport à Pappers.

---

## 1. Ce qui est déjà en place dans le projet

Une clé API Societe.com est utilisée via la variable `SOCIETE_API_KEY` (`.env.local`). Les appels passent par des routes Next.js protégées par authentification Firebase.

### Routes API internes

| Route | Rôle |
|-------|------|
| `POST /api/societe/entreprise` | Recherche par **nom** (liste de résultats) ou fiche **complète** par **SIREN/SIRET**. En cas de SIREN/SIRET, plusieurs endpoints Societe.com sont appelés en parallèle. |
| `POST /api/conventions-collectives` | Récupération de la **convention collective** (IDCC, libellé) à partir d’un **SIREN ou SIRET** uniquement. Utilise l’endpoint `infoslegales` (champs `idcc`, `libidcc`). Le code APE seul ne suffit pas : l’API Societe.com exige un identifiant entreprise. |

### Données récupérées par `/api/societe/entreprise` (par SIREN/SIRET)

Pour une entreprise donnée, la route appelle en parallèle les endpoints suivants de l’API Societe.com :

- **exist** : existence, SIREN, SIRET siège, TVA, dénomination, procédure collective en cours, statut, immatriculations (INSEE, RCS, RNE, BODACC).
- **infoslegales** : informations légales détaillées (dont code APE/NAF et convention collective IDCC/libellé).
- **dirigeants** : mandataires sociaux, fonctions, dates.
- **bilans** : comptes annuels, bilans.
- **etablissements** : liste des établissements (adresses, SIRET).
- **procedurescollectives** : historique procédures collectives.
- **evenements** : événements juridiques / BODACC.
- **scoring** : score de risque (si disponible dans l’abonnement).
- **contact** : coordonnées de contact (si disponibles).
- **marques** : marques déposées (INPI).
- **documents-officiels** : documents officiels (Kbis, statuts, etc., selon abonnement).

### Interface utilisateur

- **Entrée** : **Commun → Outils** → carte « Informations entreprise (Societe.com) ».
- **Page** : `app/commun/outils/societe-entreprise/page.tsx`.
- **Fonctionnalités** : recherche par **nom** ou par **SIREN/SIRET**, affichage des résultats (existence, infos légales, dirigeants, bilans, établissements, procédures, événements, scoring, contact, marques, documents).

---

## 2. Analyse du site Societe.com et de l’API

### Site [societe.com](https://www.societe.com/)

- **Position** : leader sur l’information légale, juridique et financière des entreprises françaises (base très large, mises à jour quotidiennes).
- **Recherche gratuite (site)** : par entreprise, dirigeant ou document ; filtres possibles (activité NAF/APE, localisation, dirigeant, statut, forme juridique). Données issues d’Infolegale, Infogreffe, INSEE, CRNS.
- **Données exposées (site)** : dirigeants et actionnaires, statuts et historique, comptes annuels, marques, documents officiels.
- **Offres payantes (site)** : conformité dirigeant, résumés de documents par IA, recherches illimitées, etc.

### API PRO (avec clé API)

- **Base** : [https://api.societe.com/api/v1](https://api.societe.com/api/v1). Données de **12 millions de sociétés**, mises à jour quotidiennement (SIRENE, INPI, BODACC + sources privées).
- **Authentification** : clé API (token) soit en paramètre `token`, soit en header `X-Authorization: socapi {token}`. Compte et clé via [api@societe.com](mailto:api@societe.com).
- **Méthode** : **GET** uniquement.
- **Limites** : IP autorisées ; par défaut 60 requêtes/minute (option Highrate possible).
- **Crédits** : chaque requête consomme des crédits (ex. recherche 0,1, infos légales 0,5, dirigeants 2, bilans 2). Forfaits de 5 000 à 2 000 000 crédits.
- **Formats** : JSON (défaut), XML (`contenttype=xml`).

### Endpoints disponibles (documentation API)

| Endpoint | Description |
|----------|-------------|
| `GET /entreprise/{numid}/exist` | Existence, SIREN, SIRET siège, TVA, dénomination, statut, procédure collective, immatriculations. |
| `GET /entreprise/{numid}/infoslegales` | Informations légales (dont NAF, **convention collective IDCC/libellé**). |
| `GET /entreprise/{numid}/dirigeants` | Dirigeants / mandataires sociaux. |
| `GET /entreprise/{numid}/beneficiaires-effectifs` | Bénéficiaires effectifs. |
| `GET /entreprise/{numid}/bilans` | Bilans / comptes annuels. |
| `GET /entreprise/{numid}/etablissements` | Liste des établissements. |
| `GET /entreprise/{numid}/procedurescollectives` | Procédures collectives. |
| `GET /entreprise/{numid}/evenements` | Événements (BODACC, etc.). |
| `GET /entreprise/{numid}/scoring` | Scoring / risque. |
| `GET /entreprise/{numid}/contact` | Coordonnées de contact. |
| `GET /entreprise/{numid}/marques` | Marques (INPI). |
| `GET /entreprise/{numid}/documents-officiels` | Documents officiels (Kbis, statuts, etc.). |
| `GET /entreprise/search` | Recherche par nom (dépréciée au profit de l’autocomplete). |
| `GET /infoclient` | Solde de crédits du compte. |

Le paramètre `{numid}` peut être un **SIREN** (9 chiffres), un **SIRET** (14 chiffres) ou un **numéro de TVA intracommunautaire** (ex. FR56428723266).

### Ce qu’on peut faire avec une clé API

- **Recherche** : par nom (search ou autocomplete selon la doc), par SIREN/SIRET/TVA.
- **Fiche entreprise complète** : enchaîner les appels exist / infoslegales / dirigeants / bilans / établissements / procédures / événements / scoring / contact / marques / documents-officiels (comme dans `/api/societe/entreprise`).
- **Convention collective** : via `infoslegales` (champs idcc, libidcc) — déjà utilisé dans `/api/conventions-collectives`.
- **Bénéficiaires effectifs** : endpoint dédié `beneficiaires-effectifs` (non appelé aujourd’hui dans la route entreprise ; à ajouter si besoin).
- **Scoring** : indicateur de risque si inclus dans l’abonnement.
- **Documents officiels** : accès aux documents selon forfait.
- **Gestion des crédits** : `GET /infoclient` pour afficher le solde et maîtriser la consommation.

---

## 3. Societe.com vs Pappers — ce que chacun apporte en plus

### Points communs

- Informations légales et financières, dirigeants, bilans, établissements, procédures collectives, documents officiels, scoring/risque.
- Recherche par nom et par SIREN/SIRET.
- Données mises à jour régulièrement (sources officielles).

### Ce que Societe.com permet en plus (ou mieux) que Pappers

- **Convention collective (IDCC / libellé)** : exposée directement dans les infos légales par SIREN/SIRET. Dans le projet, c’est la **seule source** utilisée pour la convention collective (`/api/conventions-collectives`). Pappers ne met pas en avant un champ convention collective dans la doc API de la même façon.
- **Recherche par numéro de TVA** : l’API Societe.com accepte le numéro de TVA comme `numid` (exist, infoslegales, etc.). Pappers est utilisé surtout en SIREN/SIRET et nom.
- **Marques (INPI)** : endpoint dédié `marques` dans l’API Societe.com, déjà appelé dans le projet. Pappers peut avoir des infos proches mais l’offre est différente.
- **Contact** : endpoint `contact` pour coordonnées, utilisé dans la route actuelle. Utile pour enrichissement / prospection.
- **Modèle par crédits** : coût par type de requête (recherche, infos légales, dirigeants, bilans) et forfaits larges ; peut mieux convenir à certains usages que le modèle Pappers (selon forfaits respectifs).

### Ce que Pappers permet en plus (ou mieux) que Societe.com

- **Bénéficiaires effectifs** : très intégrés dans l’API Pappers (endpoint entreprise + route dédiée `/api/pappers/beneficiaires`). Societe.com a un endpoint `beneficiaires-effectifs` mais il n’est pas encore utilisé dans le projet.
- **Une seule requête entreprise** : Pappers renvoie beaucoup de données en un seul appel `/entreprise?siren=`. Societe.com nécessite plusieurs GET (exist, infoslegales, dirigeants, bilans, etc.) — déjà regroupés en parallèle dans `/api/societe/entreprise`.
- **Webhooks / surveillance** : Pappers met en avant surveillance d’entreprises et de dirigeants (webhooks). L’API Societe.com ne met pas en avant ce type de service dans la doc consultée.
- **Enrichissement / KYC** : Pappers communique sur enrichissement de fichiers et conformité KYC/LCB-FT. Societe.com est plutôt orienté consultation et intégration CRM.
- **Quota / gratuité** : Pappers propose un volume de requêtes gratuites par mois ; Societe.com fonctionne par crédits et forfaits (pas de gratuité API décrite).

### En résumé

- **Pour la convention collective** : aujourd’hui, **Societe.com uniquement** (via `infoslegales`). À garder comme source principale pour l’IDCC.
- **Pour une fiche entreprise complète** : les deux conviennent ; le projet utilise déjà les deux (Pappers pour bénéficiaires/fiche détaillée, Societe.com pour fiche + convention + scoring/contact/marques/documents).
- **Pour les bénéficiaires effectifs** : **Pappers** est déjà bien exploité ; **Societe.com** peut compléter ou doubler en ajoutant l’appel à `beneficiaires-effectifs` si besoin.
- **Pour la veille / surveillance** : **Pappers** est plus mis en avant ; à considérer si ce besoin devient prioritaire.

---

## 4. Références

- **Documentation API** : [https://api.societe.com/apisite/documentations/v1/documentation-api.html](https://api.societe.com/apisite/documentations/v1/documentation-api.html)
- **Présentation API / solutions** : [https://www.societe.com/solutions/api](https://www.societe.com/solutions/api)
- **Versions API** : [https://www.societe.com/api/versions.html](https://www.societe.com/api/versions.html)
- **Support technique** : [api-pro-support@societe.com](mailto:api-pro-support@societe.com) — **Commercial / clé API** : [api@societe.com](mailto:api@societe.com)
- **Configuration dans le projet** : `SOCIETE_API_KEY` dans `.env.local` ; routes sous `app/api/societe/` et `app/api/conventions-collectives/`.
