# Règles rémunération — Commercial

Documentation des règles de rémunération applicables au rôle commercial (CDC_COMMERCIAL).

## Personnes concernées

- Emma
- Matthieu
- Donia
- _(autres commerciaux selon effectif)_

## Objectifs

_(À compléter : objectifs chiffrés, axes prioritaires.)_

## Règles de commission

- **Source** : actes (collection `acts`), par mois et par commercial.
- **Commission par acte** : uniquement pour les AN (Apport Nouveau) ; montant selon le type de contrat (AUTO_MOTO 10 €, IRD_PART 20 €, IRD_PRO tranches, PJ 30 €, GAV 40 €, etc.). Les actes process (M+3, PRETERME_AUTO, PRETERME_IRD) n’apportent pas de commission.
- **Validation** : les **commissions réelles** sont égales aux commissions potentielles du mois **si et seulement si** : commissions potentielles ≥ 200 € **et** au moins 15 process **et** ratio (autres/auto) ≥ 100 %. Sinon, commissions réelles = 0 pour le mois.

Détail technique et grilles : [Génération des commissions par rôle](../commissions-par-role.md#1-rôle-commercial-cdc_commercial).

## Règles spécifiques

_(À compléter : règles métier, conditions, exceptions.)_

## Références

- [Grille de pilotage](../grille.md)
- [TODO implémentation](../TODO.md)
