# Bots — Stack technique

La stack technique des bots est conçue pour transformer une base de connaissances statique (fichiers Markdown) en une intelligence artificielle conversationnelle et visuelle, intégrée au SaaS **Allianz Marseille**.

---

## Ce qui est commun à tous les bots (général)

### 1. Modèle et ingestion des connaissances

- **Modèle core :** **Gemini 1.5 Pro** (ou Flash), pour la fenêtre de contexte étendue (1M+ tokens) et les capacités multimodales natives (Vision / OCR).
- **Méthode d’ingestion :** **Context Injection** — les fichiers sont injectés directement dans le prompt système pour que l’IA s’appuie sur les données à jour plutôt que sur ses connaissances générales.

### 2. Capacités multimodales (Vision & OCR)

- **Extraction automatisée :** **Gemini Vision** pour analyser captures d’écran (ex. CRM Lagon) ou PDF (ex. liasses fiscales).
- **Validation des données :** pipeline de vérification : l’IA confirme les champs extraits (ex. Métier, Date de naissance, Revenu, Nom) avant tout calcul.

### 3. Stack de développement et UI

- **Framework :** **Next.js 16** (App Router) avec **TypeScript** pour un typage rigoureux des données.
- **Interface de chat :** rendu Markdown enrichi et/ou composants React pour les tableaux et recommandations.
- **Outils :** **Cursor**, avec règles projet (ex. `.cursorrules`) pour garder la cohérence avec le workflow méthodologique lors des mises à jour de code.

---

## Ce qui est spécifique au premier bot (Bob prévoyance)

### 1. Base de connaissances

- **Emplacement :** `docs/assets-gemini/bob-prevoyance/` — ensemble structuré de fichiers Markdown (table des matières, workflow, plafonds 2026, régimes obligatoires, solutions Allianz/UNIM/UNICED).
- **Contenu :** plafonds SSI/CPAM 2026, régimes (CARPIMKO, CAVEC, CPRN, CAVAMAC, etc.), solutions et arguments Allianz prévoyance.

### 2. Moteur de calcul (logique métier)

- **Estimation fiscale :** simulation de la **Tranche Marginale d’Imposition (TMI)** (11 %, 30 %, 41 %) et calcul de l’effort d’épargne réel (Loi Madelin) :  
  **Cotisation Nette = Cotisation Brute × (1 − TMI)**  
  avec présentation en 3 scénarios (Conservateur / Central / Optimiste).
- **Moteur de gap :** croisement entre le référentiel social (SSI/CPAM) et les spécificités des caisses libérales pour calculer le **manque à gagner** (Arrêt, Invalidité, Décès).
- **Timeline :** gestion des ruptures de couverture, en particulier le **relais critique au 91ème jour** (caisses libérales).

### 3. Rendu obligatoire

- **Tableau de diagnostic :** Arrêt (ITT), Invalidité, Décès — Régime obligatoire vs Manque à gagner.
- **Tableau de simulation fiscale :** 3 scénarios TMI avec effort réel (net d’impôt).
- **Timeline de l’arrêt :** J1–J3, J4–J90, J91+ (couverture et reste à charge).

---

## Schéma récapitulatif

| Élément | Tous les bots | Bob prévoyance uniquement |
|--------|----------------|----------------------------|
| Modèle (Gemini) | ✅ | — |
| Context injection (MD) | ✅ | — |
| Vision / OCR + validation | ✅ | — |
| Next.js / TypeScript / Cursor | ✅ | — |
| Base MD plafonds & régimes 2026 | — | ✅ |
| TMI + Loi Madelin (3 scénarios) | — | ✅ |
| Moteur de gap (SSI + caisses) | — | ✅ |
| Timeline 91ème jour | — | ✅ |
| Tableaux Diagnostic + Fiscal | — | ✅ |

---

*Pour verrouiller cette stack dans l’IDE, une configuration dans `.cursorrules` (ou règles Cursor projet) peut reprendre ces choix (Gemini, context injection, workflow Bob).*
