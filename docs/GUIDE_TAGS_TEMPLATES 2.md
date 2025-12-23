# Guide d'utilisation des Tags et Templates

Ce guide explique comment utiliser le système de tags pour filtrer et rechercher les templates de l'assistant IA.

## 🎯 Objectif

Les tags permettent de :
- **Filtrer** les templates par domaine métier
- **Rechercher** rapidement un template adapté à une situation
- **Organiser** les templates de manière logique
- **Naviguer** efficacement dans le catalogue

## 🏷️ Système de tags

### Structure hiérarchique

Les tags sont organisés en catégories principales :

```
Catégories principales
├── Commercial (vente, prospection, argumentaire...)
├── Gestion (renouvellement, modification, conformité...)
├── Sinistre (déclaration, expertise, indemnisation...)
├── Produits (auto, habitation, santé, prévoyance...)
├── Conventions (IRSA, IRCA, IRSI, Badinter...)
├── Processus (leads, M+3, préterme...)
├── Canaux (email, téléphone, WhatsApp...)
├── Actions (analyse, devis, comparaison...)
├── Support (client, question, assistance...)
└── Interne (formation, note, procédure...)
```

## 📋 Liste complète des tags

### Catégorie Commercial
- `commercial` - Activités commerciales générales
- `vente` - Vente de produits d'assurance
- `prospection` - Prospection de nouveaux clients
- `argumentaire` - Arguments de vente
- `objection` - Gestion des objections
- `relance` - Relance de clients
- `appel` - Appels commerciaux
- `email` - Communication par email

### Catégorie Gestion
- `gestion` - Gestion de dossiers clients
- `renouvellement` - Renouvellement de contrats
- `modification` - Modifications de contrats
- `conformité` - Vérification de conformité
- `administration` - Tâches administratives
- `courrier` - Rédaction de courriers
- `rendez-vous` - Organisation de rendez-vous
- `changement` - Gestion de changements de situation

### Catégorie Sinistre
- `sinistre` - Gestion des sinistres
- `déclaration` - Déclaration de sinistre
- `expertise` - Expertise de sinistre
- `indemnisation` - Calcul d'indemnisation
- `litige` - Gestion de litiges
- `suivi` - Suivi de dossier sinistre
- `rapport` - Rédaction de rapports
- `procédure` - Procédures sinistres
- `assistance` - Numéros d'assistance

### Catégorie Produits
- `auto` - Assurance automobile
- `habitation` - Assurance habitation
- `santé` - Assurance santé
- `prévoyance` - Assurance prévoyance
- `épargne` - Produits d'épargne
- `iard` - Assurance IARD
- `retraite` - Produits retraite

### Catégorie Conventions
- `irsa` - Convention IRSA (auto matériel)
- `irca` - Convention IRCA (auto corporel)
- `irsi` - Convention IRSI (immeuble)
- `badinter` - Loi Badinter (victimes)
- `cat-nat` - Catastrophes naturelles
- `dintilhac` - Nomenclature Dintilhac
- `convention` - Conventions inter-assureurs

### Catégorie Processus
- `leads` - Gestion des leads
- `m+3` - Relance satisfaction M+3
- `préterme` - Renouvellement préterme
- `qualification` - Qualification de leads
- `relance_satisfaction` - Relance satisfaction

### Catégorie Canaux
- `téléphone` - Communication téléphonique
- `whatsapp` - Contact WhatsApp
- `communication` - Communication générale

### Catégorie Actions
- `analyse` - Analyse de situations
- `devis` - Génération de devis
- `comparaison` - Comparaison d'offres
- `calcul` - Calculs (primes, indemnités...)
- `explication` - Explications de concepts
- `conseil` - Conseil client
- `documentation` - Documentation

### Catégorie Support
- `support` - Support client
- `client` - Relations client
- `question` - Réponses aux questions
- `urgence` - Situations d'urgence
- `numéro` - Numéros utiles

### Catégorie Interne
- `interne` - Communication interne
- `formation` - Formation produits
- `note` - Notes internes
- `pédagogie` - Pédagogie

## 🔍 Comment utiliser les tags

### Recherche par tag unique

Pour trouver tous les templates liés à un domaine :

**Exemple** : Rechercher tous les templates sur les sinistres
- Tags à utiliser : `sinistre`
- Résultat : Tous les templates avec le tag `sinistre`

### Recherche par combinaison de tags

Pour affiner la recherche :

