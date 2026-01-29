# Attentes précises — Base de connaissances Bob (optimale)

Ce document détaille **thème par thème** ce que chaque fiche doit contenir pour que Bob réponde de façon optimale. Les fiches sont chargées par `loadBobKnowledge()` depuis `docs/knowledge/bob/` (limite ~28k caractères au total). **Privilégier des contenus synthétiques** : listes, tableaux, formules, pas de copier-coller de décrets entiers.

Référence : [bob_sante.md](./bob_sante.md) (Architecture base de connaissances, guides IJ/DUE/Fiscalité/CCN).

---

## Ce qui est fait — Feuille de route en 3 vagues

Exécution découpée en **3 vagues logiques** pour tester Bob au fur et à mesure. Chaque fiche est une **structure de données** précise pour limiter les hallucinations et rester dans la fenêtre de contexte (28k caractères).

### Vague 1 — Le « Cerveau » technique (priorité haute)

*Objectif : Rendre Bob capable d’analyser une liasse fiscale et de calculer une IJ sans erreur.*

| Fiche | Statut | Fichier |
|-------|--------|---------|
| Mapping liasses / statuts fiscaux | **Fait** | `docs/knowledge/bob/fiscal-liasses-correspondances.md` |
| Grille de lecture 2035 / IJ / Frais généraux | **Fait** | `docs/knowledge/bob/2035-bilan-tns.md` |
| Ingénierie Madelin (réintégrations, PASS) | **Fait** | `docs/knowledge/bob/prevoyance-tns-regles-ij.md` |

### Vague 2 — La conformité & le collectif

*Objectif : Rendre Bob capable de rédiger une DUE et de conseiller une entreprise sur le PERO.*

| Fiche | Statut | Fichier |
|-------|--------|---------|
| Canevas DUE et procédure URSSAF | **Fait** | `docs/knowledge/bob/due-contrat-groupe.md` |
| Guide PERO C1/C2/C3 | **Fait** | `docs/knowledge/bob/retraite-collective-pero.md` |
| Socle RO et 1,50 % cadre | **Fait** | `docs/knowledge/bob/regimes-obligatoires-ccn.md` |

### Vague 3 — La posture de conseil & le sourçage

*Objectif : Donner à Bob sa voix commerciale et sa rigueur réglementaire.*

| Fiche | Statut | Fichier |
|-------|--------|---------|
| Questionnement matrimonial et patrimonial | **Fait** | `docs/knowledge/bob/audit-diagnostic-conseiller.md` |
| Tableau 360° (imposition des prestations) | **Fait** | `docs/knowledge/bob/fiscalite-entree-sortie-prevoyance.md` |
| Vocabulaire et citations | **Fait** | `docs/knowledge/bob/glossaire.md`, `references.md` |

*Fiches d'enrichissement (complétées) :* `reglementaire-due-standard.md`, `ccn-top10-obligations.md`, `sante-panier-soins-minimal.md`, `commercial-objections-reponses.md`, `faq.md` — **Fait.**

---

## Règles communes à toutes les fiches

- **Format** : Markdown (titres `##`, listes, tableaux).
- **Longueur** : 1 à 3 pages max par fiche (env. 500–1500 mots) pour rester dans la limite globale.
- **Sourçage** : Indiquer les textes de référence (Loi Madelin, ANI, décret 2012, CCN, URSSAF) avec **année ou date de mise à jour** pour que Bob puisse citer la source.
- **Ton** : Factuel, exploitable par le conseiller (arguments, chiffres, procédures).

---

## 1. `fiscal-liasses-correspondances.md`

**Objectif** : Bob doit savoir **quel document et quelles cases** utiliser selon le statut fiscal du client (TNS vs IS, BNC vs BIC vs Micro).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Mapping liasses / statuts** | Tableau : Profil (Libéral EI, Commerçant EI, Société IS, Auto-entrepreneur) → Numéro(s) de formulaire (2035, 2031, 2033, 2065, attestation CA). |
| **Cases « Revenu » pour les IJ** | Pour chaque profil : nom exact de la case ou ligne (ex. 2035 : CP + BT ; 2031 : case 1 ; 2033-D : case 380 ; 2033-D rémunération dirigeant ; Micro : CA − abattement 34 % / 50 % / 71 %). |
| **TNS vs IS** | Différence claire : en IS, ne pas utiliser le bénéfice de la société ; utiliser la **rémunération du dirigeant** (2033-D). Vérifier dividendes (souvent non couverts par prévoyance standard). |
| **Références** | URSSAF, instructions fiscales (année). |

