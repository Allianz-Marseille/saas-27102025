# Plan des thématiques — Expert protection sociale (Bob)

Pour agir en véritable expert de la protection sociale et sécuriser chaque démarche, Bob doit maîtriser une architecture complexe mêlant juridique, fiscal, social et technique assurantielle.

**Bob doit disposer d’une expertise sur toutes les garanties de la Sécurité sociale** : connaître, pour chaque régime, les prestations obligatoires, les carences, les plafonds et les conditions d’ouverture de droits, afin d’auditer les écarts et de préconiser les complémentaires adaptées.

**Cahier des charges Cursor** (paramétrage de la base de connaissances, concepts BRSS/PASS, logique du gap, instructions) : **[bob-cursor-charges.md](bob-cursor-charges.md)**.

---

## Fichiers détaillés par régime

| Fichier | Contenu |
|---------|--------|
| **[ssi.md](ssi.md)** | Garanties SSI (Sécurité sociale des indépendants) : artisans, commerçants, industriels — IJ, invalidité, capital décès, carences, plafonds. |
| **[regime-general.md](regime-general.md)** | Régime général (CPAM/CNAM) : salariés — maladie, IJ, invalidité, décès, retraite, AT/MP, famille. |
| **[ro-caisses.md](ro-caisses.md)** | Caisses des professions libérales (CARMF, CARPIMKO, CIPAV, CAVEC, CNBF, etc.) : prestations par caisse, points communs et écarts. |
| **[bob-cursor-charges.md](bob-cursor-charges.md)** | Cahier des charges Cursor : Sécu/SSI/RO, concepts (BRSS, PASS, ticket modérateur), logique du gap, prompt d’instructions. |

---

## Plan transversal (thématiques)

### I. Socle des Régimes Obligatoires (RO)

La maîtrise des carences et des plafonds est le point de départ de tout audit. Détail par régime dans les fiches ci‑dessus.

- **Régime général** → [regime-general.md](regime-general.md)
- **SSI (TNS ACI)** → [ssi.md](ssi.md)
- **Caisses libérales (CNAVPL)** → [ro-caisses.md](ro-caisses.md)
- **Seniors** : liquidation de retraite, fin des droits prévoyance.

---

### II. Volet Santé (Individuel & Collectif)

- **Cadre réglementaire** : Loi Evin, Contrat Responsable, 100 % Santé (RAC 0).
- **Santé collective (entreprise)** : ANI, dispense d’ordre public, panier de soins minimal.
- **Technique** : Ticket modérateur, forfait journalier hospitalier, dépassements (OPTAM).

---

### III. Volet Prévoyance (Risques lourds)

- **Incapacité (IJ)** : Franchises (pro, maladie, hospi), durée (3 ans), option Frais Fixes TNS.
- **Invalidité** : Fonctionnelle vs professionnelle.
- **Décès / Dépendance** : Rente éducation, rente conjoint, capital décès, obsèques.
- **Collective** : 1,50 % TA (cadres).

---

### IV. Volet Retraite et Épargne

- **Répartition** : Pension, âge légal, taux plein, décote/surcote.
- **Capitalisation** : PER, PERO, PERECO ; sortie en capital ou rente.

---

### V. Ingénierie Fiscale et Juridique

- **Loi Madelin** : Plafonds, impact sur imposition des prestations (TNS).
- **Fiscalité salarié** : Part patronale vs part salariale.
- **Formalisme employeur** : DUE, accords, conformité URSSAF.

---

### VI. Audit et Méthodologie

- **Lecture de documents** : Liasse 2035 (TNS), bulletin de paie, fiche de garanties.
- **Logique du gap** : Calculer systématiquement la **différence entre le revenu réel du client et la prestation du RO** pour justifier la prévoyance complémentaire. Ne jamais valider un conseil sans mentionner les **délais de carence** spécifiques au régime de l’assuré.
- **Argumentaire** : Objections, risques « invisibles » (invalidité partielle).
