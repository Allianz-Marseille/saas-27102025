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

### docs/process/
Processus détaillés côté implémentation.
| Fichier | Rôle |
|---------|------|
| **m+3/m+3_ia.md** | Workflow M+3 (implémentation). |

### docs/boost/
Spécification de l'outil Boosts (déclaration et suivi).
| Dossier / fichier | Rôle |
|-------------------|------|
| **google/** | Spéc et TODO pour le type de boost Google. |
| **google/BOOST.md** | Spécification outil Boosts : contexte, navigation, déclaration, suivi, rôles. |
| **google/TODO.md** | Checklist / TODO d'implémentation Boosts. |

### docs/remuneration/
Grille de pilotage des rémunérations.
| Fichier | Rôle |
|---------|------|
| **grille.md** | Spécification grille de pilotage des rémunérations. |
| **TODO.md** | Checklist / TODO d'implémentation rémunérations. |

### docs/devis/
Liens vers les formulaires de devis Allianz par agence (code agence dans l’URL).
| Dossier / fichier | Rôle |
|-------------------|------|
| **README.md** | Index des agences (Corniche H91358, Rouvière H92083). |
| **H91358/liens-devis.md** | Liste complète des liens devis — Agence de la Corniche. |
| **H92083/liens-devis.md** | Liste complète des liens devis — Agence de la Rouvière. |

### docs/assets-gemini/
Assets et base de connaissances pour les agents IA (cible Gemini).
| Dossier | Rôle |
|---------|------|
| **bob-prevoyance/** | Base technique Bob : référentiels 2026, régimes (SSI, CARPIMKO, CIPAV, etc.), workflow méthodologique, solutions Allianz/UNIM/UNICED. 15 fichiers `.md` + index. |

---

## Structure (résumé)

| Dossier | Rôle |
|--------|------|
| **assets-gemini/** | **Seules bases de connaissance** pour les bots IA (Gemini). Ex. : bob-prevoyance. |
| **process/** | Processus détaillés côté implémentation (ex. workflow M+3). |
| **boost/** | Spécification de l'outil Boosts + checklist d'implémentation. |
| **remuneration/** | Spécification de la grille de pilotage des rémunérations. |
| **devis/** | Liens devis Allianz par agence (H91358 Corniche, H92083 Rouvière). |

## Références rapides

- **Bases de connaissance (bots IA)** : [assets-gemini/bob-prevoyance/00-table-des-matieres.md](assets-gemini/bob-prevoyance/00-table-des-matieres.md) — **seul emplacement des bases de connaissance.**
- **Boost** : [boost/google/BOOST.md](boost/google/BOOST.md)
- **Rémunérations** : [remuneration/grille.md](remuneration/grille.md)
- **Process M+3** : [process/m+3/m+3_ia.md](process/m+3/m+3_ia.md)
- **Liens devis (par agence)** : [devis/README.md](devis/README.md) — Corniche (H91358), Rouvière (H92083)
