---
segment_id: "particulier/tns-prof-liberale"
segment_label: "TNS Profession libérale"
segment_type: "particulier"
triggers:
  - "statut = tns"
  - "activite = profession_liberale"
inputs_min:
  - "age_band"
  - "situation_familiale"
  - "activite (type profession libérale)"
  - "logement (locataire/proprio)"
  - "chiffre_affaires (approximatif)"
key_questions:
  - "Quelle est votre profession libérale ? (réglementée ou non)"
  - "Avez-vous un cabinet/local ? (MRP nécessaire)"
  - "Avez-vous des outils/matériel professionnel ? (protection nécessaire)"
  - "Avez-vous une activité digitale ? (cyber nécessaire)"
  - "Crédit immo ?"
  - "Véhicules ? (pro ou perso)"
needs_top3:
  - { title: "Protection personnelle (santé/prévoyance/retraite)", why: "Pas de protection entreprise, besoin individuel complet", red_flags: ["pas de mutuelle", "pas de prévoyance", "pas de retraite"] }
  - { title: "Protection professionnelle (RC pro obligatoire, MRP, protection outil, cyber si digital)", why: "Profession libérale = RC pro obligatoire, protection cabinet/outil", red_flags: ["pas de RC pro", "cabinet non protégé", "outil non protégé"] }
  - { title: "Protection & IARD (PJ/GAV/MRH/Auto)", why: "Protection du quotidien, famille, biens", red_flags: ["pas de protection juridique", "pas d'habitation"] }
optional_needs:
  - "Auto professionnelle (si véhicule pro)"
  - "Épargne projet"
vigilance:
  - "Double bloc obligatoire : besoins personnels + besoins professionnels"
  - "RC pro : obligatoire pour profession libérale"
  - "Protection cabinet/outil : essentiel pour profession libérale"
  - "Cyber : nécessaire si activité digitale (télémédecine, services en ligne)"
deliverables_templates:
  - "checklist questions"
  - "mail synthèse"
sources:
  - { label: "RC professionnelle obligatoire (service-public)", url: "https://www.service-public.fr/professionnels-entreprises/vosdroits/F23560" }
  - { label: "Ameli - remboursement soins", url: "https://www.ameli.fr/" }
---

# Segment : TNS Profession libérale

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
- **Obligatoire** pour profession libérale
- Protection en cas de dommages causés à autrui dans le cadre professionnel
- Vérifier selon type de profession (médecin, avocat, expert-comptable, etc.)

### Multirisque professionnelle (MRP)
- Protection cabinet/local professionnel
- Protection outil/matériel professionnel
- Incendie, dégâts des eaux, vol, etc.
- Nécessaire si cabinet/local

### Protection outil/matériel professionnel
- Outils professionnels
- Matériel professionnel
- Équipements
- Essentiel pour profession libérale

### Cyber (si activité digitale)
- Protection contre cyber-risques
- Obligatoire si activité en ligne (télémédecine, services digitaux)
- Protection données clients/patients

### Protection juridique professionnelle
- Aide pour litiges professionnels
- Conseils juridiques activité
- Litiges avec clients/patients

### Auto professionnelle (si véhicule pro)
- Assurance auto avec garantie professionnelle
- Si véhicule utilisé pour l'activité

## Points de vigilance

- Double bloc obligatoire : besoins personnels + besoins professionnels
- RC pro : obligatoire pour profession libérale
- Protection cabinet/outil : essentiel pour profession libérale
- Cyber : nécessaire si activité digitale (télémédecine, services en ligne)
- Pas de protection entreprise : tout est individuel

