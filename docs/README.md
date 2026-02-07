# Documentation du projet

<!-- ========================================================================
  INVENTAIRE DES FICHIERS — À quoi correspond chaque fichier du dossier docs/
  ========================================================================
  Ce bloc permet aux humains et aux IA de retrouver rapidement le rôle de
  chaque document. Mettre à jour cet inventaire lors de l’ajout ou suppression
  de fichiers.
======================================================================== -->

## Inventaire des fichiers (docs/)

### docs/ (racine)
| Fichier | Rôle |
|---------|------|
| **README.md** | Ce fichier : inventaire + structure de la doc, références rapides. |

### docs/agents-ia/
Spécifications des agents IA (Nina, Bob, Sinistro) : stack, UI, mapping thèmes → fiches.
| Fichier | Rôle |
|---------|------|
| **README.md** | Vue d’ensemble agents : stack technique, fonctionnalités, UI (Nina, Bob, Sinistro). Point d’entrée du dossier. |
| **bob-sante/bob-expert.md** | Plan des thématiques expert Bob (RO, santé, prévoyance, retraite, ingénierie fiscale, audit). |
| **bob-sante/infos-supplementaires-expert.md** | Infos complémentaires pour l’expert Bob (règles, contexte métier). |
| **bob-sante/regime-general.md** | Référence régime général (doc agent Bob, complément de knowledge). |
| **bob-sante/ro-caisses.md** | Référence caisses RO (doc agent Bob). |
| **bob-sante/ssi.md** | Référence SSI (doc agent Bob). |
| **bob-sante/themes-fiches-mapping.md** | Correspondance suggestions de démarrage Bob → fiches knowledge/bob. |
| **bob-sante/bob-cursor-charges.md** | Règles / charges pour Cursor sur le domaine Bob. |
| **nina_secretaire/NINA-SECRETAIRE.md** | Spec complète Nina : présentation, prompt, design, UI, fonctionnalités, modale d’intro. |
| **nina_secretaire/TODO-DEPLOIEMENT-NINA.md** | Checklist déploiement Nina (variables Vercel, tests post-déploiement, rollback). |
| **sinistro_sinistre/README.md** | Liens et ressources Sinistro (PD, UI, themes-fiches, visuel, chargeur). |
| **sinistro_sinistre/PD_SINISTRO.md** | Plan de développement Sinistro : vision, architecture, backlog, prompt, sécurité, roadmap. |
| **sinistro_sinistre/UI-ET-DASHBOARD.md** | Spec UI page chat Sinistro et présence sur le dashboard Agents IA. |
| **sinistro_sinistre/themes-fiches-mapping.md** | Correspondance suggestions de démarrage Sinistro → fiches knowledge/sinistro. |
| **sinistro_sinistre/VERIFIER-INDEX-VECTORIEL.md** | Vérifier/créer l’index vectoriel Firestore pour le RAG Sinistro (gcloud, console). |

