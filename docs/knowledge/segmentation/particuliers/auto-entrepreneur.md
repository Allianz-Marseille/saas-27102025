---
segment_id: "particulier/auto-entrepreneur"
segment_label: "Auto-entrepreneur"
segment_type: "particulier"
triggers:
  - "statut = auto-entrepreneur"
  - "statut = micro-entreprise"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "activite (type)"
  - "logement (locataire/proprio)"
  - "chiffre_affaires (approximatif)"
key_questions:
  - "Quelle est votre activité ? (réglementée ou non)"
  - "Avez-vous besoin d'une RC professionnelle ? (selon activité)"
  - "Avez-vous une activité digitale ? (cyber nécessaire)"
  - "Crédit immo ?"
  - "Véhicules ? (pro ou perso)"
needs_top3:
  - { title: "Protection personnelle (santé/prévoyance/retraite)", why: "Pas de protection entreprise, besoin individuel complet", red_flags: ["pas de mutuelle", "pas de prévoyance", "pas de retraite"] }
  - { title: "Protection professionnelle (RC pro si nécessaire, PJ/Cyber si digital)", why: "Protection activité professionnelle, risques spécifiques", red_flags: ["activité réglementée sans RC", "activité digital sans cyber"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Protection du quotidien, famille, biens", red_flags: ["pas de protection juridique", "pas d'habitation"] }
optional_needs:
  - "Auto professionnelle (si véhicule pro)"
  - "Épargne projet"
vigilance:
  - "Double bloc obligatoire : besoins personnels + besoins professionnels"
  - "RC pro : vérifier si activité réglementée (obligatoire) ou non (recommandée)"
  - "Cyber : nécessaire si activité digitale"
  - "Budget souvent contraint : adapter les garanties"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Auto-entrepreneur (service-public)", url: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23560" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : Auto-entrepreneur

## Besoins personnels

### Santé
- Complémentaire individuelle (pas de mutuelle entreprise)
- Vérifier niveaux de garanties (optique, dentaire, hospitalisation)
- Budget adapté auto-entrepreneur

### Prévoyance
- Prévoyance individuelle (décès, arrêt, invalidité)
- Pas de prévoyance entreprise
- Adapter selon revenus et charges

### Retraite
- Retraite complémentaire (si activité principale)
- PER / épargne retraite

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
- Auto professionnelle si véhicule utilisé pour l'activité

## Besoins professionnels (simplifiés)

### RC Professionnelle
- **Si activité réglementée** : Obligatoire (ex: artisan, profession de santé)
- **Si activité non réglementée** : Recommandée (ex: consultant, coach)
- Vérifier selon type d'activité

### Protection juridique professionnelle
- Aide pour litiges professionnels
- Conseils juridiques activité

### Cyber (si activité digitale)
- Protection contre cyber-risques
- Obligatoire si activité en ligne (e-commerce, services digitaux)

### Auto professionnelle (si véhicule pro)
- Assurance auto avec garantie professionnelle
- Si véhicule utilisé pour l'activité

## Points de vigilance

- Double bloc obligatoire : besoins personnels + besoins professionnels
- RC pro : vérifier si activité réglementée (obligatoire) ou non (recommandée)
- Cyber : nécessaire si activité digitale
- Budget souvent contraint : adapter les garanties
- Pas de protection entreprise : tout est individuel

