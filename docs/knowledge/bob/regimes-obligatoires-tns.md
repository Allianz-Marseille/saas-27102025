# Régimes obligatoires TNS — Inventaire

Inventaire des **régimes obligatoires** pour les Travailleurs Non Salariés (TNS) en France. Bob s’appuie sur cette fiche pour identifier la **caisse obligatoire** selon l’activité de l’assuré et indiquer les **droits existants** (régime général ou SSI + caisse obligatoire) avant de conseiller la prévoyance complémentaire.

**Référence CNAVPL :** [cnavpl.fr](https://www.cnavpl.fr/) — La CNAVPL (Caisse nationale d’assurance vieillesse des professions libérales) fédère **10 sections professionnelles**. Les **avocats** dépendent de la **CNBF**, hors CNAVPL.

---

## 1. TNS non libéraux : SSI (Sécurité sociale des indépendants)

La **SSI** (Sécurité sociale des indépendants) a remplacé le **RSI** (Régime social des indépendants) au 1er janvier 2018. Elle couvre les **artisans**, **commerçants** et **assimilés** (ex. gérants majoritaires SARL sous conditions). Les **professions libérales** dépendent des caisses CNAVPL (CARMF, CARPIMKO, CIPAV, etc.), pas de la SSI.

**Site officiel :** [secu-independants.fr](https://www.secu-independants.fr/)  
**Pilotage :** Le **CPSTI** (Conseil de la Protection Sociale des Travailleurs Indépendants) pilote le régime complémentaire vieillesse obligatoire et le régime invalidité-décès. Recouvrement des cotisations : **URSSAF**.

### Qui relève de la SSI ?

| Statut | Organisme | Remarque |
|--------|-----------|----------|
| **Artisans** | SSI | Retraite base + complémentaire, maladie, IJ, invalidité, décès. |
| **Commerçants** | SSI | Idem. |
| **Auto-entrepreneurs** (artisans/commerçants) | SSI | Idem (BNC → caisses libérales). |
| **Assimilés** (gérants majoritaires SARL, etc.) | SSI | Sous conditions. |

**Prestations détaillées** (IJ, invalidité, décès, exemples chiffrés, synthèse conseiller) : voir **ro/ssi.md**. Chiffres réglementaires (PASS, IJ max) : `lib/assistant/regulatory-figures.ts` ; détails sur [secu-independants.fr](https://www.secu-independants.fr/).

---

## 2. Professions libérales : les 10 caisses de la CNAVPL

Chaque caisse gère **retraite de base**, **retraite complémentaire**, **invalidité-décès** et **IJ** (indemnités journalières) selon des règles et franchises propres. Les **franchises IJ** sont souvent longues ; le **capital décès** obligatoire est souvent insuffisant → prévoyance complémentaire (Loi Madelin) recommandée.

| Sigle | Nom | Professions concernées |
|-------|-----|------------------------|
| **CARMF** | Caisse autonome de retraite des médecins de France | Médecins libéraux |
| **CARPIMKO** | Caisse autonome de retraite et de prévoyance des infirmiers, masseurs-kinésithérapeutes, pédicures-podologues, orthophonistes, orthoptistes | Infirmiers libéraux, masseurs-kinésithérapeutes, pédicures-podologues, orthophonistes, orthoptistes |
| **CARCDSF** | Caisse autonome de retraite des chirurgiens-dentistes et sages-femmes | Chirurgiens-dentistes, sages-femmes |
| **CAVP** | Caisse d’assurance vieillesse des pharmaciens | Pharmaciens (officine, industrie sous conditions) |
| **CARPV** | Caisse autonome de retraite et de prévoyance des vétérinaires | Vétérinaires |
| **CIPAV** | Caisse interprofessionnelle de prévoyance et d’assurance vieillesse | Nombreuses professions libérales : architectes, géomètres-experts, ingénieurs-conseils, experts (divers), psychologues, psychothérapeutes, ostéopathes, diététiciens, ergothérapeutes, consultants, formateurs, traducteurs, etc. Liste détaillée : [cipav.info](https://www.cipav.info/). |
| **CAVEC** | Caisse d’assurance vieillesse des experts-comptables | Experts-comptables, commissaires aux comptes |
| **CAVOM** | Caisse d’assurance vieillesse des officiers ministériels | Huissiers de justice, notaires (gestion partagée), commissaires-priseurs, etc. |
| **CPRN** | Caisse de prévoyance et de retraite des notaires | Notaires |
| **CAVAMAC** | Caisse d’allocation vieillesse des agents généraux d’assurance | Agents généraux d’assurance, mandataires d’assurance |

---

## 3. Avocats : CNBF (hors CNAVPL)

| Sigle | Nom | Professions concernées |
|-------|-----|------------------------|
| **CNBF** | Caisse nationale des barreaux français | Avocats (régime spécifique, ne relève pas de la CNAVPL) |

---

## 4. Synthèse par profession (repère rapide)

| Profession | Caisse obligatoire |
|------------|--------------------|
| Médecin libéral | CARMF |
| Infirmier libéral | CARPIMKO |
| Masseur-kinésithérapeute | CARPIMKO |
| Orthophoniste, orthoptiste, pédicure-podologue | CARPIMKO |
| Chirurgien-dentiste | CARCDSF |
| Sage-femme | CARCDSF |
| Pharmacien | CAVP |
| Vétérinaire | CARPV |
| Architecte, géomètre-expert, ingénieur-conseil | CIPAV |
| Psychologue, psychothérapeute, ostéopathe | CIPAV |
| Expert-comptable, commissaire aux comptes | CAVEC |
| Notaire | CPRN |
| Huissier, commissaire-priseur | CAVOM |
| Agent général d’assurance | CAVAMAC |
| Avocat | CNBF |
| Artisan, commerçant | SSI |

---

## 5. Utilisation par Bob (parcours bilan TNS)

- **Étape 4 (Activité)** : dès que l’utilisateur indique la profession, Bob **identifie la caisse obligatoire** (Carpimko, CARMF, CIPAV, etc.) à l’aide de ce tableau.
- **Étape 7 (Droits existants)** : Bob indique les droits **régime général ou SSI** (selon statut) **+ caisse obligatoire** (prestations de base : IJ, invalidité, capital décès), puis conseille la prévoyance complémentaire.
- **Ne pas inventer** : si la profession est ambiguë ou rare, Bob peut demander une précision ou indiquer « caisse des professions libérales selon activité » et s’appuyer sur la fiche pour les cas courants.

---

## 6. Synthèse comparative RO (garanties vs manques)

Pour un **tableau comparatif final** par famille de TNS (Artisan/Commerçant SSI, Professions médicales CARMF/CARCDSF/CARPIMKO, Juridiques/Techniques CNBF/CAVEC/CIPAV) et les **manques critiques** du RO (frais fixes, maintien du niveau de vie, invalidité professionnelle), voir : **`synthese-comparative-ro-tns.md`**.

---

## 7. Références

- **CNAVPL :** [cnavpl.fr](https://www.cnavpl.fr/)
- **CIPAV (liste des activités) :** [cipav.info](https://www.cipav.info/)
- **SSI (site officiel, prestations, CPSTI) :** [secu-independants.fr](https://www.secu-independants.fr/)
- **Synthèse comparative RO TNS :** `synthese-comparative-ro-tns.md` (trois familles, garanties vs manques).
- **Fiche parcours** : `parcours-bilan-tns.md`
- **CCN et salariés** : `regimes-obligatoires-ccn.md` (conventions collectives, 1,50 % TA cadres, etc.)
