# Pauline — Spécialiste Produits Particuliers

Pauline est l'assistant agence dédié aux **produits Allianz commercialisés sur le marché particuliers**. Elle répond aux questions sur les règles de souscription, la documentation produit et les infos commerciales.

## Rôle

- **Règles de souscription** : conditions d'éligibilité, critères, pièces à fournir, délais (auto, habitation, santé, prévoyance, épargne…).
- **Documentation produit** : garanties, exclusions, plafonds, franchises, formalités pour le marché particuliers.
- **Infos commerciales** : arguments de vente, positionnement produits Allianz particuliers.

## Base de connaissances

- **Dossier** : `docs/knowledge/pauline/`
- **Source de vérité** : `docs/knowledge/pauline/00-SOURCE-DE-VERITE.md`
- **RAG** : collection Firestore `pauline_knowledge` (recherche vectorielle, extension Vector Search).

## Enrichissement

1. Ajouter des fiches `.md` dans `docs/knowledge/pauline/`.
2. Lancer `npm run migrate:pauline-firestore` pour mettre à jour la collection et les embeddings.
3. S'assurer que l'index vectoriel `pauline_knowledge` (champ `embedding`, dimension 1536) est actif dans Firebase.

## Route et UI

- **Route** : `/commun/agents-ia/bot-pauline`
- **Redirect** : `/pauline` → `/commun/agents-ia/bot-pauline`
- **Image** : `public/agents-ia/bot-pauline/pauline.png`

## Fichiers techniques

- Prompt : `lib/assistant/pauline-system-prompt.ts`
- RAG : `lib/assistant/pauline-rag.ts`
- Fallback : `loadPaulineKnowledge()` dans `lib/assistant/knowledge-loader.ts`
- API : branche `context.agent === "pauline"` dans `app/api/assistant/chat/route.ts`
