<!-- 465a8fc2-5900-40db-b60e-c037b2e9cd07 1addb81f-cae3-4c8d-911c-2a0d1f32e2d6 -->
# Refonte complète du système RAG - Base propre et fonctionnelle

## Diagnostic des problèmes

### Problèmes identifiés

1. **pdf-parse** : incompatible avec environnement serverless (erreurs DOMMatrix, Canvas)
2. **Dépendances mixtes** : pdf-parse ET pdfjs-dist présents simultanément
3. **Configuration manquante** : pas de guide de configuration dès le début
4. **Tests incomplets** : pas de validation du système avant déploiement

### Causes racines

- Approche réactive au lieu de proactive
- Manque de documentation de configuration
- Bibliothèques PDF incompatibles avec Vercel serverless

## Plan de correction

### Phase 1 : Nettoyage complet des dépendances

**Fichiers :** [`package.json`](package.json)

1. Supprimer complètement `pdf-parse` et `@types/pdf-parse`
2. Garder uniquement `pdfjs-dist` (solution éprouvée pour Node.js)
3. Vérifier que `tesseract.js` est présent pour l'OCR

### Phase 2 : Correction de l'extraction PDF

**Fichier :** [`lib/rag/pdf-processor.ts`](lib/rag/pdf-processor.ts)

1. **Supprimer tout le code lié à pdf-parse**

- Fonction `getPdfParse()` obsolète
- Polyfills DOMMatrix/DOMPoint obsolètes

2. **Configurer correctement pdfjs-dist pour Node.js**

- Ajouter configuration worker pour environnement serverless
- Gérer les promesses de chargement correctement
- Extraire le texte page par page

3. **Simplifier la gestion d'erreurs**

- Messages clairs et spécifiques
- Pas de validation PDF complexe (laisser pdfjs-dist gérer)

### Phase 3 : Vérification système Tesseract

**Fichier :** [`lib/rag/pdf-processor.ts`](lib/rag/pdf-processor.ts)

1. Vérifier que `extractTextFromImage` fonctionne
2. Tester avec une vraie image
3. Gérer les timeouts potentiels en serverless

### Phase 4 : Tests complets du système

**Nouveau fichier :** `scripts/test-rag-upload.ts`

Créer un script de test qui :

1. Teste la connexion Qdrant
2. Teste l'extraction PDF avec pdfjs-dist
3. Teste l'OCR avec une image
4. Teste la génération d'embeddings OpenAI
5. Teste l'indexation Qdrant

### Phase 5 : Documentation de configuration

**Fichier :** [`SETUP_QDRANT.md`](SETUP_QDRANT.md) (à améliorer)

Créer un guide `SETUP_RAG_COMPLETE.md` avec :

1. **Checklist de pré-configuration** (avant de coder)
2. **Guide Qdrant Cloud** (avec captures)
3. **Guide OpenAI** (génération clé API)
4. **Configuration Firebase Storage**
5. **Variables Vercel** (toutes listées)
6. **Script de validation** (`npm run test:rag`)

### Phase 6 : Amélioration de l'API upload

**Fichier :** [`app/api/chat/upload/route.ts`](app/api/chat/upload/route.ts)

1. Meilleure gestion des timeouts serverless
2. Retourner des erreurs plus explicites
3. Ajouter des métriques de performance

## Fichiers à modifier

1. [`package.json`](package.json) - Suppression pdf-parse
2. [`lib/rag/pdf-processor.ts`](lib/rag/pdf-processor.ts) - Nettoyage code pdf-parse, configuration pdfjs-dist
3. [`app/api/chat/upload/route.ts`](app/api/chat/upload/route.ts) - Amélioration gestion erreurs
4. `scripts/test-rag-upload.ts` - Nouveau script de test
5. `SETUP_RAG_COMPLETE.md` - Documentation complète

## Ordre d'exécution

1. Nettoyer package.json (supprimer pdf-parse)
2. Nettoyer pdf-processor.ts (supprimer code obsolète)
3. Tester extraction PDF avec pdfjs-dist
4. Créer script de test
5. Créer documentation complète
6. Tester en local
7. Déployer et tester en production

## Résultat attendu

- Upload PDF fonctionnel en local ET production
- Upload images avec OCR fonctionnel
- Documentation complète pour configuration future
- Script de validation pour diagnostiquer rapidement les problèmes

### To-dos

