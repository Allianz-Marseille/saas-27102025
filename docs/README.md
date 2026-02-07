# Documentation du projet

Ce dossier regroupe toute la documentation métier, technique et fonctionnelle du SaaS.

## Structure

| Dossier | Rôle |
|--------|------|
| **agents-ia/** | Spécifications des bots (Nina, Bob, Sinistro) : stack, UI, mapping thèmes → fiches. Point d’entrée : [agents-ia/README.md](agents-ia/README.md). |
| **knowledge/** | Bases de connaissances **chargées** par les agents (Bob : `knowledge/bob/` + `knowledge/bob/ro/` ; Sinistro : `knowledge/sinistro/`) et fiches métier référentielles (core, process, produits, segmentation, contrats, sources). Les fiches à la racine (`20-sinistres.md`, `30-sante.md`, `90-compliance.md`) sont des synthèses par domaine, utilisées comme références (voir [knowledge/README.md](knowledge/README.md)). |
| **process/** | Processus détaillés côté **implémentation IA** (ex. workflow M+3 pour le bot). À distinguer de `knowledge/process/` qui décrit les processus métier. |
| **boost/** | Spécification de l’outil Boosts + checklist d’implémentation (BOOST.md, TODO.md). |
| **remuneration/** | Spécification de la grille de pilotage des rémunérations + TODO d’implémentation (grille.md, TODO.md). |
| **resumes-bots/** | Résumés d’organisation pour les IA et les humains : stack, fichiers, logique de chaque bot. [resumes-bots/README.md](resumes-bots/README.md) avec liens vers ORGANISATION-BOB.txt et ORGANISATION-SINISTRO.txt. |
| **pdf/** | Référentiels métier (vadémécums, conventions) : non servis par l’application, usage interne. |

## Références rapides

- **Spécification comportement IA (rôles)** : [knowledge/core/specification-comportement-ia.md](knowledge/core/specification-comportement-ia.md)
- **Agents IA (Nina, Bob, Sinistro)** : [agents-ia/README.md](agents-ia/README.md)
- **Base Bob (source de vérité)** : [knowledge/bob/00-SOURCE-DE-VERITE.md](knowledge/bob/00-SOURCE-DE-VERITE.md)
- **Base Sinistro** : [knowledge/sinistro/00-SOURCE-DE-VERITE.md](knowledge/sinistro/00-SOURCE-DE-VERITE.md)
