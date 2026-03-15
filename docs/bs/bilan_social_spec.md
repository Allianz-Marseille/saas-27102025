# Bilan Social — Spécification fonctionnelle

## Table des Matières

1. [Contexte](#contexte)
2. [Principe général](#principe-général)
3. [Salariés et jours déclarés](#salariés-et-jours-déclarés)
4. [Calendrier Google — source des événements](#calendrier-google--source-des-événements)
5. [Événements impactant les salaires](#événements-impactant-les-salaires)
6. [Règles Congés Payés (CP)](#règles-congés-payés-cp)
7. [Règles Maladie](#règles-maladie)
8. [Règles Tickets Restaurants](#règles-tickets-restaurants)
9. [Lignes du tableau récapitulatif](#lignes-du-tableau-récapitulatif)
10. [Engagements multi-mois](#engagements-multi-mois)
11. [Tableau récapitulatif — format expert-comptable](#tableau-récapitulatif--format-expert-comptable)
12. [Exemple — Janvier 2026](#exemple--janvier-2026)

---

## Contexte

Chaque mois, les éléments variables sont communiqués à l'expert-comptable pour **moduler les salaires**.

> Les salaires de **février** sont versés en tenant compte des éléments connus en **janvier**.
> → Le bilan social de **février** est alimenté avec les événements du mois de **janvier**.

---

## Principe général

La fonctionnalité lit automatiquement le calendrier Google de l'agence pour le mois concerné, applique les règles métier (CP, maladie, tickets restaurants), puis génère un **tableau récapitulatif prêt à copier** pour l'expert-comptable.

---

## Salariés et jours déclarés

Chaque salarié a des **jours de travail déclarés** dans la fiche salarié (section "Gestion salarié" du SaaS).

**Règle fondamentale :** un événement calendrier tombant un jour **non déclaré** pour ce salarié est **ignoré** — le salarié ne travaille pas ce jour-là.

Exemples de configurations :
- Nejma : L, M, Me, J, V (5 j/sem)
- Karen : M, J, V (3 j/sem)

---

## Calendrier Google — source des événements

Le calendrier Google de l'agence est la **source de référence automatique**.

**URL du calendrier :**
`https://calendar.google.com/calendar/u/0?cid=YWxsaWFuei1ub2dhcm8uZnJfMmJ1ZWE5M2h2NDdrMGJkaGluZTRlYWFzNWNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ`

**Lecture automatique via API Google Calendar** : la fonctionnalité interroge ce calendrier pour le mois à traiter et filtre les événements pertinents.

**Seuls les événements contenant les mots-clés suivants dans leur titre impactent les salaires :**

| Mot-clé dans l'événement | Impact |
|---|---|
| `cp` | Congé payé |
| `malade` | Maladie |
| `école` | Journée école alternant — pas de ticket restaurant |

Tous les autres événements sont ignorés pour le calcul du bilan social.

---

## Événements impactant les salaires

| Mot-clé | Type | Impact CP | Impact TR | Impact salaire |
|---|---|---|---|---|
| `cp` (journée complète) | Congé payé | −1 jour compteur CP | ❌ Pas de TR | Via expert-comptable |
| `cp` (demi-journée) | Congé payé demi-j | −0,5 jour compteur CP | ✅ TR maintenu | Via expert-comptable |
| `malade` (journée complète) | Maladie | — | ❌ Pas de TR | Via expert-comptable |
| `malade` (demi-journée) | Maladie demi-j | — | ✅ TR maintenu | Via expert-comptable |
| `école` | École alternant | — | ❌ Pas de TR | — |

---

## Règles Congés Payés (CP)

- **Journée complète de CP** → décompte d'**1 jour** sur le compteur CP du salarié
- **Demi-journée de CP** → décompte de **0,5 jour**
- L'expert-comptable doit recevoir le **nombre total de jours CP par salarié** pour le mois
- Les CP sont **présentés par semaine** dans le tableau récapitulatif
- Un CP sur un jour **non déclaré** pour le salarié = **ignoré**

---

## Règles Maladie

- Impact direct sur le salaire (carence, indemnité selon la situation)
- L'expert-comptable calcule en fonction des informations communiquées
- Les jours de maladie sont **présentés par semaine** dans le tableau récapitulatif
- Une maladie sur un jour **non déclaré** = **ignorée**

---

## Règles Tickets Restaurants

Le nombre de tickets est calculé **uniquement sur les jours déclarés** du salarié.

| Situation | Ticket restaurant |
|---|---|
| Jour déclaré travaillé, présent | ✅ 1 ticket |
| Jour non déclaré (chômé pour ce salarié) | — Non comptabilisé |
| Journée complète de CP (jour déclaré) | ❌ Pas de ticket |
| Demi-journée de CP | ✅ Ticket maintenu |
| Journée maladie complète (jour déclaré) | ❌ Pas de ticket |
| Demi-journée de maladie | ✅ Ticket maintenu |
| Journée école alternant (jour déclaré) | ❌ Pas de ticket |

**Maximum de tickets par semaine = nombre de jours déclarés** (si aucun CP, maladie, école) :
- Nejma (L, M, Me, J, V — 5 j/sem) → 5 tickets max/semaine
- Karen (M, J, V — 3 j/sem) → 3 tickets max/semaine

Les tickets sont **présentés par semaine** dans le tableau récapitulatif.

---

## Lignes du tableau récapitulatif

### 1. Commissions
- **Rôles concernés :** Commercial, Santé Individuelle, Santé Collective — **pas Sinistre**
- **Source :** commissions **réelles** du mois, récupérées automatiquement depuis la section Commissions du SaaS
- ⚠️ Ne jamais confondre avec les commissions potentielles — seules les réelles sont déclarées
- **Décalage :** pour les salaires de février → commissions réelles de janvier

### 2. Garantie de variable
- **Rôles concernés :** tout salarié ayant un engagement actif (tous rôles)
- **Nature :** élément exceptionnel, lié à une embauche ou une situation particulière
- **Source :** engagement multi-mois saisi dans le SaaS (voir section [Engagements multi-mois](#engagements-multi-mois))
- **Logique mensuelle :**
  ```
  versement = max(commissions_réelles, garantie_mensuelle)
  ```
  - Commissions réelles 250 € / garantie 300 € → on verse **300 €**
  - Commissions réelles 420 € / garantie 300 € → on verse **420 €** (les commissions réelles)
- **Période fixe :** la période calendaire est définie à la création (ex : janvier → juin). Elle s'écoule mois par mois quoi qu'il arrive — même si un mois on a versé les commissions réelles, le compteur continue
- **Fin de période :** en juillet (mois suivant la fin de garantie), plus de garantie — on verse uniquement les commissions réelles
- **Pas de régularisation** en fin de période — les montants versés sont définitivement acquis

### 3. Boost Google
- **Rôles concernés :** tous les rôles, y compris Sinistre
- **Source :** récupéré **automatiquement** depuis le SaaS (calcul déjà présent)
- **Décalage :** prime Google du mois précédent (ex : pour les salaires de février → prime Google de janvier)

### 4. Prime formation
- **Nature :** versement supplémentaire mensuel au **CDC formateur** pendant la durée de formation d'un autre salarié (compensation de l'effort de formation)
- **Source :** engagement multi-mois saisi dans le SaaS (voir section [Engagements multi-mois](#engagements-multi-mois))
- **Logique :** montant fixe mensuel versé automatiquement sur la période définie

### 5. Prime Macron
- **Nature :** ponctuelle — saisie manuellement pour le mois concerné
- **Rôles concernés :** selon décision

### 6. Prime Noël
- **Nature :** ponctuelle — saisie manuellement pour le mois concerné

### 7. Avance
- **Nature :** ponctuelle — saisie manuellement pour le mois concerné

### 8. Avance sur frais
- **Nature :** ponctuelle — saisie manuellement pour le mois concerné

### 9. Heures supplémentaires
- **Nature :** ponctuelle — nombre d'heures saisi manuellement pour le mois concerné

### 10. Frais
- **Nature :** ponctuelle — montant saisi manuellement pour le mois concerné

### 11. Régul
- **Nature :** champ texte libre par salarié — permet de transmettre toute instruction de régularisation complexe à l'expert-comptable (ex : régularisation TR, solde de compte, correction d'un mois précédent)

### 12. CP / Maladie / Absence
- Calculé automatiquement depuis le calendrier Google
- Présenté par semaine

### 13. Tickets Restaurants
- Calculé automatiquement selon les règles ci-dessus
- Présenté par semaine

---

## Engagements multi-mois

Certains éléments sont saisis **une seule fois** dans le SaaS avec une date de début et une durée, et **s'appliquent automatiquement** sur chaque bilan social mensuel concerné.

### Types d'engagements

| Type | Bénéficiaire | Logique | Déclencheur |
|---|---|---|---|
| Garantie de variable | Salarié concerné | `max(commissions réelles, garantie)` | Embauche ou situation exceptionnelle |
| Prime formation | CDC formateur | Montant fixe mensuel | Formation d'un autre salarié |

### Paramètres à saisir

| Champ | Description |
|---|---|
| Type | Garantie de variable / Prime formation |
| Salarié | Le salarié bénéficiaire |
| Montant mensuel | Ex : 300 € |
| Date de début | Ex : 01/01/2026 |
| Nombre de mois | Ex : 6 → fin automatique le 30/06/2026 |

### Vue de gestion des engagements actifs

Le SaaS propose une **vue dédiée** listant tous les engagements en cours et à venir :

| Salarié | Type | Montant/mois | Début | Fin | Mois restants | Statut |
|---|---|---|---|---|---|---|
| Audrey | Garantie variable | 300 € | 01/10/2025 | 31/03/2026 | 1 | 🟡 En cours |
| Matthieu | Garantie variable | 300 € | 01/10/2025 | 31/07/2026 | 5 | 🟡 En cours |
| Christelle | Garantie variable | 300 € | 01/10/2025 | 31/07/2026 | 5 | 🟡 En cours |

Depuis cette vue, on peut :
- **Créer** un nouvel engagement (type, salarié, montant, période)
- **Modifier** un engagement existant (date de fin, montant)
- **Clôturer** manuellement un engagement avant son terme

---

## Tableau récapitulatif — format expert-comptable

Le tableau est généré automatiquement et **prêt à copier** pour l'expert-comptable.

### Structure

```
┌─────────────────────────┬──────────┬──────────┬──────────┬─ … ─┐
│                         │ Salarié1 │ Salarié2 │ Salarié3 │     │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ Commissions             │          │          │          │     │
│ Garantie de variable    │          │          │          │     │
│ Boost Google            │          │          │          │     │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ OCCASIONNELS (si renseignés)                                    │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ Prime formation         │          │          │          │     │
│ Prime Macron            │          │          │          │     │
│ Prime Noël              │          │          │          │     │
│ Avance                  │          │          │          │     │
│ Avance sur frais        │          │          │          │     │
│ Heures sup              │          │          │          │     │
│ Frais                   │          │          │          │     │
│ Régul                   │          │          │          │     │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ CP / MALADIE / ABSENCE                                          │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ Semaine 1               │          │          │          │     │
│ Semaine 2               │          │          │          │     │
│ Semaine 3               │          │          │          │     │
│ Semaine 4               │          │          │          │     │
│ Semaine 5 (si applicable)│         │          │          │     │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ TICKETS RESTAURANTS                                             │
├─────────────────────────┼──────────┼──────────┼──────────┼─────┤
│ Semaine 1               │          │          │          │     │
│ Semaine 2               │          │          │          │     │
│ Semaine 3               │          │          │          │     │
│ Semaine 4               │          │          │          │     │
│ Semaine 5 (si applicable)│         │          │          │     │
└─────────────────────────┴──────────┴──────────┴──────────┴─────┘
```

### Format des cellules CP / Absence

- `2/1 cp` → CP le 2 janvier
- `16->25/1 cp` → CP du 16 au 25 janvier
- `8/1 cp (demi-journée)` → demi-CP
- `ECOLE` → journée école alternant

### Notes

- Salariés **hors effectif** au moment de la génération → signalés ⚠️ mais inclus si événements les concernent sur le mois
- Les lignes occasionnelles **n'apparaissent que si renseignées** pour au moins un salarié

---

## Exemple — Janvier 2026

### Événements calendrier

| Date | Salarié | Type | Note |
|---|---|---|---|
| 2 janvier | Corentin | CP | |
| 2 janvier | Astrid | CP | ⚠️ Plus dans l'effectif au 15/03/2026 |
| 2 janvier | Kheira | CP | |
| 5 → 9 janvier | Emma | École | Alternante — pas de TR ces jours |
| 5 janvier | Virginie | CP | |
| 16 → 25 janvier | Astrid | CP | |
| 16 janvier | Kheira | CP | |
| 21 janvier | Virginie | CP | |
| 21 janvier 9h–12h30 | Karen | CP demi-journée | ✅ TR maintenu |
| 26 janvier | Nejma | CP | |
| 27 janvier | Joëlle | CP | |
| 30 janvier | Astrid | CP | |

### Données récupérées / saisies

| Salarié | Commissions | Garantie variable | Boost Google | Frais | Heures sup |
|---|---|---|---|---|---|
| Karen | 340 € | — | — | 21 € | — |
| Kheira | 1 866 € | — | — | — | — |
| Emma | — | — | 15 € | — | — |
| Joëlle | 500 € | — | 20 € | — | — |
| Corentin | 1 260 € | — | — | — | — |
| Donia | 430 € | — | — | — | — |
| Audrey | 900 € | 300 € (garantie — commissions > garantie ce mois) | — | — | — |
| Christelle | — | 300 € | — | — | — |
| Matthieu | — | 300 € | — | — | 9 h |
