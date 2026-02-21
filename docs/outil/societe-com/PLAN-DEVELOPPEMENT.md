# Plan de développement — Outil Societe.com

Objectif : proposer un outil Societe.com qui fasse **au minimum** ce que fait Pappers (recherche, fiche entreprise, bénéficiaires effectifs, dirigeants, bilans) et **en plus** des fonctionnalités propres à Societe.com (convention collective CCN, scoring, contact, marques, documents, etc.). La clé API est déjà configurée dans `.env.local` (`SOCIETE_API_KEY`).

---

## État des lieux

### Ce que fait Pappers aujourd’hui (référence)

- Recherche par **nom** → liste de résultats → sélection.
- Recherche par **SIREN/SIRET** → fiche directe.
- Affichage en onglets : **Informations**, **Bénéficiaires effectifs**, **Dirigeants**, **Financier** (bilans).
- **Copie** des blocs ou de tout le contenu dans le presse-papier.

### Ce que fait déjà Societe.com dans le projet

- **Backend** : `POST /api/societe/entreprise` (recherche par nom ou SIREN/SIRET, puis 11 appels API en parallèle : exist, infoslegales, dirigeants, bilans, etablissements, procedures, evenements, scoring, contact, marques, documents-officiels). **Manque** : l’endpoint `beneficiaires-effectifs` n’est pas appelé.
- **Backend** : `POST /api/conventions-collectives` (convention collective par SIREN/SIRET).
- **UI** : page `app/commun/outils/societe-entreprise/page.tsx` avec onglets **Informations**, **Dirigeants**, **Financier**, **Autres** (procédures, événements, marques). **Manque** : pas d’onglet Bénéficiaires, pas d’affichage de la **convention collective (CCN)**, pas de bouton **Copier** comme sur Pappers.

---

## Plan par phase

### Phase 1 — Parité minimale avec Pappers

Objectif : que l’outil Societe.com offre au moins les mêmes blocs d’information que Pappers (infos, bénéficiaires, dirigeants, financier) et la même ergonomie de copie.

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 1.1 | **Appeler l’endpoint bénéficiaires effectifs** | `app/api/societe/entreprise/route.ts` : ajouter dans le `Promise.allSettled` un `fetch` vers `${baseUrl}/entreprise/${numId}/beneficiaires-effectifs`, puis traiter la réponse et l’exposer dans `data.beneficiaires` (ex. `beneficiaires?.data` selon la structure de l’API). |
| 1.2 | **Onglet Bénéficiaires** | `app/commun/outils/societe-entreprise/page.tsx` : ajouter un onglet « Bénéficiaires » entre Informations et Dirigeants (ou après Dirigeants). Afficher la liste des bénéficiaires (nom, prénom, parts, votes, etc.) à partir de `results.beneficiaires`. Gérer le cas vide (aucun bénéficiaire ou donnée non disponible). |
| 1.3 | **Convention collective (CCN) visible** | Les infos légales Societe.com contiennent déjà `idcc` et `libidcc` (ou `libelle_idcc`). Dans l’onglet **Informations**, ajouter une section dédiée « Convention collective » affichant l’IDCC et le libellé lorsque `results.infosLegales.idcc` ou `results.infosLegales.libidcc` est présent. |
| 1.4 | **Boutons Copier (par bloc + tout)** | Comme sur la page Pappers : pour chaque onglet (Informations, Bénéficiaires, Dirigeants, Financier, et éventuellement Autres), ajouter un bouton « Copier » qui formate le contenu en texte et l’envoie au presse-papier. Ajouter un bouton « Copier tout » à côté des onglets. Réutiliser la logique `copyToClipboard` + `formatXxxForCopy()` et un state `copiedSection` pour le feedback visuel. |

Livrable Phase 1 : outil Societe.com avec Infos (dont CCN), Bénéficiaires, Dirigeants, Financier et copie, au même niveau fonctionnel que Pappers pour ces blocs.

---

### Phase 2 — Renforcer le « plus » Societe.com

