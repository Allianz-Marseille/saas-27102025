# Base de connaissances Pauline — Source de vérité

Ce document définit les fiches chargées par Pauline (spécialiste produits Allianz marché particuliers) et les règles de cohérence. Pauline cite toujours la fiche utilisée (ex. « Sources : pauline/xxx.md »).

Chargeur : `loadPaulineKnowledge()` dans `lib/assistant/knowledge-loader.ts`. Dossier : `docs/knowledge/pauline/`. RAG : collection Firestore `pauline_knowledge`. Limite globale fallback : ~28 000 caractères.

## Inventaire des fiches

| Fichier | Rôle |
|---------|------|
| `00-SOURCE-DE-VERITE.md` | Ce document — inventaire. |

À enrichir : règles de souscription, documentation produits particuliers, conditions, infos commerciales. Après ajout de fiches .md, lancer `npm run migrate:pauline-firestore` pour mettre à jour le RAG.

## Règles

- Une fiche = une source : ne pas dupliquer entre fiches ; renvoyer par nom de fichier.
- Sourçage obligatoire : en fin de réponse technique, Pauline cite au moins une source (fiche pauline/).
