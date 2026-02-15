# Bot / Agent IA Standard

Ce document définit l’agent IA standard du SaaS : architecture, orchestration des modèles Mistral, RAG et intégration technique (Next.js / Firebase / Vercel).

---

## 1. Architecture des "Cerveaux" (Multi-Modèles)

Mistral fournit des modèles spécialisés. Le bot les orchestre selon le cas d’usage :

| Cas d’usage | Modèle | Rôle |
|-------------|--------|------|
| **Analyse d’image (Vision)** | Pixtral ou Mistral Large | Extraction de garanties depuis une photo de contrat concurrent |
| **Traitement PDF (OCR)** | API Mistral OCR | Conversion des Vademecums en Markdown pour garder les tableaux lisibles par l’IA |
| **Raisonnement & Suivi** | Mistral Large | Chatbot principal, plan de découverte client, processus M+3 |

---

## 2. Organisation de la Connaissance (RAG)

Pour des réponses précises à partir des Dispositions Générales (DG) :

1. **Ingestion** : Envoi des PDF à l’API OCR Mistral.
2. **Stockage** : Enregistrement du texte Markdown dans l’onglet **"Fichiers"** de l’espace de travail Mistral.
3. **Récupération** : Activation de l’outil **"Recherche"** sur l’agent. L’IA ne lit les documents que lorsqu’elle en a besoin.

---

## 3. Comportement (System Prompt)

Dans la console Mistral, les **Instructions** de l’agent suivent deux processus principaux.

### A. Plan de découverte (Phase 1)

L’agent pose les questions une par une :
- Identité
- Métier (RO)
- Revenus (BNC/BIC)
- Besoins vitaux et frais fixes

### B. Processus M+3 (Phase de suivi)

- Si l’utilisateur indique être en phase de suivi, l’agent active le protocole **M+3 (Mise en place + 3 mois)**.
- L’IA vérifie la réception des documents obligatoires (preuve de communication des DG, etc.).

---

## 4. Intégration technique (Next.js)

### Backend (Route Handler sur Vercel)

- Utiliser une route API dédiée qui gère le **streaming**.
- Les réponses de l’IA s’affichent en temps réel dans le chat.

### Base de données (Firebase)

| Service | Usage |
|--------|--------|
| **Firestore** | Stockage des sessions de chat. À chaque message, récupération de l’historique pour maintenir le contexte (ex. client « Kiné » ou « Médecin »). |
| **Storage** | Stockage des photos uploadées avant envoi à l’API Vision Mistral. |

---

## 5. Flux de travail utilisateur

1. **Entrée** : Le collaborateur ouvre le chat et choisit « Nouveau Bilan ».
2. **Vision** : Il photographie le contrat actuel du client. Le bot extrait les données (ex. : *« J’ai bien lu le contrat AXA, vous avez une carence de 90 jours. »*).
3. **Documentaire** : Le bot croise ces informations avec les **Vademecums Allianz** stockés en interne.
4. **Sortie** : Le bot affiche le tableau des **3 enveloppes** et propose de générer le mail de synthèse client.

---

## 6. Avantages de cette organisation

En utilisant l’**ID de l’agent** configuré dans un **espace de travail dédié** :

- Le code (Next.js) reste séparé de l’intelligence (Mistral).
- Les règles du Vademecum peuvent être modifiées dans la console Mistral sans redéployer l’application sur Vercel.

---

## À compléter

- [ ] Spécification détaillée de la fonction « Suivi M+3 » à ajouter dans les instructions système pour le protocole à J+3 mois.