**Exemple** : Templates pour déclarer un sinistre auto
- Tags : `sinistre` + `auto` + `déclaration`
- Résultat : Templates spécifiques aux déclarations de sinistres auto

### Recherche par catégorie

**Exemple** : Tous les templates commerciaux
- Tags : `commercial`
- Résultat : Tous les templates de la catégorie commerciale

## 💡 Exemples d'utilisation

### Scénario 1 : Client demande un devis auto

**Tags pertinents** :
- `commercial` + `devis` + `auto`
- **Templates suggérés** :
  - Génération de devis personnalisé
  - Générer un lien de devis personnalisé (auto)

### Scénario 2 : Gérer un sinistre dégâts des eaux

**Tags pertinents** :
- `sinistre` + `déclaration` + `irsi` + `dégâts_des_eaux`
- **Templates suggérés** :
  - Déclarer un sinistre
  - Expliquer la Convention IRSI
  - Déterminer gestion conventionnelle ou droit commun

### Scénario 3 : Relancer un client pour renouvellement

**Tags pertinents** :
- `gestion` + `renouvellement` + `relance` + `préterme`
- **Templates suggérés** :
  - Préparer un renouvellement de contrat
  - Préterme Auto - Renouvellement
  - Préterme Habitation - Renouvellement

### Scénario 4 : Expliquer une convention sinistre

**Tags pertinents** :
- `sinistre` + `convention` + `explication` + `irsa` (ou `irca`, `irsi`)
- **Templates suggérés** :
  - Expliquer la Convention IRSA
  - Expliquer la Convention IRCA
  - Expliquer la Convention IRSI

## 🎯 Best practices

### 1. Utiliser plusieurs tags pour affiner

Ne pas se limiter à un seul tag. Combiner plusieurs tags pour des résultats plus précis.

**Exemple** :
- ❌ `sinistre` (trop large, 20+ templates)
- ✅ `sinistre` + `auto` + `convention` (3-5 templates pertinents)

### 2. Commencer large puis affiner

1. Commencer par une catégorie principale (`commercial`, `gestion`, `sinistre`)
2. Ajouter un tag de produit si applicable (`auto`, `habitation`, `santé`)
3. Ajouter un tag d'action (`devis`, `explication`, `calcul`)

### 3. Utiliser les tags de base de connaissance

Les templates sont enrichis avec des références aux fichiers de connaissance. Utiliser les tags pour identifier les templates qui s'appuient sur la base de connaissance la plus pertinente.

**Exemple** :
- Template avec `process/sinistres.md` → Connaissances approfondies sur les sinistres
- Template avec `produits/assurance-vtm-allianz.md` → Connaissances spécifiques auto

## 🔗 Intégration avec la base de connaissance

Chaque template peut référencer un ou plusieurs fichiers de connaissance :

- **`process/sinistres.md`** : Conventions IRSA, IRCA, IRSI, Badinter, etc.
- **`process/leads.md`** : Processus de qualification et gestion des leads
- **`process/m-plus-3.md`** : Relance satisfaction client
- **`process/preterme-auto.md`** : Renouvellement auto
- **`process/preterme-ird.md`** : Renouvellement habitation
- **`produits/assurance-vtm-allianz.md`** : Spécificités auto Allianz
- **`produits/assurance-sante.md`** : Produits santé
- **`produits/prevoyance.md`** : Produits prévoyance
- **`produits/epargne.md`** : Produits épargne retraite
- **`produits/assurance-iard.md`** : Produits IARD
- **`core/agences.md`** : Informations agences
- **`core/numeros-assistance.md`** : Numéros d'assistance
- **`core/liens-devis.md`** : Liens de devis
- **`core/identite-agence.md`** : Identité et valeurs agence
- **`core/reglementation.md`** : Réglementation et conformité

## 📊 Statistiques

- **Total de tags** : ~50 tags uniques
- **Catégories principales** : 10 catégories
- **Templates avec tags** : 73 templates (100%)
- **Templates avec base de connaissance** : 73 templates (100%)

## 🔄 Évolution

Le système de tags est évolutif. De nouveaux tags peuvent être ajoutés selon les besoins :

1. Identifier un besoin récurrent non couvert
2. Proposer un nouveau tag dans une catégorie existante
3. Créer une nouvelle catégorie si nécessaire
4. Mettre à jour les templates existants

---

*Document créé le : 2025-01-27*  
*Dernière mise à jour : 2025-01-27*

