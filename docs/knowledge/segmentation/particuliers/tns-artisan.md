---
segment_id: "particulier/tns-artisan"
segment_label: "TNS Artisan"
segment_type: "particulier"
triggers:
  - "statut = tns"
  - "activite = artisan"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "activite (type artisanat)"
  - "logement (locataire/proprio)"
  - "chiffre_affaires (approximatif)"
key_questions:
  - "Quelle est votre activité artisanale ? (BTP, métiers, etc.)"
  - "Avez-vous des chantiers ? (décennale obligatoire)"
  - "Avez-vous des outils/machines ? (protection nécessaire)"
  - "Avez-vous un stock/marchandises ?"
  - "Crédit immo ?"
  - "Véhicules ? (pro ou perso)"
needs_top3:
  - { title: "Protection personnelle (santé/prévoyance/retraite)", why: "Pas de protection entreprise, besoin individuel complet", red_flags: ["pas de mutuelle", "pas de prévoyance", "pas de retraite"] }
  - { title: "Protection professionnelle (décennale, RC pro, MRP, protection outil/stock)", why: "Activité artisanale = risques importants (chantiers, outils, stock)", red_flags: ["pas de décennale si BTP", "outils non protégés", "stock non protégé"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Protection du quotidien, famille, biens", red_flags: ["pas de protection juridique", "pas d'habitation"] }
optional_needs:
  - "Auto professionnelle (si véhicule pro)"
  - "Cyber (si activité digitale)"
  - "Épargne projet"
vigilance:
  - "Double bloc obligatoire : besoins personnels + besoins professionnels"
  - "Décennale : obligatoire si activité BTP ou réglementée"
  - "Protection outil/stock : essentiel pour activité artisanale"
  - "Vérifier expositions (chantiers, machines, stock)"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Assurance décennale (service-public)", url: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23560" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : TNS Artisan

## Besoins personnels

### Santé
- Complémentaire individuelle (pas de mutuelle entreprise)
- Vérifier niveaux de garanties (optique, dentaire, hospitalisation)
- Adapter selon revenus

### Prévoyance
- Prévoyance individuelle (décès, arrêt, invalidité)
- Pas de prévoyance entreprise
- Adapter selon revenus et charges (crédits, famille)

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

## Besoins professionnels

### Assurance décennale
- **Obligatoire** si activité BTP ou réglementée
- Garantie des travaux pendant 10 ans
- Vérifier selon type d'activité artisanale

### RC Professionnelle
- Obligatoire pour activité artisanale
- Protection en cas de dommages causés à autrui dans le cadre professionnel

### Multirisque professionnelle (MRP)
- Protection locaux professionnels
- Protection outil/machines
- Protection stock/marchandises
- Incendie, dégâts des eaux, vol, etc.

### Protection outil/machines
- Outils professionnels
- Machines
- Matériel de chantier
- Essentiel pour activité artisanale

### Protection stock/marchandises
- Stock de matières premières
- Marchandises
- Matériaux
- Important selon activité

### Protection juridique professionnelle
- Aide pour litiges professionnels
- Conseils juridiques activité
- Litiges avec clients, fournisseurs

### Cyber (si activité digitale)
- Protection contre cyber-risques
- Si activité en ligne (e-commerce, services digitaux)

### Auto professionnelle (si véhicule pro)
- Assurance auto avec garantie professionnelle
- Si véhicule utilisé pour l'activité

## Points de vigilance

- Double bloc obligatoire : besoins personnels + besoins professionnels
- Décennale : obligatoire si activité BTP ou réglementée
- Protection outil/stock : essentiel pour activité artisanale
- Vérifier expositions (chantiers, machines, stock)
- Pas de protection entreprise : tout est individuel

