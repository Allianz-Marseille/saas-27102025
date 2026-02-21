---
segment_id: "particulier/salarie-cadre"
segment_label: "Salarié cadre"
segment_type: "particulier"
triggers:
  - "csp = salarie"
  - "niveau = cadre"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "logement (locataire/proprio)"
  - "mutuelle entreprise ? (oui/non)"
  - "prevoyance entreprise ? (oui/non)"
  - "revenus (approximatif)"
key_questions:
  - "Avez-vous une complémentaire santé d'entreprise ? Niveaux ? Ayants droit ?"
  - "Avez-vous une prévoyance entreprise (décès/arrêt/invalidité) ? Plafonds ?"
  - "Crédit immo ? Montant restant ?"
  - "Véhicules ?"
  - "Enfants à charge ?"
  - "Projets (achat RP, travaux, études enfants) ?"
needs_top3:
  - { title: "Santé (collective + éventuelle surcomplémentaire)", why: "Revenus élevés = besoins de soins de qualité, vérifier reste à charge, surcomplémentaire si nécessaire", red_flags: ["pas de mutuelle", "gros reste à charge", "niveaux insuffisants pour revenus"] }
  - { title: "Prévoyance (trous de couverture)", why: "Revenus élevés non protégés = risque financier important, charges fortes (crédits, famille)", red_flags: ["revenu élevé non protégé", "charges fortes", "garanties insuffisantes"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Patrimoine à protéger, famille, biens de valeur", red_flags: ["pas de protection juridique", "patrimoine non protégé", "risques du quotidien"] }
optional_needs:
  - "PER / épargne projet (achat RP, travaux)"
  - "Assurance-vie (transmission, optimisation fiscale)"
  - "Prévoyance renforcée (homme-clé si dirigeant)"
vigilance:
  - "Ne pas supposer que la mutuelle/prévoyance est bonne : vérifier niveaux/plafonds/exclusions"
  - "Revenus élevés = besoins de garanties renforcées"
  - "Vérifier couverture crédit immobilier (décès/invalidité)"
  - "Adapter selon patrimoine et charges"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Complémentaire santé collective (service-public)", url: "https://www.service-public.fr/particuliers/vosdroits/F20740" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : Salarié cadre

## Besoins personnels

### Santé
- Complémentaire collective (si entreprise)
- Vérifier niveaux de garanties (optique, dentaire, hospitalisation)
- Surcomplémentaire possible si revenus élevés et besoins de soins de qualité
- Vérifier reste à charge réel
- Ayants droit (conjoint, enfants)

### Prévoyance
- Vérifier garanties entreprise (décès, arrêt, invalidité)
- Revenus élevés = risque financier important si arrêt/invalidité
- Compléter si nécessaire selon charges (crédits, famille)
- Vérifier plafonds de garanties

### Protection juridique
- Protection famille et patrimoine
- Aide pour litiges (travail, consommation, logement, fiscal)
- Conseils juridiques avancés

### IARD
- Habitation (locataire ou propriétaire)
- Responsabilité civile
- Multirisque habitation (biens de valeur)

### Auto
- Assurance auto (tous risques recommandé si véhicule de valeur)
- Conditions selon usage

### Épargne
- PER / épargne projet (achat RP, travaux, études enfants)
- Assurance-vie (transmission, optimisation fiscale)
- Épargne retraite (PER, PERP)

## Points de vigilance

- Ne pas supposer que la mutuelle/prévoyance est bonne : vérifier niveaux/plafonds/exclusions
- Revenus élevés = besoins de garanties renforcées
- Vérifier couverture crédit immobilier (décès/invalidité)
- Adapter selon patrimoine et charges
- Vérifier couverture ayants droit

