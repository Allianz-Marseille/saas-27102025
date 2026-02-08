# PR : ml-ia → main — Pauline + extraction PDFs auto (suite PR #8)

## Titre suggéré

**feat(pauline): bot Produits Particuliers + base PDFs auto + widget dashboard + cas IRSA Sinistro**

---

## Contexte

La PR #8 a déjà fusionné dans `main` : OCR Vision (Nina, Sinistro, Bob) + RAG Sinistro (conventions IRSA, IRSI, CIDE-COP). Cette PR ajoute le reste des commits présents sur `ml-ia`.

---

## Contenu de cette PR

### 1. Bot Pauline (Produits Particuliers)

- **Config** : `PAULINE_TIMEOUT`, `ENABLE_PAULINE_BOT` dans `lib/assistant/config.ts`.
- **Prompt & RAG** : `lib/assistant/pauline-system-prompt.ts`, `lib/assistant/pauline-rag.ts` (collection `pauline_knowledge`), `loadPaulineKnowledge()` dans `knowledge-loader.ts`.
- **API chat** : branche `context.agent === "pauline"` dans `app/api/assistant/chat/route.ts`.
- **Pages** : `app/commun/agents-ia/bot-pauline/page.tsx`, carte Pauline sur `app/commun/agents-ia/page.tsx`.
- **Widget dashboard** : `components/dashboard/agents-ia-widget.tsx` — affiche Nina, Bob, Sinistro, Pauline sur le tableau de bord.
- **Base de connaissances** : `docs/knowledge/pauline/00-SOURCE-DE-VERITE.md`, script `npm run migrate:pauline-firestore`, index Firestore `pauline_knowledge`.
- **Redirect** : `/pauline` → `/commun/agents-ia/bot-pauline` dans `next.config.ts`.
- **Doc** : `docs/agents-ia/pauline_retail/README.md`.

### 2. Enrichissement base Pauline (PDFs auto)

- **Script** `scripts/extract-pauline-pdfs.cjs` : extrait tous les PDF de `docs/pdf/auto/` vers `docs/knowledge/pauline/*.md`.
- **Commande** : `npm run extract:pauline-pdfs`.
- **Fiches générées** : vadémécums (bonus malus, carte grise, avantage bonus client, catégories socio-pro, code personnalisation, saisie sinistres, transport marchandises, Auto-Ultimo) + guide de souscription RES35901.

### 3. Sinistro — Cas IRSA

- **Prompt** : indiquer explicitement le **cas IRSA** lors de l’analyse d’un constat amiable auto (`lib/assistant/sinistro-system-prompt.ts`).

### 4. Doc PR

- Fichier `docs/PR-ML-IA.md` (ce document).

---

## Commandes (package.json)

| Script | Usage |
|--------|--------|
| `npm run extract:pauline-pdfs` | Tous les PDF de `docs/pdf/auto/` → fiches `docs/knowledge/pauline/*.md` |
| `npm run migrate:pauline-firestore` | Charge les fiches Pauline vers Firestore (RAG) |

---

## Branche & commits (ml-ia → main)

- **Branche** : `ml-ia` → **base** : `main`
- **Commits inclus** :
  1. `docs: ajout PR-ML-IA.md (description PR ml-ia → main)`
  2. `feat(pauline): bot Produits Particuliers + widget dashboard + cas IRSA Sinistro`
  3. `feat(pauline): extraction PDFs auto vers base connaissance + script extract:pauline-pdfs`

---

## Après merge : supprimer la branche ml-ia

1. **Sur GitHub** : après avoir mergé la PR, cliquer sur « Delete branch » (ou aller dans Settings → Branches et supprimer `ml-ia`).
2. **En local** (optionnel) :
   ```bash
   git checkout main
   git pull origin main
   git branch -d ml-ia
   ```
   Si la branche distante a été supprimée :
   ```bash
   git fetch --prune
   git branch -d ml-ia
   ```

---

## À faire après merge (prod)

- Lancer `npm run migrate:pauline-firestore` si la collection `pauline_knowledge` n’est pas encore alimentée en prod.
- Vérifier que l’index vectoriel Firestore pour `pauline_knowledge` est actif (extension Vector Search).
