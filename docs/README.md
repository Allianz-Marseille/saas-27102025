# Documentation du projet

<!-- ========================================================================
  INVENTAIRE DES FICHIERS — À quoi correspond chaque fichier du dossier docs/
  ========================================================================
  Ce bloc permet aux humains et aux IA de retrouver rapidement le rôle de
  chaque document. Mettre à jour cet inventaire lors de l'ajout ou suppression
  de fichiers.
======================================================================== -->

## Inventaire des fichiers (docs/)

### docs/ (racine)

| Fichier | Rôle |
|---------|------|
| **README.md** | Ce fichier : inventaire + structure de la doc. |

---

### docs/plans/

Plans d'implémentation de features à venir.

| Fichier | Rôle |
|---------|------|
| **courtage-tags-agent.md** | Plan : système de tags par compagnie + sous-agent Gemini de suggestion. 4 phases détaillées. |
| **sidebar-deconnexion-compte-rebours.md** | Plan : déconnexion auto 5 min, cadran SVG, footer sidebar unifié tous rôles. |

---

### docs/process/

Processus détaillés côté implémentation.

| Fichier | Rôle |
|---------|------|
| **m+3/m+3_ia.md** | Workflow M+3 (implémentation IA). |
| **m+3/m+3_guide_impl.md** | Guide opérationnel de cadrage et implémentation M+3. |

---

### docs/boost/

Spécification de l'outil Boosts (déclaration et suivi des avis Google).

| Fichier | Rôle |
|---------|------|
| **BOOST.md** | Spec complète : contexte, navigation, structure page, modèle de données, rôles, vision admin. |
| **TODO.md** | Checklist d'implémentation (quasi entièrement cochée — feature livrée). |

---

### docs/remuneration/

Grille de pilotage des rémunérations.

| Fichier | Rôle |
|---------|------|
| **README.md** | Index du dossier. |
| **grille.md** | Spécification grille de pilotage des rémunérations. |
| **TODO.md** | Checklist d'implémentation rémunérations. |
| **commissions-par-role.md** | Règles de commission par rôle (CDC, Santé Ind, Santé Coll). |
| **commercial/regles.md** | Règles de rémunération CDC Commercial. |
| **sante-ind/regles.md** | Règles de rémunération Santé Individuelle. |
| **sante-coll/regles.md** | Règles de rémunération Santé Collective. |

---

### docs/devis/

Liens vers les formulaires de devis Allianz par agence.

| Fichier | Rôle |
|---------|------|
| **README.md** | Index des agences (Corniche H91358, Rouvière H92083). |
| **H91358/liens-devis.md** | Liens devis — Agence de la Corniche. |
| **H92083/liens-devis.md** | Liens devis — Agence de la Rouvière. |

---

### docs/assets-gemini/

Assets et base de connaissances pour les agents IA (Gemini).

| Dossier | Rôle |
|---------|------|
| **registry-bots.md** | Registre de tous les bots IA : nom, domaine, dossier de knowledge. |
| **bob-prevoyance/** | Base technique Bob (TNS) : référentiels 2026, régimes (SSI, CARPIMKO, CIPAV, CARMF…), workflow méthodo, solutions Allianz/UNIM/UNICED. 15 fichiers `.md` + index. |
| **john-coll/** | Workflow John (Santé Collective). |
| **lea-sante/** | Workflow Léa (Santé Individuelle). |
| **lagon/** | Fiche Lagon : rubriques + modèle PDF. |
| **sinistro/** | Base technique Sinistro : conventions inter-assurances (IRSA, IRSI, CIDE-COP), glossaire, scénarios de test. |

---

### docs/knowledge/

Référentiel métier structuré (utilisé par les bots et l'équipe).

| Dossier | Rôle |
|---------|------|
| **README.md** | Index du dossier knowledge. |
| **30-sante.md** | Référentiel santé. |
| **core/** | Identité agences, effectif, liens devis, outils tarification, numéros assistance, réglementation, spec comportement IA. |
| **contrats/** | Contrats par segment : particulier, professionnel, entreprise. |
| **produits/** | Fiches produits : auto, MRH, santé, prévoyance, épargne, IARD, entreprises, professionnels. |
| **process/** | Processus métier : leads, M+3, préterme auto, préterme IRD, sinistres. |
| **segmentation/** | Profils clients : particuliers (TNS, salarié cadre/non-cadre, fonctionnaire, étudiant, auto-entrepreneur) + entreprises. |
| **sources/** | Références officielles, règles remboursement santé, complémentaire collective, décennale. |

---

### docs/bots-stack-technique/

Architecture technique commune à tous les bots IA.

| Fichier | Rôle |
|---------|------|
| **README.md** | Stack technique : modèle, base de connaissances, UI, infrastructure. Règle fondamentale collaborateur vs client. |
| **TODO.md** | État du code de chaque bot (Bob, John, Léa, Sinistro…) et tâches restantes. |

---

### docs/courtage/

| Fichier | Rôle |
|---------|------|
| **courtage.md** | Spec V1 du module Courtage : colonnes, structure, CRUD. |

---

### docs/outil/

Outils tiers intégrés ou à intégrer.

| Dossier | Rôle |
|---------|------|
| **pappers/README.md** | Documentation outil Pappers (recherche entreprise). |
| **societe-com/README.md** | Documentation outil Societe.com. |
| **societe-com/PLAN-DEVELOPPEMENT.md** | Plan de développement de l'intégration Societe.com. |

---

### docs/fichiers-exports/

Fichiers Excel réels utilisés pour le développement et les tests.

| Dossier | Contenu |
|---------|---------|
| **preterme-auto/** | 4 fichiers XLSX — Prétermes Auto Avr2026 (H91358 × 2, H92083 × 2). |
| **preterme-ird/** | 2 fichiers XLSX — Prétermes IARD Avr2026 (H91358, H92083). |

---

### docs/pdf/

PDFs techniques Allianz (vademecums, guides de souscription, conventions).

| Dossier | Contenu |
|---------|---------|
| **auto/** | Vademecums Auto (personnes morales, bonus/malus, carte grise, sinistres, Ultimo…) + guides souscription. |
| **mrh/** | Vademecums MRH (grands risques, vol, pièces, dépendances, attestations…) + guides souscription. |
| **conventions/** | Conventions inter-assurances : IRSI, IRSA, CIDE-COP. |
| **sinistre/** | Convention ALTEAS-IRSA. |
| **sante-prev/** | Documents santé/prévoyance. |

---

## Références rapides

| Besoin | Fichier |
|--------|---------|
| Bots IA — registre | [assets-gemini/registry-bots.md](assets-gemini/registry-bots.md) |
| Bots IA — bob prévoyance | [assets-gemini/bob-prevoyance/00-table-des-matieres.md](assets-gemini/bob-prevoyance/00-table-des-matieres.md) |
| Stack technique bots | [bots-stack-technique/README.md](bots-stack-technique/README.md) |
| Plans features à venir | [plans/](plans/) |
| Liens devis par agence | [devis/README.md](devis/README.md) |
| Rémunérations | [remuneration/grille.md](remuneration/grille.md) |
| Process M+3 | [process/m+3/m+3_ia.md](process/m+3/m+3_ia.md) |
| Fichiers Excel de test | [fichiers-exports/](fichiers-exports/) |
