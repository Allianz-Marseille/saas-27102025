# PR : ml-ia → main — OCR Vision + RAG Sinistro (conventions IRSA, IRSI, CIDE-COP)

## Titre suggéré

**feat(ml-ia): OCR Vision sur images + RAG Sinistro enrichi (IRSA, IRSI, CIDE-COP)**

---

## Description

### 1. Intégration OCR Vision (Nina, Sinistro, Bob)

- **Nouveau module** `lib/assistant/vision-ocr.ts` : extraction de texte depuis les images via Google Cloud Vision (`extractTextFromImageWithVision`, `extractTextFromImagesWithVision`), avec option `documentTextDetection: true` pour les constats Sinistro.
- **API chat** `app/api/assistant/chat/route.ts` : pour toute conversation avec images, le texte OCR est injecté dans le prompt (section « TEXTE EXTRAIT DES IMAGES (OCR) »), max 5 images, fallback propre en cas d’erreur.
- **Credentials** : prise en charge de `GOOGLE_APPLICATION_CREDENTIALS` (chemin) ou `GOOGLE_APPLICATION_CREDENTIALS_JSON` dans `lib/assistant/file-extraction.ts` et `app/api/ocr/pdf/route.ts`.
- **Sinistro** : prompt ajusté pour autoriser l’identification des personnes sur les constats (usage interne).

### 2. Enrichissement RAG Sinistro (conventions PDF)

- **Scripts d’extraction PDF → Markdown** (CommonJS, pdf-parse v2) :
  - `scripts/extract-irsa-pdf.cjs` → `docs/knowledge/sinistro/irsa-convention-complete.md`
  - `scripts/extract-irsi-pdf.cjs` → `docs/knowledge/sinistro/irsi-convention-complete.md`
  - `scripts/extract-cide-cop-pdf.cjs` → `docs/knowledge/sinistro/cide-cop-convention-complete.md`
- **PDF sources** ajoutés dans `docs/pdf/conventions/` : `irsa.pdf`, `convention-irsi.pdf`, `convention-cide-cop.pdf`.
- **Source de vérité** : `docs/knowledge/sinistro/00-SOURCE-DE-VERITE.md` mis à jour avec les trois fiches « convention-complete ».
- **Procédure** : `docs/knowledge/sinistro/ENRICHIR-AVEC-IRSA-PDF.md` (étapes IRSA, IRSI, CIDE-COP + commandes `npm run extract:*-pdf` puis `npm run migrate:sinistro-firestore`).

### 3. Documentation et nettoyage

- **ORGANISATION-NINA.txt**, **ORGANISATION-SINISTRO.txt**, **ORGANISATION-BOB.txt** : flux OCR, credentials, débogage.
- Suppression : `TODO-VISION-OCR-INTEGRATION.txt`, `FIREBASE-ML-UTILITE-ET-MISE-EN-OEUVRE.txt` (tâches réalisées / redondant).

---

## Commandes ajoutées (package.json)

| Script | Usage |
|--------|--------|
| `npm run extract:irsa-pdf` | IRSA PDF → `irsa-convention-complete.md` |
| `npm run extract:irsi-pdf` | IRSI PDF → `irsi-convention-complete.md` |
| `npm run extract:cide-cop-pdf` | CIDE-COP PDF → `cide-cop-convention-complete.md` |
| `npm run migrate:sinistro-firestore` | Charge toutes les fiches Sinistro dans Firestore (RAG) |

---

## Branche & commits

- **Branche** : `ml-ia` → **base** : `main`
- **Commits** :
  1. `feat(ml-ia): intégration OCR Vision pour Nina, Sinistro, Bob`
  2. `docs(ml-ia): doc OCR dans ORGANISATION + Sinistro identifie les personnes sur constats`
  3. `feat(sinistro): OCR Vision + RAG conventions IRSA, IRSI, CIDE-COP`

---

## À faire après merge

- Lancer `npm run migrate:sinistro-firestore` en environnement cible si les fiches RAG ne sont pas encore déployées.
- Vérifier que `GOOGLE_APPLICATION_CREDENTIALS` ou `GOOGLE_APPLICATION_CREDENTIALS_JSON` est configuré pour l’OCR Vision en prod.
