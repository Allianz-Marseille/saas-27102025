# Bots — Stack technique

La stack technique des agents IA du SaaS **Allianz Marseille** est conçue pour transformer les connaissances métier en outils d’aide à la vente. Elle repose sur une architecture moderne : vision, calcul métier (dont fiscal), gestion documentaire et hébergement unifié.

Ce document décrit l’**organisation technique commune** à tous les bots (actuels et à venir) : modèle, base de connaissances, fonctionnalités, UI et infrastructure.

---

## Règle fondamentale : Utilisateur = Collaborateur de l'agence

**L'utilisateur des bots est toujours un collaborateur de l'agence**, jamais le client final.

| Acteur | Rôle |
|--------|------|
| **Utilisateur du bot** | Collaborateur de l'agence (conseiller, courtier, etc.) — interlocuteur direct dans le chat |
| **Client** | Personne ou entreprise dont on collecte les données et pour qui on réalise l'analyse |

- Les bots **ne doivent jamais** demander à l'utilisateur son prénom, nom ou date de naissance.
- Toutes les questions de collecte portent sur le **client** : « Quel est le prénom et nom du client ? », « Quelle est la date de naissance du client ? », etc.
- Les workflows et prompts doivent formuler explicitement « du client » pour éviter toute ambiguïté.

---

## Architecture multi-agents (implémentée)

Le système utilise un **registre** et un **Context Loader** pour charger dynamiquement le contexte de chaque agent.

| Fichier / module | Rôle |
|------------------|------|
| `docs/assets-gemini/registry-bots.md` | Index des agents (botId, dossier source, workflow principal) |
| `lib/ai/bot-loader.ts` | `getBotContext(botId)` charge workflow + connaissances + référentiel global, retourne `systemInstruction` |
| `app/api/chat/route.ts` | Extrait `botId` + `message` (+ history, attachments), appelle Gemini 1.5 Pro en streaming avec Vision |

**Scalabilité :** ajouter un bot = créer le dossier dans `docs/assets-gemini/` + une ligne dans le registre. Aucun changement de code.

---

## Stack technique générale

| Couche | Technologie |
|--------|-------------|
| **Modèle** | **Gemini 1.5 Pro / Flash** — fenêtre de contexte étendue, traitement natif texte / images / PDF |
| **Base de connaissances** | Markdown dans `docs/assets-gemini/` : registre, référentiel global (plafonds 2026), workflow et fiches par bot. Chargement via **bot-loader**. |
| **Application** | **Next.js 16** (App Router) + **SDK @google/genai** — streaming, API Routes, Vision pour images Lagon/Liasses |
| **Backend / Données** | **Firebase** (Auth, Firestore, etc.) pour utilisateurs et données métier |
| **Hébergement** | **Vercel** — déploiement et exécution des API |
| **IDE** | **Cursor** — indexation des fichiers de méthode et règles projet pour aligner le code sur les processus métier |

---

## Base de connaissances (RAG light)

- **Structure :** `docs/assets-gemini/` avec `registry-bots.md`, `01-referentiel-social-plafonds-2026.md` (global), et par bot un dossier (ex. `bob-prevoyance/`) contenant le workflow (`00-workflow-*.md`) et les fiches métier (`.md`).
- **Usage :** `getBotContext(botId)` charge et concatène les fichiers avant l'appel Gemini.
- **Évolution :** nouveau bot = nouveau dossier + ligne dans le registre.

---

## Fonctionnalités induites (par design de la stack)

### 1. Intelligence multimodale et vision

- **Extraction :** lecture et extraction d’informations (revenus, noms, dates, etc.) depuis captures d’écran (ex. CRM Lagon) ou PDF (ex. liasses fiscales).
- **Validation :** l’IA confirme les données extraites (âge assurantiel, métier, revenus, etc.) avant d’enchaîner sur des calculs ou recommandations.

### 2. Moteur de calcul métier

