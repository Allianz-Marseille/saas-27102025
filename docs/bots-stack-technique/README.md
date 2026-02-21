# Bots — Stack technique

La stack technique des agents IA du SaaS **Allianz Marseille** est conçue pour transformer les connaissances métier en outils d’aide à la vente. Elle repose sur une architecture moderne : vision, calcul métier (dont fiscal), gestion documentaire et hébergement unifié.

Ce document décrit l’**organisation technique commune** à tous les bots (actuels et à venir) : modèle, base de connaissances, fonctionnalités, UI et infrastructure.

---

## Stack technique générale

| Couche | Technologie |
|--------|-------------|
| **Modèle** | **Gemini 1.5 Pro / Flash** — fenêtre de contexte étendue, traitement natif texte / images / PDF |
| **Base de connaissances** | Fichiers **Markdown** (`.md`) organisés par index — référentiel unique par bot (plafonds, régimes, solutions produits). Ingestion par **context injection** dans le prompt système. |
| **Application** | **Next.js 16** (App Router) + **SDK Google Generative AI** — streaming des réponses, API Routes, exécution de fonctions côté serveur |
| **Backend / Données** | **Firebase** (Auth, Firestore, etc.) pour utilisateurs et données métier |
| **Hébergement** | **Vercel** — déploiement et exécution des API |
| **IDE** | **Cursor** — indexation des fichiers de méthode et règles projet pour aligner le code sur les processus métier |

---

## Base de connaissances (RAG light)

- **Structure :** dossiers dédiés par bot (ex. `docs/assets-gemini/<bot>/`) avec table des matières, workflow et fiches métier en Markdown.
- **Usage :** les fichiers sont injectés dans le contexte (context injection) pour que l’IA s’appuie sur les données à jour plutôt que sur son entraînement.
- **Évolution :** chaque nouveau bot dispose de son propre dossier de base de connaissances ; la stack (Gemini, Next.js, Firebase, Vercel) reste commune.

---

## Fonctionnalités induites (par design de la stack)

### 1. Intelligence multimodale et vision

- **Extraction :** lecture et extraction d’informations (revenus, noms, dates, etc.) depuis captures d’écran (ex. CRM Lagon) ou PDF (ex. liasses fiscales).
- **Validation :** l’IA confirme les données extraites (âge assurantiel, métier, revenus, etc.) avant d’enchaîner sur des calculs ou recommandations.

### 2. Moteur de calcul métier

- **Analyse de gap :** calcul du « manque à gagner » en croisant plafonds sociaux et prestations des régimes / caisses concernés.
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
- **Streaming :** réponses diffusées en temps réel via le SDK Google et les API Routes Next.js.
- **Authentification et données :** **Firebase** pour la session utilisateur et les données métier ; l’UI s’appuie sur le même socle Next.js pour tous les bots.

---

## Récapitulatif

| Domaine | Choix technique |
|---------|------------------|
| **Modèle** | Gemini 1.5 Pro / Flash |
| **Base de connaissances** | Markdown par bot, context injection |
| **Framework** | Next.js 16, TypeScript |
| **Backend** | Firebase (Auth, Firestore) |
| **Hébergement** | Vercel |
| **Fonctionnalités** | Vision / OCR, validation, calcul métier, simulation fiscale (si pertinent), livrables structurés, **proposition de liens devis** (docs/devis) |
| **UI** | Chat Markdown + React, streaming |
| **IDE** | Cursor, règles projet |

Chaque nouveau bot réutilise cette stack ; seules la base de connaissances et les règles métier (workflow, calculs, livrables) sont spécifiques au domaine (prévoyance, santé, sinistres, etc.).
