# Base de connaissances Pauline — Source de vérité

Ce document définit les fiches chargées par Pauline (spécialiste produits Allianz marché particuliers) et les règles de cohérence. Pauline cite toujours la fiche utilisée (ex. « Sources : pauline/xxx.md »).

Chargeur : `loadPaulineKnowledge()` dans `lib/assistant/knowledge-loader.ts`. Dossier : `docs/knowledge/pauline/`. RAG : collection Firestore `pauline_knowledge`. Limite globale fallback : ~28 000 caractères.

## Inventaire des fiches

| Fichier | Rôle |
|---------|------|
| `00-SOURCE-DE-VERITE.md` | Ce document — inventaire. |
| Fiches `*.md` issues de `docs/pdf/auto/` | Vadémécums auto (bonus malus, carte grise, avantage bonus client, catégories socio-pro, code personnalisation, saisie sinistres, transport marchandises, Auto-Ultimo), DG-AUTO, guide de souscription RES35901. Générées par `npm run extract:pauline-pdfs`. |
| Fiches `*.md` issues de `docs/pdf/mrh/` | Vadémécums MRH/habitation (objets de valeur, bornes électriques, grands risques, protections vol, attestations, dépendances, etc.), DG-HABITATION, guide de souscription RES30820. Générées par `npm run extract:pauline-pdfs`. |

### Fiches extraites des PDF auto et MRH

Les fiches dont le nom correspond à un PDF des dossiers `docs/pdf/auto/` et `docs/pdf/mrh/` sont générées par le script d'extraction.

- **Auto** : vadémécums (bonus malus, carte grise, avantage bonus client, catégories socio-pro, code personnalisation, saisie sinistres, transport public de marchandises, Auto-Ultimo), DG-AUTO, guide de souscription RES35901.
- **MRH** : vadémécums MRH (objets de valeur, bornes électriques, grands risques, protections vol, attestations, dépendances, biens en extérieur, usages, etc.), DG-HABITATION, DG-SPECIAL-INVESTISSEUR, guide de souscription RES30820.

**Génération** : `npm run extract:pauline-pdfs` (lit tous les PDF dans `docs/pdf/auto/` et `docs/pdf/mrh/`, crée ou écrase une fiche .md par PDF). Puis `npm run migrate:pauline-firestore` pour mettre à jour le RAG.

## Règles

- Une fiche = une source : ne pas dupliquer entre fiches ; renvoyer par nom de fichier.
- Sourçage obligatoire : en fin de réponse technique, Pauline cite au moins une source (fiche pauline/).
