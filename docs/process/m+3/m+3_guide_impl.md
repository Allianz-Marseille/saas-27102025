# M+3 — Guide d’implémentation opérationnel

Ce guide structure la nouvelle implémentation M+3 pour garantir une posture de gestionnaire-conseil avant toute démarche commerciale.

## 1) Objectif métier

Le M+3 vise trois résultats concrets, trois mois après une affaire nouvelle :

1. Consolider la relation client sur une base de service (qualité dossier).
2. Sécuriser la conformité administrative des contrats souscrits.
3. Créer un rebond commercial légitime via un bilan global des protections.

## 2) Contexte et déclencheur

### Origines des affaires nouvelles

- Chalandise
- Recommandation
- Apporteurs
- Leads

### Enjeu relationnel

En entrée de relation, le client traite souvent un besoin ponctuel (auto, habitation, etc.). Le M+3 permet d’élargir vers une vision globale, sans rompre la confiance.

## 3) Méthode impérative en 2 temps

Le workflow doit toujours suivre cet ordre :

1. **Administratif** (image de gestionnaire, rigueur, dossier propre)
2. **Rebond commercial** (bilan des manques, proposition de rendez-vous/bilan)

Interdit : démarrer directement par une logique de vente additionnelle.

## 4) Séquence canonique M+3

## 4.1 Avant la prise de contact

- Identifier les informations client manquantes.
- Vérifier le statut administratif des contrats souscrits (signature, pièces, complétude).
- Préparer les questions nécessaires avant appel.

Sortie attendue : une checklist priorisée "à valider / à compléter".

## 4.2 Prise de contact téléphonique

### Script d’ouverture

- Présentation agent.
- Rappel du contrat souscrit depuis environ 3 mois.
- Temps laissé au client pour resituer la relation.
- Clarification : contrat souscrit avec l’agent actuel ou un collègue nommé.

### Question d’autorisation

"Est-ce que vous avez 5 minutes pour moi, j’ai besoin de mettre à jour votre dossier client ?"

- Si oui : enchaîner.
- Si non : proposer et enregistrer un rendez-vous.

## 4.3 Étape administrative 1 — Mise à jour fiche client

Vérifier/mettre à jour :

- Nom, prénom, adresse d’envoi
- Téléphone, e-mail
- Situation matrimoniale
- Situation professionnelle
- Si pro/entreprise : SIREN, NAF, activité

Règle métier :

- Si client TNS détecté, même avec seulement un contrat particulier dans Lagon :
  - Mettre à jour la fiche en "client pro/TNS"
  - Positionner le bon chargé de clientèle

Effet recherché : le client comprend que l’appel sert réellement à tenir son dossier à jour.

## 4.4 Étape administrative 2 — Validation contrats

- Confirmer signature et pièces administratives.
- Reformuler ce qui a été souscrit pour valider la compréhension et la pertinence (exemple contextualisé : "tous risques en zone urbaine").
- Lister immédiatement les éléments manquants et le mode de récupération.

## 4.5 Rebond commercial

Une fois les deux étapes administratives terminées :

- Remercier pour la confiance.
- Question pivot : "Pour les contrats que vous n’avez pas chez nous, qui sont vos autres assureurs ?"
- Laisser un temps de silence pour réponse.
- Identifier les 2-3 contrats extérieurs et les manques prioritaires.
- Vérifier explicitement les protections structurantes (exemples : PJ, GAV, retraite, prévoyance).
- Proposer un bilan global des contrats externes + compléments sur les manques.

## 5) Spécification prête implémentation

## 5.1 États de workflow

- `preparation`
- `contact_attempt`
- `scheduled_callback`
- `admin_profile_update`
- `admin_contract_validation`
- `commercial_rebound`
- `action_plan`
- `closed`

## 5.2 Transitions clés

- `preparation -> contact_attempt`
- `contact_attempt -> scheduled_callback` (client indisponible)
- `contact_attempt -> admin_profile_update` (client disponible)
- `admin_profile_update -> admin_contract_validation`
- `admin_contract_validation -> commercial_rebound`
- `commercial_rebound -> action_plan`
- `action_plan -> closed`

## 5.3 Données minimales à tracer

- Identité contactée, date/heure, canal.
- Disponibilité immédiate vs rendez-vous.
- Champs fiche client modifiés.
- Statut conformité contrat (OK/manquant + nature de la pièce).
- Contrats ailleurs déclarés.
- Manques identifiés.
- Actions décidées (devis, rdv, relance, échéance, responsable).

## 6) Lot UI minimal (MVP)

## 6.1 Blocs d’écran

1. **Préparation dossier** : manquants + conformités.
2. **Conduite d’appel** : script pas à pas + réponses.
3. **Rebond commercial** : contrats ailleurs + manques.
4. **Plan d’actions** : devis/RDV/relances.

## 6.2 Boutons recommandés

- Disponibilité : `Client disponible`, `Rappeler plus tard`
- Validation profil : `Confirmé`, `Modifié`, `Non communiqué`
- Contrat : `Signé`, `Pièce manquante`, `À relancer`
- Rebond : `Contrat ailleurs`, `Pas couvert`, `À approfondir`
- Clôture : `Créer devis`, `Planifier RDV`, `Programmer relance`

## 7) Critères d’acceptation

- Le parcours impose l’ordre administratif puis rebond commercial.
- Le script couvre les variantes : vendeur initial vs collègue, dispo immédiate vs rendez-vous.
- La mise à jour fiche client couvre particulier, pro et TNS.
- La conformité contrat est vérifiée avant toute proposition commerciale.
- Un plan d’actions daté est produit en sortie.

## 8) Risques et garde-fous

- **Risque** : appel perçu comme vente forcée  
  **Garde-fou** : verrouiller les étapes administratives avant rebond.

- **Risque** : oubli d’éléments de conformité  
  **Garde-fou** : checklist obligatoire avant passage à l’étape suivante.

- **Risque** : dispersion commerciale  
  **Garde-fou** : limiter les priorités à 2-3 manques maximum par appel.

## 9) Journal des décisions

- `2026-02-25` — Validation de la méthode en 2 temps (administratif puis rebond commercial).
- `2026-02-25` — Priorité donnée à une implémentation mixte docs + workflow + prompts + UI MVP.

