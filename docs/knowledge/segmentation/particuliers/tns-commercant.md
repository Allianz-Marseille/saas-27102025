---
segment_id: "particulier/tns-commercant"
segment_label: "TNS Commerçant"
segment_type: "particulier"
triggers:
  - "statut = tns"
  - "activite = commerçant"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "activite (type commerce)"
  - "logement (locataire/proprio)"
  - "chiffre_affaires (approximatif)"
key_questions:
  - "Quelle est votre activité commerciale ? (commerce de détail, gros, etc.)"
  - "Avez-vous un local commercial ? (MRP nécessaire)"
  - "Avez-vous un stock/marchandises ? (protection nécessaire)"
  - "Avez-vous une activité digitale ? (cyber nécessaire)"
  - "Crédit immo ?"
  - "Véhicules ? (pro ou perso)"
needs_top3:
  - { title: "Protection personnelle (santé/prévoyance/retraite)", why: "Pas de protection entreprise, besoin individuel complet", red_flags: ["pas de mutuelle", "pas de prévoyance", "pas de retraite"] }
  - { title: "Protection professionnelle (RC pro, MRP, protection stock, cyber si digital)", why: "Activité commerciale = risques importants (stock, local, cyber)", red_flags: ["pas de RC pro", "stock non protégé", "local non protégé", "cyber si digital"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Protection du quotidien, famille, biens", red_flags: ["pas de protection juridique", "pas d'habitation"] }
optional_needs:
  - "Auto professionnelle (si véhicule pro)"
  - "Épargne projet"
vigilance:
  - "Double bloc obligatoire : besoins personnels + besoins professionnels"
  - "Protection stock/marchandises : essentiel pour activité commerciale"
  - "MRP : nécessaire si local commercial"
  - "Cyber : nécessaire si activité digitale (e-commerce)"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "Assurance professionnelle (service-public)", url: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23560" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : TNS Commerçant

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

### RC Professionnelle
- Obligatoire pour activité commerciale
- Protection en cas de dommages causés à autrui dans le cadre professionnel

### Multirisque professionnelle (MRP)
- Protection locaux commerciaux
- Protection stock/marchandises
- Incendie, dégâts des eaux, vol, etc.
- Nécessaire si local commercial

### Protection stock/marchandises
- Stock de marchandises
- Matières premières
- Essentiel pour activité commerciale

### Cyber (si activité digitale)
- Protection contre cyber-risques
- Obligatoire si activité en ligne (e-commerce, services digitaux)
- Protection données clients, paiements en ligne

### Protection juridique professionnelle
- Aide pour litiges professionnels
- Conseils juridiques activité
- Litiges avec clients, fournisseurs

### Auto professionnelle (si véhicule pro)
- Assurance auto avec garantie professionnelle
- Si véhicule utilisé pour l'activité (livraison, approvisionnement)

## Points de vigilance

- Double bloc obligatoire : besoins personnels + besoins professionnels
- Protection stock/marchandises : essentiel pour activité commerciale
- MRP : nécessaire si local commercial
- Cyber : nécessaire si activité digitale (e-commerce)
- Pas de protection entreprise : tout est individuel