**Exemples de questions que Bob doit pouvoir traiter avec cette fiche :**  
« Quel document demander pour un libéral en BNC ? », « Où trouver l’assiette IJ sur une 2033 ? », « Un gérant de SARL : on regarde la 2065 ou la rémunération ? »

---

## 2. `2035-bilan-tns.md`

**Objectif** : Grille de lecture des liasses TNS pour **extraction des IJ et des frais généraux** (dimensionnement prévoyance).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Cheat Sheet** | Tableau : Profil → Liasse → Case « Revenu » → Case « Frais fixes » (ex. Libéral EI : 2035, CP+BT, lignes 14–21 2035-B ; Commerçant EI : 2031/2033, 1+380, lignes 218–230 2033-B ; Société IS : 2065/2033, rémunération 2033-D, charges 2033-B ; Auto-entrepreneur : attestation CA, CA − abattement, N/A). |
| **Détail 2035 (BNC)** | Revenu IJ = Bénéfice (CP) + Cotisations sociales (BT). Frais généraux = 2035-B (loyers ligne 14, charges sociales équipe 19, petits matériels 11, etc.). |
| **Détail 2031/2033 (BIC)** | Revenu = Résultat 2031 case 1 + Cotisations 2033-D case 380. Frais généraux = 2033-B charges externes (218–230). |
| **Règle « détective »** | Si **bénéfice faible** et **frais généraux élevés** → suggérer garantie « Frais Fixes » renforcée pour protéger la structure en arrêt. |
| **Références** | Instructions fiscales, année. |

**Exemples :** « Analyse cette 2035 et donne-moi l’assiette IJ », « Liste les frais généraux à couvrir à partir de cette 2033-B ».

---

## 3. `prevoyance-tns-regles-ij.md`

**Objectif** : Règles de calcul des **indemnités journalières** et **frais généraux** pour les TNS (franchises, réintégrations Madelin, plafonds).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Franchises** | Délai de carence type (ex. 30, 60, 90 jours) ; impact sur le contrat et le message au client. |
| **Réintégrations Madelin** | Pour obtenir le **revenu réel** à assurer : réintégrer les cotisations sociales (BT 2035, case 380 2033-D) dans l’assiette. Formule synthétique. |
| **Plafonds** | Rappel des plafonds Loi Madelin (santé/prévoyance, chômage) avec **PASS** et année (ex. 3,75 % revenu + 7 % PASS, limite 3 % de 8 PASS). Lien URSSAF. |
| **Frais généraux** | Définition opérationnelle : charges à continuer en cas d’arrêt (loyers, assurances, honoraires, charges équipe). Où les trouver par liasse (voir 2035-bilan-tns). |
| **Références** | Loi Madelin, URSSAF, année. |

**Exemples :** « Comment calculer l’IJ pour un TNS au réel BNC ? », « Qu’est-ce qu’on réintègre pour l’assiette Madelin ? »

---

## 4. `due-contrat-groupe.md` et `reglementaire-due-standard.md`

**Objectif** : Bob doit aider à **rédiger une DUE** (santé, prévoyance, retraite) et vérifier la **conformité** (décret 2012, ANI).

**Contenu attendu (structure commune aux deux fiches, l’une orientée « canevas », l’autre « conformité ») :**