### docs/knowledge/
Bases de connaissances **chargées** par les agents (Bob, Sinistro) et fiches métier référentielles. Voir **knowledge/README.md** pour les bases chargées.
| Fichier | Rôle |
|---------|------|
| **README.md** | Rôle du dossier : bases chargées (Bob, Sinistro), synthèses 20/30/90, sous-dossiers. |
| **20-sinistres.md** | Synthèse domaine sinistres (IRSA, IRCA, IRSI) — référence, non chargée par les chargeurs. |
| **30-sante.md** | Synthèse santé individuelle et collective (remboursements, postes) — référence. |
| **90-compliance.md** | Règles métier et conformité (ACPR, devoir de conseil) — référencée par l’API chat. |
| **bob/00-SOURCE-DE-VERITE.md** | Source de vérité Bob : inventaire des fiches, règles de cohérence, convention de citation. |
| **bob/README.md** | Présentation de la base Bob. |
| **bob/2035-bilan-tns.md** | Grille de lecture liasses BNC (2035), calcul assiette IJ. |
| **bob/attestation-mutuelle.md** | Expliquer une attestation mutuelle (usage, contenu, droits portables). |
| **bob/audit-diagnostic-conseiller.md** | Questionnement stratégique, situation → garanties. |
| **bob/ccn-top10-obligations.md** | CCN, obligations employeur, 1,50 % TA cadres. |
| **bob/commercial-objections-reponses.md** | Objections commerciales et réponses. |
| **bob/dispenses-mutuelle-obligatoire.md** | Dispenses à la mutuelle obligatoire (liste, preuve DUE/décharge). |
| **bob/due-contrat-groupe.md** | DUE, contrat de groupe. |
| **bob/extraire-infos-bulletin-contrat.md** | Extraire infos bulletin, contrat ou document. |
| **bob/faq.md** | FAQ Bob. |
| **bob/fiche-paie-sante.md** | Comprendre les lignes santé sur une fiche de paie. |
| **bob/fiscal-liasses-correspondances.md** | Correspondances fiscales (liasses, cases). |
| **bob/fiscalite-entree-sortie-prevoyance.md** | Fiscalité prévoyance (entrée/sortie). |
| **bob/garanties-minimales-entreprise.md** | Garanties minimales entreprise (CCN, 1,50 % TA, panier). |
| **bob/glossaire.md** | Définitions (PASS, IJ, Madelin, etc.). |
| **bob/invalidite-pro-vs-fonctionnelle.md** | Invalidité professionnelle vs fonctionnelle. |
| **bob/liens-devis-allianz.md** | Liens devis / tarification. |
| **bob/logique-parcours-bilan-tns.md** | Logique du parcours bilan TNS (structure, 7 piliers). |
| **bob/methodologie-conseil-prevoyance-tns.md** | Méthodologie conseil, script, BPS, matrices. |
| **bob/parcours-bilan-tns.md** | Parcours bilan TNS (étapes, fiches à utiliser) — chargé par Bob. |
| **bob/plafond-madelin.md** | Calcul plafond Madelin (formule, déductibilité) — chiffres via regulatory-figures. |
| **bob/prevoyance-tns-regles-ij.md** | Règles IJ TNS, formules, Frais Fixes, Madelin. |
| **bob/references.md** | Références officielles Bob. |
| **bob/regime-general.md** | Régime général (CPAM) : salariés, IJ, invalidité, décès. |
| **bob/regimes-obligatoires-ccn.md** | Régimes obligatoires et CCN. |
| **bob/regimes-obligatoires-tns.md** | Inventaire SSI, caisses (CNAVPL, CNBF), tableau profession → caisse. |
| **bob/regimes-socle-comparatif.md** | Comparatif régimes socle. |
| **bob/reglementaire-due-standard.md** | Règlementaire DUE standard. |
| **bob/retraite-collective-pero.md** | Retraite collective, PERO. |
| **bob/sante-panier-soins-minimal.md** | Panier de soins minimal. |
| **bob/synthese-comparative-ro-tns.md** | Tableaux RO par famille, « ce que le RO ne fait jamais ». |
| **bob/templates-reponse-modules-bob.md** | Templates de réponse hors bilan TNS (Analyse 2035, Comparatif, Audit retraite/senior). |
| **bob/ro/carcdsf.md** | Fiche RO caisse CARCDSF. |
| **bob/ro/carmf.md** | Fiche RO caisse CARMF. |
| **bob/ro/carpimko.md** | Fiche RO caisse CARPIMKO. |
| **bob/ro/carpv.md** | Fiche RO caisse CARPV. |
| **bob/ro/cavamac.md** | Fiche RO caisse CAVAMAC. |
| **bob/ro/cavec.md** | Fiche RO caisse CAVEC. |
| **bob/ro/cavom.md** | Fiche RO caisse CAVOM. |
| **bob/ro/cavp.md** | Fiche RO caisse CAVP. |
| **bob/ro/cipav.md** | Fiche RO caisse CIPAV. |
| **bob/ro/cnbf.md** | Fiche RO caisse CNBF. |
| **bob/ro/cprn.md** | Fiche RO caisse CPRN. |
| **bob/ro/ssi.md** | Fiche RO SSI (Sécurité sociale des indépendants). |
| **sinistro/00-SOURCE-DE-VERITE.md** | Source de vérité Sinistro : inventaire des fiches, règles. |
| **sinistro/badinter-irca.md** | Loi Badinter, IRCA (corporel auto). |
| **sinistro/constat-amiable-lecture.md** | Structure constat (A/B, cases, croquis), repérer contradictions. |
| **sinistro/droit-commun-sinistres.md** | Sortie des conventions, Code des assurances, délais, expertise. |
| **sinistro/exemples-cas-complexes.md** | Exemples few-shot : cas IRSA/IRSI, constat incohérent, corporel. |
| **sinistro/irsa-auto.md** | Convention IRSA (auto), seuils 6 500 € HT, 1 500 € HT. |
| **sinistro/irsi-immeuble.md** | Convention IRSI (immeuble), seuil 5 000 € HT. |
| **sinistro/templates-communication.md** | Structures types : recours IRSA, demande de pièces, refus de garantie. |
| **core/agences.md** | Données agences (référentiel). |
| **core/effectif-agence.md** | Effectif agence. |
| **core/identite-agence.md** | Identité de l’agence. |
| **core/liens-devis.md** | Liens vers outils de devis. |
| **core/numeros-assistance.md** | Numéros d’assistance. |
| **core/outils-tarification.md** | Outils de tarification. |
| **core/reglementation.md** | Réglementation (référentiel). |
| **core/specification-comportement-ia.md** | Spécification comportement IA (rôles, règles) — référencée par l’API chat. |
| **process/leads.md** | Processus métier leads. |
| **process/m-plus-3.md** | Processus M+3 (métier). |
| **process/preterme-auto.md** | Processus préterme auto. |
| **process/preterme-ird.md** | Processus préterme IRD. |
| **process/sinistres.md** | Processus sinistres (référence détaillée, non chargée en V1). |
| **produits/assurance-iard.md** | Produit assurance IARD. |
| **produits/assurance-sante.md** | Produit assurance santé. |
| **produits/assurance-vtm-allianz.md** | Assurance VTM Allianz. |
| **produits/entreprises-contracts.md** | Contrats entreprises. |
| **produits/epargne.md** | Épargne. |
| **produits/particuliers-contracts.md** | Contrats particuliers. |
| **produits/prevoyance.md** | Prévoyance. |
| **produits/professionnels-contracts.md** | Contrats professionnels. |
| **segmentation/entreprises/_index.md** | Index segmentation entreprises. |
| **segmentation/entreprises/entreprise-dirigeant-assimile-salarie.md** | Segment dirigeant assimilé salarié. |
| **segmentation/entreprises/entreprise-dirigeant-tns.md** | Segment dirigeant TNS. |
| **segmentation/entreprises/entreprise-salaries.md** | Segment entreprise avec salariés. |
| **segmentation/entreprises/entreprise-socle.md** | Segment entreprise socle. |
| **segmentation/entreprises/size-bands.md** | Tranches de taille d’entreprise. |
| **segmentation/particuliers/_index.md** | Index segmentation particuliers. |
| **segmentation/particuliers/age-bands.md** | Tranches d’âge. |
| **segmentation/particuliers/auto-entrepreneur.md** | Segment auto-entrepreneur. |
| **segmentation/particuliers/etudiant.md** | Segment étudiant. |
| **segmentation/particuliers/fonctionnaire.md** | Segment fonctionnaire. |
| **segmentation/particuliers/salarie-cadre.md** | Segment salarié cadre. |
| **segmentation/particuliers/salarie-non-cadre.md** | Segment salarié non cadre. |
| **segmentation/particuliers/tns-artisan.md** | Segment TNS artisan. |
| **segmentation/particuliers/tns-commercant.md** | Segment TNS commerçant. |
| **segmentation/particuliers/tns-prof-liberale.md** | Segment TNS profession libérale. |
| **contrats/entreprise.md** | Contrats type entreprise. |
| **contrats/particulier.md** | Contrats type particulier. |
| **contrats/professionnel.md** | Contrats type professionnel. |
| **sources/assurance-decennale.md** | Source assurance décennale. |
| **sources/complementaire-sante-collective.md** | Source complémentaire santé collective. |
| **sources/references-officielles.md** | Références officielles. |
| **sources/sante-regles-remboursement.md** | Règles de remboursement santé. |

