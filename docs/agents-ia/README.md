# Agents IA — Visages et documentation

Ce dossier documente les agents IA de l’agence : rôles, identité visuelle et emplacement des visages/photos.

## Où stocker les visages / photos des agents

- **Images (avatars, visages, photos)** → **`public/agents-ia/`**
  - Accessibles en URL : `/agents-ia/<slug-agent>/avatar.png`
  - Une image par agent, ou un sous-dossier par agent (ex. `public/agents-ia/m-plus-3/avatar.png`).

- **Documentation** → **`docs/agents-ia/`** (ce dossier)
  - Fichiers texte qui décrivent chaque agent (rôle, personnalité, mapping vers son image).
  - Ne pas mettre les images dans `docs/` : `docs/` sert à la doc, `public/` à ce qui est servi par l’app.
  - Ressources visuelles (brouillons, variantes) : sous-dossiers par agent si besoin ; les visuels servis par l’app restent dans **`public/agents-ia/`**.

## Convention de nommage

| Slug agent       | Prénom | Rôle (ex.)              | Image                                  | Ressources doc (brouillons)      |
|------------------|--------|-------------------------|----------------------------------------|----------------------------------|
| `bot-secretaire` | Nina   | Rédaction, mails, correction | `public/agents-ia/bot-secretaire/avatar.jpg` | **Icône du chat** : `/agents-ia/bot-secretaire/avatar-tete.jpg` |
| `m-plus-3`       | —      | Expert portefeuille M+3 | `public/agents-ia/m-plus-3/avatar.png` | — |
| `preterme-auto` | —      | Prévention résiliation auto | `public/agents-ia/preterme-auto/avatar.png` | — |
| *(à compléter)* | —      | …                       | …                                       | — |

Pour chaque nouvel agent :

1. Créer `public/agents-ia/<slug>/` et y déposer `avatar.png` (ou `.jpg`, `.webp`).
2. Optionnel : ajouter une entrée ici ou un fichier `docs/agents-ia/<slug>.md` avec rôle et description.

## Formats recommandés

- **Avatar / visage** : PNG ou WebP, 200×200 px minimum (affichage net sur écran).
- **Photo "représentative"** : même formats, ratio libre selon l’usage (carte, bandeau, etc.).

Les visages peuvent être :
- des visages générés (IA),
- des photos réelles téléversées,
- des illustrations/personnages selon la charte de l’agence.