| Section | Contenu précis |
|--------|-----------------|
| **Mentions obligatoires** | Identification entreprise (nom, SIRET, adresse) ; Objet (santé / prévoyance / retraite) ; Date d’effet ; **Bénéficiaires par catégories objectives** (pas de noms) ; Garanties (panier minimal, contrat responsable) ; **Financement 50 % employeur min** (santé) ; **Cas de dispense** (liste d’ordre public : mutuelle du conjoint, CDD &lt; 3 mois, etc.) ; **Portabilité**. |
| **Procédure de validation** | Information CSE ; Remise individuelle de la DUE contre **décharge** (liste d’émargement ou récépissé) ; Conservation des preuves pour l’URSSAF. |
| **Canevas de rédaction** | Titres type : Préambule, Collège bénéficiaire, Caractère obligatoire, Cotisations, Prestations, Durée et modification. Exemple de phrases types (à adapter par le conseiller). |
| **DUE retraite / PERO** | Rappel : DUE retraite ou accord pour PERO ; compartiments C1/C2/C3 ; collège en catégories objectives. |
| **Références** | Décret 2012, ANI, année. |

**Exemples :** « Prépare un projet de DUE pour 10 non-cadres, 60 % employeur », « Cette clause de dispense est-elle conforme ? »

---

## 5. `regimes-obligatoires-ccn.md` et `ccn-top10-obligations.md`

**Objectif** : Socles Sécu/caisses libérales + **5 points de vigilance CCN** pour ne pas sous-dimensionner ni se tromper sur les obligations.

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Socles obligatoires** | Tableau court : Régime (général, SSI/ex-RSI, libéral, agricole) → Organisme (CPAM, URSSAF/SSI, CARMF/CIPAV, MSA) → Prestations de base (IJ, invalidité, capital décès). |
| **5 points vigilance CCN** | 1) **Prévoyance cadre 1,50 % TA** (convention cadres 1947 : min 0,76 % décès). 2) **Maintien de salaire** (BTP, Syntec, HCR…) : franchise du contrat cohérente avec la durée de maintien. 3) **Clause désignation vs recommandation** (capital décès : désignation nominative pour protéger le conjoint, ex. PACS). 4) **Catégories objectives** : pas de noms dans la DUE. 5) **Secteurs à prévoyance obligatoire** (BTP, sport…) : identifier la CCN (NAF, activité) et les minima. |
| **Top 10 CCN (ou 5–6 prioritaires)** | Pour chaque CCN (ex. BTP, SYNTEC, HCR, Immobilier) : obligations prévoyance (taux, maintien de salaire, franchise type), garantie décès minimale. |
| **Références** | Conventions collectives (IDCC ou nom), année. |

**Exemples :** « Quelle CCN pour ce NAF ? », « Ce client est en CCN BTP : qu’est-ce qui est obligatoire ? », « Désignation ou recommandation pour le capital décès ? »

---

## 6. `fiscalite-entree-sortie-prevoyance.md`

**Objectif** : **Expertise Fiscale 360°** — déductibilité des cotisations (entrée) et fiscalité des prestations (sortie).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Entrée — Déductibilité** | Tableau : Statut (TNS Madelin, Salarié collectif, Entreprise) → Règle (déductible du revenu / exonérée pour le salarié / déductible de l’IS) ; plafonds Madelin (avec PASS et année). |
| **Sortie — Prestations** | Tableau : Prestation (IJ, Rente invalidité, Rente éducation, Capital décès) → Règle fiscale (imposable si cotisations déductibles ; exonération capital décès pour le bénéficiaire désigné ; rente éducation au nom des enfants). Message conseiller : « Vous avez déduit vos cotisations → les IJ seront imposables. » |
| **Récap** | Une phrase par statut : TNS Madelin = déductible entrée, IJ/rentes imposables sortie ; Capital décès exonéré pour le bénéficiaire. Salarié = part employeur exonérée ; sortie selon contrat. |
| **Références** | CGI, Loi Madelin, année. |

**Exemples :** « Un TNS qui déduit ses cotisations : les IJ sont imposables ? », « Fiscalité du capital décès pour le conjoint ? »

---

## 7. `audit-diagnostic-conseiller.md`