### docs/process/
Processus détaillés côté **implémentation IA** (à distinguer de knowledge/process/ qui décrit le métier).
| Fichier | Rôle |
|---------|------|
| **m+3/m+3_ia.md** | Workflow M+3 pour le bot / implémentation IA. |

### docs/boost/
Spécification de l’outil Boosts (déclaration et suivi) + checklist d’implémentation.
| Fichier | Rôle |
|---------|------|
| **BOOST.md** | Spécification outil Boosts : contexte, navigation, déclaration, suivi, rôles. |
| **TODO.md** | Checklist / TODO d’implémentation Boosts. |

### docs/remuneration/
Grille de pilotage des rémunérations + TODO d’implémentation.
| Fichier | Rôle |
|---------|------|
| **grille.md** | Spécification grille de pilotage des rémunérations (saisie, simulations, brouillon, validation). |
| **TODO.md** | Checklist / TODO d’implémentation rémunérations. |

### docs/resumes-bots/
Résumés d’organisation pour les IA et les humains : stack, fichiers, logique de chaque bot.
| Fichier | Rôle |
|---------|------|
| **README.md** | Tableau des résumés avec liens vers ORGANISATION-NINA, BOB, SINISTRO. |
| **ORGANISATION-NINA.txt** | Résumé Nina : stack, organisation des fichiers, logique du bot (prompt seul, pas de RAG). |
| **ORGANISATION-BOB.txt** | Résumé Bob : stack, RAG Firestore, fallback, bloc réglementaire, fichiers clés. |
| **ORGANISATION-SINISTRO.txt** | Résumé Sinistro : stack, RAG Firestore, fallback, conventions, fichiers clés. |

