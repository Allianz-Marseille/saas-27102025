# Plan de Développement : Sinistro

**Agent :** Sinistro — Assistant IA expert en gestion de sinistres pour agence d'assurance.  
**Lieu doc :** `docs/agents-ia/sinistro_sinistre/`  
**Visuel :** `public/agents-ia/bot-sinistre/sinistro.png`  
**Base connaissance sinistres :** `docs/knowledge/process/sinistres.md`, `docs/knowledge/20-sinistres.md`

**Objectif :** Copilote métier qui réduit la saisie (OCR constats), sécurise la décision juridique (IRSA / Droit commun), standardise la communication (courriers/mails).

**Stack :** Next.js (App Router), Firebase (Auth / Firestore / Storage), OpenAI API (GPT-4o, Embeddings), Vercel.

---

## Sommaire

1. [Vision du produit](#1-vision-du-produit)
2. [Architecture technique & data](#2-architecture-technique--data)
3. [Backlog détaillé (modules)](#3-backlog-détaillé-modules)
4. [Spécifications du system prompt](#4-spécifications-du-system-prompt)
5. [Sécurité et conformité](#5-sécurité-et-conformité)
6. [Roadmap de développement](#6-roadmap-de-développement)
7. [Références & conventions](#7-références--conventions)

---

## 1. Vision du produit

Sinistro n'est **pas** un chatbot généraliste. C'est un **copilote métier** qui :

| # | Pilier | Description |
|---|--------|--------------|
| 1 | **Réduire le temps de saisie** | OCR de constats amiable (manuscrits, photos, PDF). |
| 2 | **Sécuriser la décision juridique** | Maîtrise IRSA (auto), IRSI (habitation), Loi Badinter, droit commun. |
| 3 | **Standardiser la communication** | Génération de courriers et mails (refus de garantie, recours, relances). |

---

## 2. Architecture technique & data

### A. Analyse de documents (Vision)

| Élément | Détail |
|--------|--------|
| **Input** | Upload de photos / PDF (constat amiable, rapport d'expert). |
| **Traitement** | `gpt-4o` (Vision) pour extraction de données structurées. |
| **Output attendu** | JSON : cases cochées (A/B), immatriculations, sens de circulation, observations, croquis interprété. |

### B. Base de connaissances (RAG)

| Élément | Détail |
|--------|--------|
| **Sources** | Convention IRSA (Automobile), Convention IRSI (Habitation), Loi Badinter, Code des assurances. |
| **Stockage** | Vecteurs via **OpenAI Embeddings**, index dans **Firebase Vector Search** ou **Pinecone**. |
| **Usage** | RAG pour matcher les faits du constat à un cas de convention et fournir justification juridique. |

---

## 3. Backlog détaillé (modules)

### Module 1 : Analyse de constat (priorité)

| # | Fonctionnalité | Statut | Notes |
|---|----------------|--------|-------|
| 1.1 | **Interface d'upload** | À faire | Zone drag & drop liée à Firebase Storage. |
| 1.2 | **Extraction intelligente** | À faire | Identifier le véhicule de l'assuré (A ou B). |
| 1.3 | **Détection de contradictions** | À faire | Alerter si les cases cochées par A et B sont incompatibles (ex. les deux « doublaient »). |
| 1.4 | **Interprétation du croquis** | À faire | Décrire la scène à partir du dessin du constat. |

### Module 2 : Aide à la décision (expertise)

| # | Fonctionnalité | Statut | Notes |
|---|----------------|--------|-------|
| 2.1 | **Matching de convention** | À faire | Mapper les faits avec un cas spécifique (ex. Cas 13 IRSA). |
| 2.2 | **Calcul de responsabilité** | À faire | Déterminer le barème (%, %, %). |
| 2.3 | **Justification juridique** | À faire | Citer l'article de la convention ou du Code des assurances pour justifier auprès du client ou du tiers. |

### Module 3 : Interface collaboratrice (UX)

| # | Fonctionnalité | Statut | Notes |
|---|----------------|--------|-------|
| 3.1 | **Chat persistant** | À faire | Historique des échanges par dossier sinistre (Firestore). |
| 3.2 | **Inputs pré-sélectionnés** | À faire | « Analyser ce constat », « Rédiger un mail de refus de garantie », « Vérifier le recours possible ». |
| 3.3 | **Validation humaine** | À faire | Système « Approuver / Modifier » sur les suggestions du bot. |

---

## 4. Spécifications du system prompt

Sinistro adopte la personnalité d’un **« Gestionnaire Principal Expert »**.

| Règle | Spécification |
|-------|----------------|
| **Ton** | Professionnel, précis, rassurant. |
| **Règle d'or** | En cas de doute entre deux cas de convention : présenter les **deux options** et demander une **précision** à la collaboratrice. |
| **Format de réponse** | Toujours : **résumé court** en premier, puis **détail technique** en spoiler ou accordéon. |

---

## 5. Sécurité et conformité

| Thème | Exigence |
|-------|----------|
| **RGPD** | Anonymisation des noms propres dans les prompts si possible. |
| **Audit trail** | Logger chaque recommandation Sinistro dans Firestore pour traçabilité en cas de litige de règlement. |

---

## 6. Roadmap de développement

### Étape 1 : Setup & Vision

- [ ] Configurer l’API Route Next.js pour l’upload vers Firebase Storage.
- [ ] Créer le composant d’analyse d’image utilisant `gpt-4o` (Vision).
- [ ] Parser le résultat en un objet TypeScript `ConstatData`.

### Étape 2 : Intelligence métier

- [ ] Créer le script d’ingestion (seeding) des PDF de conventions en vecteurs.
- [ ] Implémenter la fonction de recherche RAG pour lier un constat à une règle IRSA (et IRSI/Badinter si pertinent).

### Étape 3 : Output & finition

- [ ] Créer les templates de génération de mails (refus de garantie, recours, relances).
- [ ] Intégrer les boutons d’actions rapides (inputs pré-sélectionnés) dans l’UI existante.

---

## 7. Références & conventions

| Référence | Emplacement |
|-----------|-------------|
| Conventions sinistres (IRSA, IRSI, Badinter) | `docs/knowledge/process/sinistres.md` |
| Fiche sinistres | `docs/knowledge/20-sinistres.md` |
| Convention nommage agents | `docs/agents-ia/README.md` (slug : `bot-sinistre`, prénom : Sinistro) |
| Avatar Sinistro | `public/agents-ia/bot-sinistre/sinistro.png` |

---

**Prochaine action suggérée :** Implémenter la route API Next.js d’analyse du constat avec OpenAI Vision (`gpt-4o`) et le type `ConstatData`.