- **Logique TNS (3 couches obligatoires) :** 1) **SSI** (droits de base), 2) **RO** (Régime Obligatoire métier). Manque à gagner = Besoin − (SSI + RO). Ne jamais sauter l'étape SSI.
- **Analyse de gap :** exposer clairement SSI, RO, puis gap.
- **Timeline :** modélisation des périodes d’indemnisation et des ruptures de couverture (ex. relais au 91ᵉ jour lorsque cela s’applique au domaine du bot).

### 3. Simulation fiscale (quand applicable)

- **Effort réel :** passage d’une cotisation brute à un coût net d’impôt via estimation de la **TMI** (Tranche Marginale d’Imposition).
- **Scénarios :** trois hypothèses fiscales (Conservateur, Central, Optimiste) pour illustrer le gain fiscal (ex. Loi Madelin pour les bots prévoyance).

### 4. Aide à la vente et livrables

- **Diagnostic structuré :** production de tableaux (risques couverts vs manque à gagner, selon le périmètre du bot).
- **Recommandations contextuelles :** suggestions de solutions (produits, partenaires) en fonction du profil détecté.
- **Traçabilité :** citation des sources (fichier, régime ou référence) en bas d’analyse pour fiabiliser l’information.

### 5. Liens vers les devis

Les bots **doivent pouvoir proposer des liens vers les devis Allianz** dès que le contexte le justifie (besoin exprimé par le client, opportunité détectée, recommandation produit). Les liens incluent le code agence pour attribuer le devis à la bonne agence (Corniche H91358, Rouvière H92083).

- **Source des liens :** listes centralisées dans [docs/devis/README.md](../devis/README.md) — [Corniche H91358](../devis/H91358/liens-devis.md), [Rouvière H92083](../devis/H92083/liens-devis.md). Les bases de connaissances et prompts des bots doivent y faire référence (ou inclure les URLs pertinentes selon le périmètre du bot).
- **Comportement attendu :** proposer le lien de devis adapté (Auto, Habitation, Santé, Emprunteur, Pro, GAV, scolaire, etc.) sous forme de lien cliquable dans la réponse, avec une phrase d’accompagnement courte (ex. « Pour réaliser un devis personnalisé : [Devis Habitation](…) »).

---

## Interface et expérience utilisateur

- **Chat :** interface conversationnelle avec rendu **Markdown** enrichi et composants **React** pour tableaux, scénarios fiscaux et boutons d’action.
- **Actions dans le header du chat :** **Copier le chat** (intégralité de l'échange dans le presse-papier), **Préparer un mail** (objet, formule d'appel, corps, signature), **Préparer une note de synthèse** (titre, date, client, chargé, corps). Le **prénom du chargé de clientèle** est dérivé de l'email de connexion ; le **nom du client** est extrait des messages de l'assistant (identité collectée pendant l'échange).
- **Boutons d'accroche à deux niveaux (optionnel) :** niveau 1 (ex. Bonjour, Question SSI, Régime obligatoire, Loi Madelin) ; après « Bonjour », boutons niveau 2 colorés (Lagon, Liasse, Questions). Config : `quickRepliesLevel1`, `quickRepliesLevel2`, `bonjourTriggerMessage` sur `BotChat`.
- **Streaming :** réponses diffusées en temps réel via le SDK Google et les API Routes Next.js.
- **Authentification et données :** **Firebase** pour la session utilisateur et les données métier ; l’UI s’appuie sur le même socle Next.js pour tous les bots.

---

## Récapitulatif

| Domaine | Choix technique |
|---------|------------------|
| **Modèle** | Gemini 1.5 Pro / Flash |
| **Base de connaissances** | Markdown dans assets-gemini, bot-loader, registre |
| **Framework** | Next.js 16, TypeScript |
| **Backend** | Firebase (Auth, Firestore) |
| **Hébergement** | Vercel |
| **Fonctionnalités** | Vision / OCR, validation, calcul métier, simulation fiscale (si pertinent), livrables structurés, **proposition de liens devis** (docs/devis) |
| **UI** | Chat Markdown + React, streaming |
| **IDE** | Cursor, règles projet |

Chaque nouveau bot réutilise cette stack ; seules la base de connaissances et les règles métier (workflow, calculs, livrables) sont spécifiques au domaine (prévoyance, santé, sinistres, etc.).