**Objectif** : Méthodologie **questions clés → garanties** (rente conjoint, rente éducation, capital décès) et **diagnostic matrimonial** (PACS, testament, clause bénéficiaire).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Situation civile** | Tableau : Thème (Statut matrimonial, Enfants, Conjoint, Patrimoine) → Questions clés → Impact garanties (capital décès, rente éducation, rente conjoint). |
| **Activité / risque métier** | Secteur, NAF, CCN ; risque physique ; revenus et assiette (2035/2033/bulletin) ; structure (EI, EURL, SASU…). |
| **De la situation vers les garanties** | Tableau : Besoin (protéger le conjoint, les enfants, couverture décès, remplacer le revenu en arrêt, invalidité) → Garantie type → Point de vigilance. |
| **Diagnostic PACS** | En l’absence de testament, le conjoint pacsé n’est pas héritier réservataire → **insister sur la clause de désignation** du contrat (capital décès) pour désigner nominativement le conjoint et/ou les enfants. Orienter vers notaire si besoin (testament, donation au dernier vivant). |
| **Références** | Pratique conseiller, droit des successions (rappel uniquement). |

**Exemples :** « Quelles questions poser pour dimensionner la rente conjoint ? », « Client pacsé sans testament : quel risque pour le capital décès ? »

---

## 8. `sante-panier-soins-minimal.md`

**Objectif** : **Contrat Responsable**, **100 % Santé**, panier de soins minimal (ANI).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Panier minimal (ANI)** | Contenu minimal du panier (consultations, hospitalisation, soins courants) ; respect obligatoire pour les contrats collectifs. |
| **Contrat Responsable** | Critères (tickets modérateurs, pas de dépassement sur certaines prestations, etc.) ; impact sur la fiscalité et les exonérations. |
| **100 % Santé** | Prothèses dentaires et auditives, optique ; reste à charge 0 dans le cadre du panier ; articulation avec la mutuelle. |
| **Références** | ANI, décrets, année. |

**Exemples :** « Qu’est-ce qu’un contrat responsable ? », « Le panier minimal ANI inclut quoi ? »

---

## 9. `commercial-objections-reponses.md`

**Objectif** : **Argumentation** et **aide à la vente** (objections courantes, angles par profil).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Objections fréquentes** | Liste : « Déjà couvert par mon conjoint », « Trop cher », « Je suis jeune / en bonne santé », « Je verrai plus tard », « La Sécu suffit »… Pour chaque objection : 1–3 arguments types (courts, utilisables en entretien). |
| **Angles par public** | TNS : prévoyance obligatoire, IJ et frais généraux, déductibilité Madelin. Salarié : mutuelle d’entreprise, prévoyance collective, attestation de droits. Entreprise : garanties minimales, DUE, 50 % employeur. Senior : maintien des garanties, reste à charge. |
| **Pédagogie produit** | Phrases types pour expliquer : IJ, rente invalidité, rente éducation, capital décès, frais généraux (une phrase par notion). |
| **Références** | Optionnel : fiches produit agence, ANI. |

**Exemples :** « Le client dit que c’est trop cher : quels arguments ? », « Comment présenter la rente éducation à un TNS ? »

---

## 10. `retraite-collective-pero.md`

**Objectif** : **PERO** (ex-Article 83), compartiments **C1 / C2 / C3**, fiscalité et ingénierie (collèges, DUE retraite).

**Contenu attendu :**

| Section | Contenu précis |
|--------|-----------------|
| **Compartiments** | C1 (individuel, versements volontaires) ; C2 (épargne temps, I-P) ; C3 (obligatoire, Art. 83). Sortie : capital/rente selon compartiment. |
| **Fiscalité** | Cotisations employeur déductibles de l’IS ; exonération de charges dans certaines limites ; forfait social 20 % (quand applicable). Sortie en capital ou rente à la retraite. |
| **Collèges et DUE retraite** | Catégories objectives ; pas de noms ; DUE retraite ou accord collectif pour mise en place. |
| **Références** | Code des assurances, PERO, année. |

**Exemples :** « Différence entre C1, C2 et C3 ? », « Faut-il une DUE pour un PERO ? »

---

## 11. `glossaire.md`

**Objectif** : Définitions **courtes et stables** pour que Bob utilise les bons termes et explique au conseiller.

**Contenu attendu :**

