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
| **README.md** | Ce fichier : inventaire + structure de la doc, références rapides. |

### docs/knowledge/
Fiches métier référentielles et synthèses par domaine.
| Fichier | Rôle |
|---------|------|
| **README.md** | Rôle du dossier, structure, synthèses 20/30/90. |
| **20-sinistres.md** | Synthèse domaine sinistres (IRSA, IRCA, IRSI). |
| **30-sante.md** | Synthèse santé individuelle et collective (remboursements, postes). |
| **90-compliance.md** | Règles métier et conformité (ACPR, devoir de conseil). |
| **core/** | Agences, réglementation, identité agence, liens devis, outils tarification. |
| **process/** | Processus métier (M+3, sinistres, leads, préterme auto/IRD). |
| **produits/** | Produits assurance (IARD, santé, prévoyance, VTM, épargne). |
| **segmentation/** | Segments entreprises et particuliers. |
| **contrats/** | Contrats type entreprise, particulier, professionnel. |
| **sources/** | Référentiels (décennale, santé collective, remboursement). |

### docs/process/
Processus détaillés côté implémentation.
| Fichier | Rôle |
|---------|------|
| **m+3/m+3_ia.md** | Workflow M+3 (implémentation). |

### docs/boost/
Spécification de l'outil Boosts (déclaration et suivi).
| Fichier | Rôle |
|---------|------|
| **BOOST.md** | Spécification outil Boosts : contexte, navigation, déclaration, suivi, rôles. |
| **TODO.md** | Checklist / TODO d'implémentation Boosts. |

### docs/remuneration/
Grille de pilotage des rémunérations.
| Fichier | Rôle |
|---------|------|
| **grille.md** | Spécification grille de pilotage des rémunérations. |
| **TODO.md** | Checklist / TODO d'implémentation rémunérations. |

### docs/assets-gemini/
Assets et base de connaissances pour les agents IA (cible Gemini).
| Dossier | Rôle |
|---------|------|
| **bob-prevoyance/** | Base technique Bob : référentiels 2026, régimes (SSI, CARPIMKO, CIPAV, etc.), workflow méthodologique, solutions Allianz/UNIM/UNICED. 15 fichiers `.md` + index. |

---

## Structure (résumé)

| Dossier | Rôle |
|--------|------|
| **knowledge/** | Fiches métier référentielles (core, process, produits, segmentation, contrats, sources). Synthèses 20-sinistres, 30-sante, 90-compliance. |
| **process/** | Processus détaillés côté implémentation (ex. workflow M+3). |
| **boost/** | Spécification de l'outil Boosts + checklist d'implémentation. |
| **remuneration/** | Spécification de la grille de pilotage des rémunérations. |
| **assets-gemini/** | Base de connaissances pour agents IA (Bob prévoyance — cible Gemini). |

## Références rapides

- **Boost** : [boost/BOOST.md](boost/BOOST.md)
- **Rémunérations** : [remuneration/grille.md](remuneration/grille.md)
- **Knowledge** : [knowledge/README.md](knowledge/README.md)
- **Bob Prévyance (Gemini)** : [assets-gemini/bob-prevoyance/00-table-des-matieres.md](assets-gemini/bob-prevoyance/00-table-des-matieres.md)
