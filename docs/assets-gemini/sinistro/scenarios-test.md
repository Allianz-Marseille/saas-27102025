# Scenarios de test Sinistro (non-regression)

Ce fichier sert de check-list fonctionnelle pour valider les evolutions du bot Sinistro.

## Regle de validation commune

Chaque reponse Sinistro doit contenir les 5 blocs:

1. Qualification
2. Cadre conventionnel
3. Justification
4. Direction de gestion
5. Etat du recours

## Scenario 1 - Auto materiel (Cas 10 IRSA)

- **Entree utilisateur**
  - "Accident auto materiel. Cas 10. Vehicule B percute l'arriere de A."
- **Attendu**
  - Convention: `IRSA_IDA`
  - Cas IRSA: `10`
  - Gestion: principe IDA (chaque assureur indemnise son assure)
  - Recours: total selon responsabilite
  - Mention convention vs droit commun

## Scenario 2 - Degats des eaux IRSI Tranche 1

- **Entree utilisateur**
  - "Degats des eaux en immeuble, montant 1200 EUR HT."
- **Attendu**
  - Convention: `IRSI`
  - Justification: `< 1600 EUR HT`
  - Recours: aucun (tranche 1)
  - Gestion: assureur gestionnaire precise

## Scenario 3 - Degats des eaux IRSI Tranche 2

- **Entree utilisateur**
  - "Degats des eaux en copropriete, montant 3200 EUR HT."
- **Attendu**
  - Convention: `IRSI`
  - Justification: `1600-5000 EUR HT`
  - Recours: possible selon bareme
  - Gestion: assureur gestionnaire precise

## Scenario 4 - CIDE-COP > 5000 EUR

- **Entree utilisateur**
  - "Incendie en copropriete, 9000 EUR HT."
- **Attendu**
  - Convention: `CIDE_COP`
  - Justification: `> 5000 EUR HT`
  - Recours: selon convention copropriete
  - Alerte claire si besoin d'analyse droit commun

## Scenario 5 - Montant non precise en HT

- **Entree utilisateur**
  - "Degats des eaux, montant 3000 euros."
- **Attendu**
  - Le bot demande explicitement confirmation HT avant de conclure la tranche IRSI.

## Scenario 6 - Constat image (validation croix)

- **Entree utilisateur**
  - "Je joins le constat en image."
- **Attendu**
  - Le bot liste les cases detectees A/B (1 a 17)
  - Le bot demande confirmation des cases
  - Le bot ne fixe le cas IRSA final qu'apres confirmation

## Execution recommandee

- Executer ces scenarios apres toute modification:
  - de `docs/assets-gemini/sinistro/`
  - de `lib/ai/bot-loader.ts`
  - de `app/api/chat/route.ts`

## Grille QA rapide (10 checks)

Cocher ces points a chaque run de validation:

- [ ] La reponse contient bien les 5 blocs obligatoires.
- [ ] La convention citee correspond au type de sinistre.
- [ ] La justification cite un cas IRSA ou un seuil IRSI/CIDE-COP.
- [ ] La direction de gestion (assureur gestionnaire) est explicite.
- [ ] L'etat du recours est explicite (aucun, partiel, total, hors convention).
- [ ] En habitation, le bot demande confirmation HT si la mention HT est absente.
- [ ] En constat image, le bot liste les cases A/B (1-17) avant conclusion.
- [ ] En constat image, le bot demande confirmation avant de fixer le cas IRSA final.
- [ ] La distinction Convention vs Droit commun est presente.
- [ ] En cas ambigu/hors convention, le bot propose une escalade vers expert.

## Criteres bloquants release

Une release Sinistro est refusee si au moins un point suivant n'est pas respecte:

- Le format 5 blocs est absent sur un scenario critique.
- La convention retenue est incorrecte (IRSA/IRSI/CIDE-COP).
- Le bot ne demande pas confirmation HT quand le montant est ambigu.
- Le bot conclut un cas IRSA a partir d'une image sans confirmation prealable des cases.
