# Lecture et analyse du constat amiable

Objectif : structurer l'extraction des infos d'un constat amiable (auto) pour qualifier le sinistre et repérer les incohérences.

## Structure type du constat

- Deux colonnes : véhicule A (notre assuré) et véhicule B (tiers).
- Cases à cocher : circonstances (ex. « je circulais », « je doublais », « je tournais à gauche », « j’étais en stationnement »).
- Croquis : schéma de la scène (position des véhicules, sens de circulation).
- Champs texte : immatriculations, lieu, date, observations, signatures.

## Ce qu'il faut extraire

| Élément | Usage |
|--------|--------|
| Véhicule de l'assuré | Identifier colonne A ou B pour notre client. |
| Cases cochées A et B | Déterminer les circonstances déclarées par chaque partie. |
| Croquis | Vérifier cohérence avec les cases (sens, position). |
| Immatriculations, lieu, date | Identification et traçabilité. |
| Signatures | Constat opposable seulement si signé par les deux parties. |

## Vigilance — Contradictions

- Incohérence : les deux parties cochent la même circonstance exclusive (ex. « je doublais » des deux côtés) → alerter et demander une précision ou un complément.
- Cases incompatibles avec le croquis : ex. croquis en ligne droite alors qu'une partie a coché « je tournais » → signaler.
- Absence de signature : constat non opposable ; rappeler l'obligation de faire signer le tiers.

## Pièges et nullité

- Signature manquante (recto ou une des deux parties) : constat non opposable. Ne pas qualifier en IRSA sans les deux signatures ; alerter le collaborateur.
- Désaccord sur le point de choc ou les circonstances : risque de retournement de responsabilité. Nuancer la qualification (ex. « sous réserve des éléments complémentaires », « à confirmer avec le tiers »).
- Cases incomplètes ou contradictoires entre A et B : alerter et demander une précision au collaborateur avant de conclure (présenter les deux lectures possibles si besoin).

## Liste de vérifications avant qualification

Avant de qualifier (IRSA / droit commun), vérifier : (1) deux signatures présentes ; (2) cohérence entre cases cochées et croquis ; (3) identification du véhicule de l'assuré (colonne A ou B). Si un point manque, ne pas conclure sans alerter.

## Qualification après lecture

Une fois les données extraites : appliquer la convention IRSA (voir `irsa-auto.md`) si au moins 2 véhicules et dommages matériels ; montant estimé (≤ **6 500 € HT** → IRSA ; > **6 500 € HT** → droit commun). Corporel : `badinter-irca.md`.

Fiche connexe : `irsa-auto.md`, `badinter-irca.md`, `droit-commun-sinistres.md`. Sinistro doit s'appuyer sur cette fiche pour toute analyse d'image de constat et la citer en source (ex. « Sources : sinistro/constat-amiable-lecture.md »).
