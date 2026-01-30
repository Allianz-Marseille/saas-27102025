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

### Prestations obligatoires SSI (repères)

**Indemnités journalières (IJ) — arrêt de travail**

- **Calcul :** 1/730e du **revenu annuel moyen (RAAM)** des 3 dernières années, plafonné au **PASS** (Plafond annuel de la Sécurité sociale). Les montants exacts (PASS, IJ max) sont dans `lib/assistant/regulatory-figures.ts` et mis à jour annuellement.
- **Délai de carence :** 3 jours calendaires avant le premier versement d’IJ.
- **Franchise possible :** 7, 14 ou 30 jours selon les options (contrat complémentaire pour réduire la franchise).
- **Seuil minimal :** en dessous d’un certain RAAM (ordre de grandeur : ~4 500 €), les IJ peuvent être nulles.
- **En pratique :** les IJ SSI restent souvent **inférieures au revenu réel** de l’indépendant → prévoyance complémentaire recommandée pour compléter ou anticiper.

**Invalidité**

- **Pension d’invalidité** : environ **30 % du revenu moyen** en invalidité partielle, **50 %** en invalidité totale (ordre de grandeur ; conditions et taux à vérifier sur secu-independants.fr).
- **Condition** : réduction de la capacité de travail d’au moins 2/3 (66 %) ; maladie ou accident non professionnel ; affiliation depuis au moins 12 mois.
- **En pratique :** niveau souvent insuffisant pour maintenir le train de vie → prévoyance complémentaire (rente invalidité) recommandée.

**Décès**

- **Capital décès** (cotisant) : de l’ordre de **20 % du PASS** (montant exact dans regulatory-figures ou sur le site officiel).
- **Capital décès** (retraité) : de l’ordre de **8 % du PASS**.
- **Bonus par enfant à charge** : montant complémentaire par enfant (moins de 16 ans, ou jusqu’à 20 ans si études). Bénéficiaires sous condition de ressources ; demande dans le mois suivant le décès.
- **Pension de réversion** : conjoint survivant **54 % de la pension de retraite de base** du défunt, sous condition d’âge (ex. 55 ans).
- **En pratique :** capital décès obligatoire **souvent insuffisant** pour protéger le foyer (dettes, train de vie) → prévoyance complémentaire (capital décès, rente conjoint, rente éducation) recommandée.

### Synthèse pour le conseiller

| Prestation | SSI (obligatoire) | À compléter par |
|------------|-------------------|-----------------|
| **IJ** | 1/730e RAAM (3 ans), plafonné PASS ; délai carence 3 j ; franchise possible 7/14/30 j | Prévoyance complémentaire (Loi Madelin) : compléter le montant, réduire la franchise. |
| **Invalidité** | Pension partielle (~30 %) / totale (~50 %) | Rente invalidité complémentaire. |
| **Décès** | Capital ~20 % PASS (cotisant), réversion conjoint 54 % | Capital décès, rente conjoint, rente éducation (Loi Madelin). |

**Référence chiffres annuels :** PASS et montants dérivés dans `lib/assistant/regulatory-figures.ts` ; détails prestations sur [secu-independants.fr](https://www.secu-independants.fr/).

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

## 6. Références

- **CNAVPL :** [cnavpl.fr](https://www.cnavpl.fr/)
- **CIPAV (liste des activités) :** [cipav.info](https://www.cipav.info/)
- **SSI (site officiel, prestations, CPSTI) :** [secu-independants.fr](https://www.secu-independants.fr/)
- **Fiche parcours** : `parcours-bilan-tns.md`
- **CCN et salariés** : `regimes-obligatoires-ccn.md` (conventions collectives, 1,50 % TA cadres, etc.)
