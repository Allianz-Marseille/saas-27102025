# Régime général — CPAM / CNAM (expertise Bob)

**Public concerné :** Salariés du secteur privé, fonctionnaires (règles spécifiques), régimes alignés. Gestion : CPAM (CNAM), URSSAF (recouvrement).

La **Sécurité Sociale est le « premier étage »** de la protection, mais elle est **structurellement incomplète**. Bob doit maîtriser les garanties du régime général pour auditer les salariés (bulletin de paie, mutuelle d’entreprise, prévoyance collective) et calculer le gap.

---

## Concepts clés (santé)

| Concept | Définition |
|--------|------------|
| **BRSS** (Base de Remboursement de la Sécurité Sociale) | Tarif de référence sur lequel la Sécu applique son pourcentage de remboursement. |
| **Ticket modérateur** | Différence entre la BRSS et le remboursement effectif de la Sécu ; reste à la charge de l’assuré (ou de sa mutuelle). |
| **PASS** (Plafond Annuel de la Sécurité Sociale) | Unité de mesure pour cotisations et plafonds de prestations (invalidité, décès, IJ). Source : `lib/assistant/regulatory-figures.ts`. |

---

## 1. Maladie

| Élément | Règle |
|--------|--------|
| **Soins** | Taux de remboursement (ex. 70 % pour le généraliste, 80 % pour spécialiste), ticket modérateur, forfait 1 €, franchises. |
| **Indemnités journalières (IJ)** | Après **3 jours** de carence (ou délai conventionnel / maintien de salaire par l’employeur). **50 % du gain journalier** de base, dans la limite de **50 % du PASS/730**. Durée : **3 ans** maximum (360 jours). |
| **ALD** | Affection longue durée : exonération ticket modérateur pour les soins en rapport avec l’ALD. |
| **Cure thermale** | Prise en charge sous conditions. |

---

## 2. Maternité / Paternité

IJ maternité et paternité, congés, délais et plafonds selon durée d’affiliation et activité.

---

## 3. Invalidité

Pensions d’invalidité (maladie ou accident non professionnel) :

| Catégorie | Condition | Taux / montant |
|-----------|-----------|----------------|
| **1ère catégorie** | Capacité de travail réduite d’au moins 2/3 | Pension ~30 % du salaire annuel moyen (plafonnée). |
| **2ème catégorie** | Incapacité à exercer toute activité | Pension ~50 % du salaire annuel moyen (plafonnée). |
| **3ème catégorie** | Incapacité + besoin d’assistance | Pension ~50 % + majoration pour tierce personne. |

Conditions d’affiliation et d’âge ; cumul avec activité possible sous conditions.

---

## 4. Décès

- **Capital décès** : forfait versé aux ayants droit (conditions, montant plafonné).
- **Rente de réversion / veuvage** : part de la pension de retraite du défunt (conditions d’âge, de ressources).
- **Rente d’orphelin** : selon situation.

---

## 5. Retraite

Âge légal, âge du taux plein, décote/surcote, calcul de la pension (répartition), liquidation. Impact sur la fin des droits prévoyance (seniors).

---

## 6. Accidents du travail / Maladies professionnelles (AT/MP)

- Prise en charge **intégrale** des soins (sans ticket modérateur).
- IJ spécifiques (sans carence dans certains cas).
- Rente ou capital en cas d’**incapacité permanente** (IPP).
- **Faute inexcusable** de l’employeur : majorations.

---

## 7. Famille

Allocations familiales, PAJE et autres prestations selon situation (revenus, nombre d’enfants).

---

## Synthèse pour l’audit salarié

- **IJ** : carence 3 jours (souvent couverte par maintien de salaire ou convention), plafond 50 % PASS/730.
- **Invalidité** : 3 catégories ; pensions plafonnées → prévoyance collective ou individuelle pour compléter.
- **Décès** : capital décès forfait, réversion → prévoyance collective (1,50 % TA cadres, capital décès, rente conjoint).

Retour au [sommaire](bob-expert.md).
