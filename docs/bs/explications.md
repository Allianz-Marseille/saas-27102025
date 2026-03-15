# Bilan Social — Explications

## Table des Matières

1. [Contexte](#contexte)
2. [Calendrier de l'agence](#calendrier-de-lagence)
3. [Événements impactant les salaires](#événements-impactant-les-salaires)
4. [Règles Congés Payés (CP)](#règles-congés-payés-cp)
5. [Règles Maladie](#règles-maladie)
6. [Jours travaillés vs jours chômés](#jours-travaillés-vs-jours-chômés)
7. [Règles Tickets Restaurants](#règles-tickets-restaurants)
8. [Commissions](#commissions)
9. [Exemple — Janvier 2026](#exemple--janvier-2026)

---

## Contexte

Chaque mois, les éléments variables sont communiqués à l'expert-comptable pour **moduler les salaires**.

> Les salaires de **février** sont versés en tenant compte des éléments connus en **janvier**.

---

## Calendrier de l'agence

Le calendrier Google de l'agence est la source de référence :

[Ouvrir le calendrier Allianz Nogaro](https://calendar.google.com/calendar/u/0?cid=YWxsaWFuei1ub2dhcm8uZnJfMmJ1ZWE5M2h2NDdrMGJkaGluZTRlYWFzNWNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ)

Tous les événements de l'agence y figurent, mais **seuls ceux contenant `cp` ou `malade` dans leur titre impactent les salaires**.

---

## Événements impactant les salaires

| Mot-clé dans l'événement | Impact |
|---|---|
| `cp` | Congé payé — décompte compteur CP + règle ticket restaurant |
| `malade` | Maladie — impact direct sur le salaire |
| `école` (alternant) | Pas un CP, mais **pas de ticket restaurant** |

---

## Règles Congés Payés (CP)

- **Journée complète de CP** → décompte d'1 jour sur le compteur CP du salarié
- L'expert-comptable doit être informé du nombre de jours CP par salarié
- Une journée de CP = **pas de ticket restaurant** ce jour-là
- Une **demi-journée de CP** → pas d'impact sur les tickets restaurants

---

## Règles Maladie

- Impact direct sur le salaire (carence, indemnité selon la situation)
- L'expert-comptable calcule en fonction des informations communiquées

---

## Jours travaillés vs jours chômés

**Seuls les jours déclarés pour chaque salarié sont des jours travaillés.**

La référence est la fiche salarié dans [Gestion des salariés](https://notre-saas-agence.com/admin/bs) (menu "Gestion salarié"). Un événement calendrier tombant un jour **non déclaré** pour ce salarié n'a aucun impact (le salarié ne travaille pas ce jour-là).

> Exemple : si Karen travaille M/J/V et qu'un CP est posé un lundi, ce CP est ignoré — Karen ne travaille pas le lundi.

---

## Règles Tickets Restaurants

Le nombre de tickets est calculé **uniquement sur les jours déclarés** du salarié.

| Situation | Ticket restaurant |
|---|---|
| Jour déclaré travaillé, présent | ✅ 1 ticket |
| Jour non déclaré (chômé pour ce salarié) | — Non comptabilisé |
| Journée complète de CP (jour déclaré) | ❌ Pas de ticket |
| Demi-journée de CP ou maladie | ✅ Ticket maintenu |
| Journée maladie complète (jour déclaré) | ❌ Pas de ticket |
| Alternant — journée école (jour déclaré) | ❌ Pas de ticket |

Le nombre maximum de tickets par semaine = **nombre de jours déclarés** si aucun CP ni maladie :

- Nejma (L, M, Me, J, V — 5 j/sem) → 5 tickets max/semaine
- Karen (M, J, V — 3 j/sem) → 3 tickets max/semaine

---

## Commissions

### Qui est concerné ?

| Pôle | Commissions |
|---|---|
| Commercial | ✅ Oui |
| Santé Individuelle | ✅ Oui |
| Santé Collective | ✅ Oui |
| Sinistre | ❌ Non |

### Commissions réelles vs potentielles

> ⚠️ **Seules les commissions réelles sont déclarées à l'expert-comptable.** Ne pas confondre avec les commissions potentielles.

- **Commissions potentielles** : estimées sur la base des actes en cours — ne pas transmettre
- **Commissions réelles** : validées et constatées pour le mois concerné — à déclarer

### Où les trouver ?

Les commissions réelles du mois sont disponibles dans le SaaS :
- Aller dans la section **Commissions** correspondant au pôle du salarié
- Vérifier le mois concerné (ex : pour les salaires de février → commissions réelles de **janvier**)
- Relever le montant réel pour chaque salarié concerné

---

## Exemple — Janvier 2026

### Événements journée complète

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
| 26 janvier | Nejma | CP | |
| 27 janvier | Joëlle | CP | |
| 30 janvier | Astrid | CP | |

### Événement demi-journée

| Date | Salarié | Type | Impact TR |
|---|---|---|---|
| 21 janvier, 9h–12h30 | Karen | CP (demi-journée) | ✅ Ticket maintenu |