- [x] Améliorer la fonctionnalité de copie - ajouter bouton pour copier toute la conversation
- [x] Améliorer le feedback utilisateur pour le collage d'image - ajouter toast et meilleure UX
- [x] Ajouter fonctionnalité pour exporter/télécharger la conversation en format texte
- [ ] Corriger l'import de pdf-parse dans pdf-processor.ts - utiliser import statique et ajouter validation PDF
- [ ] Améliorer la gestion d'erreurs dans pdf-processor.ts - distinguer erreurs récupérables/fatales, messages spécifiques
- [ ] Ajouter validation préalable dans upload route - vérifier config Qdrant/OpenAI/Storage avant traitement
- [ ] Améliorer gestion erreurs upload route - rollback complet, messages spécifiques, retry mechanism
- [ ] Ajouter logs structurés dans upload route - ID trace, métriques, contexte erreurs
- [ ] Améliorer robustesse suppression - vérifications préalables, rollback si erreur partielle
- [ ] Améliorer client Qdrant - vérification santé, retry avec backoff, logs détaillés
- [ ] Créer script diagnose-rag-system.ts pour vérifier toute la chaîne RAG
- [ ] Améliorer UI upload dialog - messages erreurs spécifiques, progression détaillée, métriques
- [ ] Nettoyer package.json - supprimer pdf-parse complètement
- [ ] Nettoyer pdf-processor.ts - supprimer code pdf-parse obsolète
- [ ] Corriger configuration pdfjs-dist pour serverless
- [ ] Vérifier fonctionnement Tesseract.js
- [ ] Créer script test-rag-upload.ts
- [ ] Créer documentation SETUP_RAG_COMPLETE.md
- [ ] Tester upload PDF et image en local
- [ ] Déployer et tester en production
- [x] 
- [x] 
- [x] 
- [x] 
- [x] 
- [x] 
- [x] 
- [x] 
- [ ] Corriger l'import de pdf-parse dans pdf-processor.ts - utiliser import statique et ajouter validation PDF
- [ ] Améliorer la gestion d'erreurs dans pdf-processor.ts - distinguer erreurs récupérables/fatales, messages spécifiques
- [ ] Ajouter validation préalable dans upload route - vérifier config Qdrant/OpenAI/Storage avant traitement
- [ ] Améliorer gestion erreurs upload route - rollback complet, messages spécifiques, retry mechanism
- [ ] Ajouter logs structurés dans upload route - ID trace, métriques, contexte erreurs
- [ ] Améliorer robustesse suppression - vérifications préalables, rollback si erreur partielle
- [ ] Améliorer client Qdrant - vérification santé, retry avec backoff, logs détaillés
- [ ] Créer script diagnose-rag-system.ts pour vérifier toute la chaîne RAG
- [ ] Améliorer UI upload dialog - messages erreurs spécifiques, progression détaillée, métriques
- [ ] Nettoyer package.json - supprimer pdf-parse complètement
- [ ] Nettoyer pdf-processor.ts - supprimer code pdf-parse obsolète
- [ ] Corriger configuration pdfjs-dist pour serverless
- [ ] Vérifier fonctionnement Tesseract.js
- [ ] Créer script test-rag-upload.ts
- [ ] Créer documentation SETUP_RAG_COMPLETE.md
- [ ] Tester upload PDF et image en local
- [ ] Déployer et tester en production
- [ ] Corriger l'import de pdf-parse dans pdf-processor.ts - utiliser import statique et ajouter validation PDF
- [ ] Améliorer la gestion d'erreurs dans pdf-processor.ts - distinguer erreurs récupérables/fatales, messages spécifiques
- [ ] Ajouter validation préalable dans upload route - vérifier config Qdrant/OpenAI/Storage avant traitement
- [ ] Améliorer gestion erreurs upload route - rollback complet, messages spécifiques, retry mechanism
- [ ] Ajouter logs structurés dans upload route - ID trace, métriques, contexte erreurs
- [ ] Améliorer robustesse suppression - vérifications préalables, rollback si erreur partielle
- [ ] Améliorer client Qdrant - vérification santé, retry avec backoff, logs détaillés
- [ ] Créer script diagnose-rag-system.ts pour vérifier toute la chaîne RAG
- [ ] Améliorer UI upload dialog - messages erreurs spécifiques, progression détaillée, métriques
- [ ] Nettoyer package.json - supprimer pdf-parse complètement
- [ ] Nettoyer pdf-processor.ts - supprimer code pdf-parse obsolète
- [ ] Corriger configuration pdfjs-dist pour serverless
- [ ] Vérifier fonctionnement Tesseract.js
- [ ] Créer script test-rag-upload.ts
- [ ] Créer documentation SETUP_RAG_COMPLETE.md
- [ ] Tester upload PDF et image en local
- [ ] Déployer et tester en production