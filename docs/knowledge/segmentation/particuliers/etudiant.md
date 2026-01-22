---
segment_id: "particulier/etudiant"
segment_label: "Étudiant"
segment_type: "particulier"
triggers:
  - "statut = etudiant"
  - "age_band = 18-25"
inputs_min:
  - "age_band"
  - "situation_familiale (chez parents / indépendant)"
  - "mutuelle parents ? (oui/non)"
  - "véhicule ? (oui/non)"
key_questions:
  - "Êtes-vous encore sur la mutuelle de vos parents ? Jusqu'à quel âge ?"
  - "Avez-vous un véhicule ? (jeune conducteur)"
  - "Logement : chez les parents, colocation, studio ?"
  - "Avez-vous des revenus (job étudiant, bourse) ?"
needs_top3:
  - { title: "Santé (complémentaire individuelle si indépendant)", why: "Si plus sur mutuelle parents, besoin d'une complémentaire adaptée budget étudiant", red_flags: ["pas de couverture santé", "budget très serré"] }
  - { title: "Responsabilité civile (scolaire/extra-scolaire)", why: "Protection en cas de dommages causés à autrui", red_flags: ["pas de RC", "activités sportives/associatives"] }
  - { title: "Protection juridique (premiers contrats)", why: "Aide pour location, contrats de travail, litiges", red_flags: ["premiers contrats", "location étudiante"] }
optional_needs:
  - "Auto (si véhicule, jeune conducteur)"
  - "Épargne projet (permis, logement, études)"
vigilance:
  - "Vérifier si encore sur mutuelle parents (jusqu'à 21 ans généralement, parfois 25 ans si études)"
  - "Budget très contraint : proposer des garanties adaptées"
  - "Jeune conducteur : conditions spécifiques auto"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Mutuelle étudiante (service-public)", url: "https://www.service-public.fr/particuliers/vosdroits/F20740" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : Étudiant

## Besoins personnels

### Santé
- Complémentaire individuelle si indépendant des parents
- Vérifier si encore sur mutuelle parents (jusqu'à 21 ans généralement, parfois 25 ans si études)
- Budget adapté étudiant

### Responsabilité civile
- RC scolaire/extra-scolaire
- Protection en cas de dommages causés à autrui
- Important si activités sportives/associatives

### Protection juridique
- Aide pour premiers contrats (location, travail)
- Litiges locatifs fréquents
- Conseils juridiques

### Auto (si véhicule)
- Jeune conducteur : conditions spécifiques
- Assurance au tiers recommandée (budget)
- Possibilité d'assurance au km si faible usage

### Épargne projet
- Permis de conduire
- Logement (caution, loyer)
- Études (frais supplémentaires)

## Points de vigilance

- Budget très contraint : proposer des garanties adaptées
- Vérifier couverture santé (mutuelle parents ou individuelle)
- Jeune conducteur : conditions restrictives possibles
- Premiers contrats : besoin de conseil juridique

