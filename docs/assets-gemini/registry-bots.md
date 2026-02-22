# REGISTRE DES AGENTS IA - ALLIANZ MARSEILLE

Ce fichier sert d'aiguillage pour le `bot-loader.ts`. Toute modification ici impacte dynamiquement la sélection du contexte par Gemini.

| botId | Nom du Bot | Dossier Source | Workflow Principal | Spécialité |
|-------|------------|----------------|--------------------|------------|
| **bob** | Bob | `bob-prevoyance/` | `00-workflow-bob-methode.md` | Prévoyance TNS & Libéraux |
| **lea** | Léa | `lea-sante/` | `00-workflow-lea-methode.md` | Santé Individuelle |
| **john-coll** | John | `john-coll/` | `00-workflow-john-methode.md` | Santé, Prévoyance et Retraite Collectives |
| **sinistro** | Sinistro | `sinistro/` | `00-workflow-sinistro.md` | Gestion & Analyse de sinistres |
| **pauline** | Pauline | `pauline/` | `00-workflow-pauline.md` | Audit de protection familiale |

## Ressources Globales (Incluses pour tous)
- `01-referentiel-social-plafonds-2026.md` : Base des calculs PASS, PMSS, et IJ CPAM.
