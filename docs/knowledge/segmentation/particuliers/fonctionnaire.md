---
segment_id: "particulier/fonctionnaire"
segment_label: "Fonctionnaire"
segment_type: "particulier"
triggers:
  - "statut = fonctionnaire"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "logement (locataire/proprio)"
  - "mutuelle fonction publique ? (oui/non)"
  - "prevoyance fonction publique ? (oui/non)"
key_questions:
  - "Avez-vous une mutuelle fonction publique ? Niveaux ?"
  - "Avez-vous une prévoyance fonction publique ?"
  - "Crédit immo ?"
  - "Véhicules ?"
  - "Enfants à charge ?"
needs_top3:
  - { title: "Santé (mutuelle fonction publique)", why: "Complémentaire santé adaptée fonction publique, vérifier niveaux", red_flags: ["pas de mutuelle", "niveaux insuffisants"] }
  - { title: "Prévoyance (complémentaire si nécessaire)", why: "Prévoyance fonction publique de base, compléter si charges importantes", red_flags: ["pas de prévoyance", "charges fortes non couvertes"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Protection du quotidien, famille, biens", red_flags: ["pas de protection juridique", "pas d'habitation"] }
optional_needs:
  - "PER / épargne projet"
  - "Assurance-vie (transmission)"
vigilance:
  - "Vérifier mutuelle fonction publique (spécifique au statut)"
  - "Prévoyance fonction publique de base, compléter si nécessaire"
  - "Adapter selon charges familiales"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Mutuelle fonction publique (service-public)", url: "https://www.service-public.fr/particuliers/vosdroits/F20740" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : Fonctionnaire

## Besoins personnels

### Santé
- Mutuelle fonction publique (spécifique au statut)
- Vérifier niveaux de garanties (optique, dentaire, hospitalisation)
- Vérifier reste à charge réel
- Ayants droit (conjoint, enfants)

### Prévoyance
- Prévoyance fonction publique de base
- Compléter si charges importantes (crédits, famille)
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

- Vérifier mutuelle fonction publique (spécifique au statut)
- Prévoyance fonction publique de base, compléter si nécessaire
- Adapter selon charges familiales et revenus
- Vérifier couverture ayants droit

