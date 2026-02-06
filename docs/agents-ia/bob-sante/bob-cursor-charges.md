# Cahier des charges Cursor — Base de connaissances Bob (expert protection sociale)

Pour que l’IA (via Cursor) puisse agir comme un expert en protection sociale capable de sécuriser les démarches, elle doit intégrer une structure de connaissances très précise sur les régimes obligatoires. Ce document est le **cahier des charges technique et métier** à fournir à Cursor pour paramétrer la base de connaissances de Bob.

---

## 1. La Sécurité Sociale (Régime Général & Principes)

Cursor doit comprendre que la **Sécurité Sociale est le « premier étage » de la fusée**, mais qu’elle est **structurellement incomplète**.

- **Rôle** : Gérer les prestations de base pour les salariés, les assimilés-salariés et la branche « Santé » des indépendants.
- **Concepts clés** :
  - **BRSS (Base de Remboursement de la Sécurité Sociale)** : Tarif de référence sur lequel la Sécu applique son pourcentage de remboursement.
  - **Ticket Modérateur** : Différence entre la BRSS et le remboursement effectif de la Sécu ; reste à la charge de l’assuré (ou de sa mutuelle).
  - **Plafond Annuel de la Sécurité Sociale (PASS)** : Unité de mesure indispensable pour calculer les cotisations et les plafonds de prestations (invalidité, décès). **Source unique dans le code** : `lib/assistant/regulatory-figures.ts`.
- **Garanties de base** :
  - **Santé** : Remboursement partiel selon le parcours de soins.
  - **Incapacité** : Indemnités journalières (IJ) plafonnées après 3 jours de carence pour les salariés.
  - **Invalidité** : Pensions réparties en 3 catégories selon la capacité de gain restante.

Détail régime général : [regime-general.md](regime-general.md).

---

## 2. La SSI (Sécurité Sociale des Indépendants)

Cursor doit assimiler que **la SSI n’est plus un organisme séparé** mais une **organisation spécifique au sein du régime général** pour les travailleurs non salariés (TNS).

- **Public** : Artisans, commerçants, industriels et certaines professions libérales non réglementées.
- **Fonctionnement spécifique** :
  - **Cotisations** : Calculées sur le revenu net professionnel (bénéfice ou rémunération de gérance).
  - **IJ (Indemnités Journalières)** : Basées sur le revenu annuel moyen des 3 dernières années, avec un **plafond de 1/730ᵉ du PASS par jour**.
  - **Carence TNS** : Spécificités à maîtriser (généralement **3 jours** pour hospitalisation/accident, **3 jours** pour maladie depuis les réformes récentes ; 7 jours en maladie sans hospitalisation selon les cas).
- **Points de vigilance** : L’IA doit **toujours vérifier si les cotisations sont à jour**, car les droits aux prestations en dépendent directement.

Détail SSI : [ssi.md](ssi.md).

---

## 3. Les RO (Régimes Obligatoires Métiers)

C’est ici que la précision est vitale. Pour les **professions libérales réglementées**, la **santé** relève de la SSI, mais la **prévoyance** et la **retraite** relèvent de **caisses spécifiques**.

- **Structure par « Caisse »** : Cursor doit utiliser les fiches du dossier **`docs/knowledge/bob/ro/`** pour chaque profession.
- **Médicaux** : CARMF (médecins), CARPIMKO (auxiliaires médicaux), CARCDSF (dentistes, sages-femmes), CAVP (pharmaciens).
- **Juridiques** : CNBF (avocats).
- **Techniques / Chiffres** : CIPAV (architectes, ingénieurs, consultants), CAVEC (experts-comptables).

**Prestations à auditer systématiquement** :

1. **Délai de carence** : Très variable (souvent **90 jours** pour certaines caisses libérales avant l’indemnisation de l’incapacité).
2. **Invalidité** : Montant des rentes souvent **forfaitaire et très bas** par rapport au revenu réel.
3. **Décès** : Capital versé aux ayants droit ; **présence ou non d’une rente éducation / rente conjoint** au RO.

Détail caisses : [ro-caisses.md](ro-caisses.md). Identification caisse : `docs/knowledge/bob/regimes-obligatoires-tns.md`.

---

## 4. Instructions pour Cursor (appliquées dans le code)

Les instructions ci‑dessous ont été intégrées dans le projet (prompt système, regulatory-figures, parcours-bilan-tns, loader, UI). Pour rappel :

> Configure Bob pour qu’il agisse en expert des régimes obligatoires (RO). Il doit :
>
> 1. **Utiliser le fichier `lib/assistant/regulatory-figures.ts`** pour toutes les valeurs du **PASS** et des plafonds de calcul.
> 2. **Pour toute question sur un indépendant**, identifier d’abord sa caisse via `docs/knowledge/bob/regimes-obligatoires-tns.md` puis croiser avec la fiche spécifique dans `docs/knowledge/bob/ro/`.
> 3. **Appliquer la Logique du Gap** : calculer systématiquement la **différence entre le revenu réel du client** (issu de la 2035 ou déclaration) **et la prestation du RO** pour justifier la prévoyance complémentaire.
> 4. **Ne jamais valider un conseil sans mentionner les délais de carence** spécifiques au régime de l’assuré.

---

## Suite possible

Souhaitez-vous que soit préparé le **détail des formules de calcul des IJ** pour les différentes caisses (SSI vs CARPIMKO par exemple) afin de les intégrer dans Cursor / la base de connaissances Bob ?

Retour au [sommaire](bob-expert.md).
