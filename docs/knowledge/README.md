# Base de connaissances (knowledge)

Ce dossier contient les fiches métier et les bases **chargées** par les agents IA, ainsi que des référentiels utilisés dans la doc ou le code.

## Bases chargées par les agents

- **Bob** : `loadBobKnowledge()` charge `bob/` puis `bob/ro/`. Source de vérité : [bob/00-SOURCE-DE-VERITE.md](bob/00-SOURCE-DE-VERITE.md).
- **Sinistro** : `loadSinistroKnowledge()` charge `sinistro/`. Source de vérité : [sinistro/00-SOURCE-DE-VERITE.md](sinistro/00-SOURCE-DE-VERITE.md).

## Fiches à la racine (20, 30, 90)

Les fichiers **`20-sinistres.md`**, **`30-sante.md`** et **`90-compliance.md`** sont des **synthèses par domaine** utilisées comme **références** (citées dans la doc, dans les prompts ou le code). Ils **ne sont pas chargés** par `loadBobKnowledge()` ni `loadSinistroKnowledge()`.

- **20-sinistres.md** : conventions sinistres (IRSA, IRCA, IRSI), référencé par la doc Sinistro.
- **30-sante.md** : santé individuelle et collective (remboursements, postes).
- **90-compliance.md** : règles métier et conformité (ACPR, devoir de conseil), référencé par l’API chat.

Mettre à jour le libellé « A VERIFIER » dans 20 et 30 lorsque le contenu a été validé.

## Autres sous-dossiers

- **core/** : agences, réglementation, spécification comportement IA, etc.
- **process/** : processus métier (M+3, sinistres, leads, préterme).
- **produits/** , **segmentation/** , **contrats/** , **sources/** : fiches métier référentielles.
