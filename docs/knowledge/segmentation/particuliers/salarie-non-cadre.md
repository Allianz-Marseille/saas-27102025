---
segment_id: "particulier/salarie-non-cadre"
segment_label: "Salarié non-cadre"
segment_type: "particulier"
triggers:
  - "csp = salarie"
  - "niveau = non-cadre"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "logement (locataire/proprio)"
  - "mutuelle entreprise ? (oui/non)"
  - "prevoyance entreprise ? (oui/non)"
key_questions:
  - "Avez-vous une complémentaire santé d'entreprise ? Niveaux de garanties ?"
  - "Avez-vous une prévoyance entreprise (décès/arrêt/invalidité) ?"
  - "Crédit immo ?"
  - "Véhicules ?"
  - "Enfants à charge ?"
needs_top3:
  - { title: "Santé (collective ou individuelle selon entreprise)", why: "Vérifier niveaux de garanties, reste à charge, ayants droit", red_flags: ["pas de mutuelle", "gros reste à charge", "niveaux insuffisants"] }
  - { title: "Prévoyance (trous de couverture)", why: "Vérifier garanties entreprise, compléter si nécessaire", red_flags: ["pas de prévoyance", "garanties insuffisantes", "charges familiales"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Protection du quotidien, famille, biens", red_flags: ["pas de protection juridique", "pas d'habitation", "risques non couverts"] }
optional_needs:
  - "PER / épargne projet"
  - "Assurance-vie (transmission si enfants)"
vigilance:
  - "Ne pas supposer que la mutuelle/prévoyance est bonne : vérifier niveaux/plafonds/exclusions"
  - "Vérifier reste à charge réel (exemples concrets)"
  - "Adapter selon charges familiales"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Complémentaire santé collective (service-public)", url: "https://www.service-public.fr/particuliers/vosdroits/F20740" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : Salarié non-cadre

## Besoins personnels

### Santé
- Complémentaire collective (si entreprise) ou individuelle
- Vérifier niveaux de garanties (optique, dentaire, hospitalisation)
- Vérifier reste à charge réel
- Ayants droit (conjoint, enfants)

### Prévoyance
- Vérifier garanties entreprise (décès, arrêt, invalidité)
- Compléter si nécessaire selon charges familiales
- Adapter selon revenus

### Protection juridique
- Protection famille
- Aide pour litiges (travail, consommation, logement)
- Conseils juridiques

### IARD
- Habitation (locataire ou propriétaire)
- Responsabilité civile
- Multirisque habitation

### Auto
- Assurance auto (tiers ou tous risques selon véhicule)
- Conditions selon usage

### Épargne
- PER / épargne projet (si capacité)
- Assurance-vie (transmission si enfants)

## Points de vigilance

- Ne pas supposer que la mutuelle/prévoyance est bonne : vérifier niveaux/plafonds/exclusions
- Vérifier reste à charge réel avec exemples concrets
- Adapter selon charges familiales et revenus
- Vérifier couverture ayants droit