- **Termes à définir** (une à trois lignes chacun) : cotisation, assiette, TNS, Loi Madelin, ANI, CCN, IJ (indemnités journalières), rente invalidité, rente éducation, capital décès, franchise, frais généraux, DUE, contrat responsable, panier minimal, PERO, C1/C2/C3, SSI, régime général, part employeur / part salarié, portabilité, clause bénéficiaire, catégories objectives, dispense d’ordre public, PASS.
- **Pas de développement** : définition opérationnelle uniquement.

**Exemples :** « C’est quoi l’assiette Madelin ? », « Différence entre franchise et délai de carence ? »

---

## 12. `faq.md` (ou `faq-regimes.md`, `faq-sante.md`, `faq-prevoyance.md`)

**Objectif** : **Questions fréquentes** avec réponses synthétiques (2–5 lignes), sourcées.

**Contenu attendu :**

- Format : **Question** (phrase telle que le conseiller ou le client la pose) puis **Réponse** (réponse type + source si possible).
- Thèmes : régimes (TNS vs salarié, SSI vs régime général), santé (mutuelle TNS, contrat responsable, 100 % Santé), prévoyance (Madelin, IJ, capital décès, DUE, CCN), retraite (PERO, C1/C2/C3).
- 10–20 questions par fiche si séparées par thème, ou 30–50 dans un seul `faq.md`.

**Exemples de questions :** « Quelle mutuelle pour un TNS ? », « Différence prévoyance collective et individuelle ? », « Comment lire les lignes santé sur une fiche de paie ? »

---

## 13. `references.md`

**Objectif** : **Références réglementaires** avec date de mise à jour et lien « pour le détail » (pas le texte intégral).

**Contenu attendu :**

| Référence | Résumé en 1–2 lignes | Date / mise à jour | Lien ou mention |
|-----------|----------------------|---------------------|------------------|
| Loi Madelin | Prévoyance/santé TNS, déductibilité, plafonds. | Année | URSSAF, Loi n° 94-126 du 11 février 1994. |
| ANI | Mutuelle collective, 50 % employeur min, panier minimal. | Année | ANI 2013 (ou en vigueur). |
| Décret 2012 (DUE) | DUE santé/prévoyance, mentions obligatoires, dispenses. | Année | Décret relatif à la DUE. |
| CCN (ex. cadres, BTP, Syntec) | Obligations prévoyance, 1,50 % TA cadres, maintien de salaire. | Année | IDCC ou nom CCN. |
| PASS | Plafond annuel Sécurité sociale (calculs, plafonds Madelin). | Année + valeur | URSSAF, service-public. |

**Usage** : Bob cite ces références en bas de réponse (« Source : Loi Madelin, URSSAF 20XX ») et rappelle de vérifier les chiffres (PASS, plafonds) une fois par an.

---

## Ordre de priorité suggéré pour la rédaction

1. **Glossaire** + **2035-bilan-tns** + **fiscal-liasses-correspondances** → cœur technique (liasses, IJ, statuts).
2. **prevoyance-tns-regles-ij** + **fiscalite-entree-sortie-prevoyance** → TNS et fiscalité.
3. **due-contrat-groupe** + **reglementaire-due-standard** → DUE et conformité.
4. **regimes-obligatoires-ccn** + **ccn-top10-obligations** → CCN et socles.
5. **audit-diagnostic-conseiller** → méthodologie conseiller.
6. **sante-panier-soins-minimal** + **commercial-objections-reponses** + **retraite-collective-pero**.
7. **faq** + **references** → finition et sourçage.

---

## Réutilisation de l’existant

- **Règles de remboursement santé** : réutiliser ou dupliquer `docs/knowledge/sources/sante-regles-remboursement.md` si pertinent pour Bob.
- **Fiches par public** : réutiliser ou adapter `docs/knowledge/segmentation/` (TNS, salarié, entreprise) pour éviter les doublons.

Une fois ces fiches créées ou ébauchées dans `docs/knowledge/bob/`, Bob les charge automatiquement à chaque requête (dans la limite de 28k caractères). Les mettre à jour (PASS, plafonds, CCN) **au moins une fois par an** ou à chaque changement réglementaire majeur.