Objectif : mettre en avant les atouts déjà disponibles dans les données (CCN, scoring, contact, établissements, documents) et améliorer la lisibilité.

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 2.1 | **Bloc CCN mis en avant** | Dans l’onglet Informations (ou en premier sous-titre), afficher une carte « Convention collective » avec IDCC + libellé, et éventuellement un lien vers le Code du travail numérique (recherche par IDCC) pour consultation du texte. |
| 2.2 | **Établissements** | Les données `results.etablissements` sont déjà renvoyées par l’API. Ajouter une section « Établissements » (dans l’onglet Informations ou dans Autres) : liste des établissements avec adresse, SIRET, etc., comme sur une fiche Pappers « établissements » si tu l’utilises. |
| 2.3 | **Documents officiels** | Les données `results.documents` sont déjà renvoyées. Si l’API fournit des URLs ou des identifiants de documents (Kbis, statuts), afficher une liste avec liens de téléchargement ou libellés dans l’onglet Autres (ou une sous-section « Documents »). |
| 2.4 | **Scoring lisible** | Le bloc Scoring est déjà affiché dans l’onglet Informations. Optionnel : améliorer la présentation (indicateur visuel, légende, lien vers la doc des scores) pour que l’utilisateur comprenne mieux la valeur. |

Livrable Phase 2 : CCN bien visible, établissements et documents utilisables, scoring plus clair.

---

### Phase 3 — Optionnel (recherche TVA, crédits, unification)

| # | Tâche | Fichiers / actions |
|---|--------|---------------------|
| 3.1 | **Recherche par numéro de TVA** | L’API Societe.com accepte le numéro de TVA comme `numid`. Ajouter un 3ᵉ mode de recherche « Par TVA » dans le formulaire (champ + validation format FR + 9 chiffres) et transmettre ce numéro à `/api/societe/entreprise` (adapter la route pour accepter un paramètre `tva` et l’utiliser comme `numId`). |
| 3.2 | **Solde de crédits API** | Créer une route `GET /api/societe/credits` (ou intégrer dans une page admin) qui appelle `GET https://api.societe.com/api/v1/infoclient` avec la clé API et affiche le solde. Afficher ce solde (ou un indicateur « crédits OK ») dans le pied de page de l’outil ou dans une modale « À propos ». |
| 3.3 | **Entrée unique « Outils »** | La page `app/commun/outils/page.tsx` liste déjà Pappers et Societe.com. Optionnel : ajouter un court texte sous la carte Societe.com indiquant « Convention collective (CCN), scoring, contact, marques » pour clarifier la valeur ajoutée par rapport à Pappers. |

---

## Récapitulatif des fichiers à modifier / créer

| Fichier | Modifications |
|---------|----------------|
| `app/api/societe/entreprise/route.ts` | Ajouter l’appel `beneficiaires-effectifs`, exposer `data.beneficiaires`. |
| `app/commun/outils/societe-entreprise/page.tsx` | Onglet Bénéficiaires ; section CCN dans Infos ; boutons Copier (par bloc + tout) ; optionnel : établissements, documents, scoring, recherche TVA. |
| `app/commun/outils/page.tsx` | Optionnel : texte de différenciation Societe.com (CCN, etc.). |
| Nouvelle route (optionnel) | `app/api/societe/credits/route.ts` pour `GET /api/societe/credits` → appel `infoclient`. |

---

## Ordre de mise en œuvre recommandé

1. **Phase 1** : 1.1 → 1.2 → 1.3 → 1.4 (parité Pappers + CCN + copie).
2. **Phase 2** : 2.1 à 2.4 selon priorité métier (CCN déjà fait en 1.3, à enrichir en 2.1 ; puis établissements, documents, scoring).
3. **Phase 3** : si besoin (TVA, crédits, communication sur la valeur de l’outil).

En suivant ce plan, l’outil Societe.com atteint au minimum le niveau de Pappers (recherche, fiche, bénéficiaires, dirigeants, bilans, copie) et ajoute clairement la **convention collective (CCN)** et les autres atouts Societe.com (scoring, contact, marques, établissements, documents), en s’appuyant sur la clé API déjà présente dans `.env.local`.