### docs/pdf/
Référentiels métier (vadémécums, conventions) — **non servis par l’application**, usage interne.
| Dossier / Fichier | Rôle |
|-------------------|------|
| **auto/** | Vadémécums auto : bonus/malus, carte grise, sinistres, catégories socio-pro, code personnalisation, transport marchandises, Auto-Ultimo ; guide de souscription. |
| **sante-prev/** | Exemple liasse 2035 (santé/prévoyance). |
| **sinistre/** | Convention IRSA (Alteas) — référence sinistres. |

---

## Structure (résumé)

| Dossier | Rôle |
|--------|------|
| **agents-ia/** | Spécifications des bots (Nina, Bob, Sinistro) : stack, UI, mapping thèmes → fiches. Point d’entrée : [agents-ia/README.md](agents-ia/README.md). |
| **knowledge/** | Bases de connaissances **chargées** par les agents (Bob : `knowledge/bob/` + `knowledge/bob/ro/` ; Sinistro : `knowledge/sinistro/`) et fiches métier référentielles (core, process, produits, segmentation, contrats, sources). Les fiches à la racine (`20-sinistres.md`, `30-sante.md`, `90-compliance.md`) sont des synthèses par domaine, utilisées comme références (voir [knowledge/README.md](knowledge/README.md)). |
| **process/** | Processus détaillés côté **implémentation IA** (ex. workflow M+3 pour le bot). À distinguer de `knowledge/process/` qui décrit les processus métier. |
| **boost/** | Spécification de l’outil Boosts + checklist d’implémentation (BOOST.md, TODO.md). |
| **remuneration/** | Spécification de la grille de pilotage des rémunérations + TODO d’implémentation (grille.md, TODO.md). |
| **resumes-bots/** | Résumés d’organisation pour les IA et les humains : stack, fichiers, logique de chaque bot. [resumes-bots/README.md](resumes-bots/README.md) avec liens vers ORGANISATION-NINA, BOB, SINISTRO. |
| **pdf/** | Référentiels métier (vadémécums, conventions) : non servis par l’application, usage interne. |

## Références rapides

- **Spécification comportement IA (rôles)** : [knowledge/core/specification-comportement-ia.md](knowledge/core/specification-comportement-ia.md)
- **Agents IA (Nina, Bob, Sinistro)** : [agents-ia/README.md](agents-ia/README.md)
- **Base Bob (source de vérité)** : [knowledge/bob/00-SOURCE-DE-VERITE.md](knowledge/bob/00-SOURCE-DE-VERITE.md)
- **Base Sinistro** : [knowledge/sinistro/00-SOURCE-DE-VERITE.md](knowledge/sinistro/00-SOURCE-DE-VERITE.md)
