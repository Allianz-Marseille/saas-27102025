# Plan : Système de tags par compagnie + sous-agent IA de suggestion

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Modèle de données](#modèle-de-données)
3. [Tags de référence](#tags-de-référence)
4. [Phases d'implémentation](#phases-dimplémentation)
5. [Sous-agent Gemini](#sous-agent-gemini)
6. [UI — détail par phase](#ui--détail-par-phase)
7. [Permissions](#permissions)
8. [Résumé des fichiers](#résumé-des-fichiers)

---

## Vue d'ensemble

Aujourd'hui le module Courtage est un outil de consultation (identifiants + liens).
L'objectif de cette évolution est d'en faire une **base de connaissance métier** : chaque compagnie est taguée selon ses spécialités, ses publics cibles et ses points forts.

Un collaborateur qui ne connaît pas notre historique peut ainsi filtrer par tag ("jeune conducteur", "cyber", "santé collective"…) et trouver immédiatement la bonne compagnie.

Pour amorcer la base sans effort manuel, un **sous-agent Gemini** analyse chaque compagnie (nom + URL) et propose une liste de tags à valider.

---

## Modèle de données

### Ajout dans la collection Firestore `courtage`

```ts
// Ajout au type CourtageEntry existant
tags?: string[];           // liste libre de tags
tagsUpdatedBy?: string;    // qui a mis à jour les tags en dernier
tagsUpdatedAt?: Timestamp; // quand
```

- `tags` : tableau de chaînes libres, sans limite de nombre.
- `tagsUpdatedBy` / `tagsUpdatedAt` : traçabilité séparée de `qui` / `dateModification` (qui tracent les credentials, pas les tags).

---

## Tags de référence

Liste de départ — évolutive, non limitative. Sert de suggestions dans l'UI (combobox).

| Catégorie | Tags |
|---|---|
| Auto | jeune conducteur, malussé, flotte auto, camping-car, deux-roues, utilitaire, résiliation loi hamon |
| Habitation | locataire, propriétaire, copropriété, immeuble |
| Pro / Entreprise | RC pro, décennale, cyber, multi-risque pro, garantie financière, caution |
| Santé / Prévoyance | santé individuelle, santé collective, prévoyance, invalidité, TNS |
| Voyage / Assistance | assistance voyage, rapatriement, annulation |
| Sinistre / Expertise | expertise sinistre, recours, assistance juridique |
| Outils | DSN / social, résiliation assurée, signature électronique, extranet courtier |
| Spécial | animaux, sport, événementiel |

---

## Phases d'implémentation

### Phase 1 — Firestore + types

- Ajouter `tags`, `tagsUpdatedBy`, `tagsUpdatedAt` à `types/courtage.ts` (ou l'interface existante).
- Mettre à jour les fonctions CRUD dans `lib/firebase/courtage.ts` :
  - `updateCourtage` : écrire `tagsUpdatedBy` + `tagsUpdatedAt` automatiquement quand `tags` change.
  - `updateTags(id, tags, userEmail)` : fonction dédiée pour mettre à jour uniquement les tags (évite d'écraser `qui` / `dateModification` des credentials).

---

### Phase 2 — Affichage des tags dans la liste

- Sur la liste des compagnies (`/commun/courtage`), sous le nom de chaque compagnie, afficher les tags sous forme de **badges colorés** (petits, discrets).
- Si `tags` est vide ou absent : ne rien afficher (pas de placeholder).
- Filtre par tag : ajouter un champ de recherche/filtre au-dessus de la liste permettant de filtrer les compagnies par tag (multi-sélection).

---

### Phase 3 — Édition des tags dans la modale

- Dans la modale de détail (icône "œil" existante), ajouter une section **"Points forts / Spécialités"**.
- Interface : **TagInput** — combobox avec les tags de référence comme suggestions + possibilité de saisir un tag libre (Entrée ou virgule pour valider).
- Chaque tag affiché avec un ×  pour le supprimer.
- Bouton "Enregistrer les tags" → appel `updateTags`.
- Afficher `tagsUpdatedBy` + `tagsUpdatedAt` en bas de section (même style que la traçabilité credentials).
- Accessible à **tous les rôles**.

---

### Phase 4 — Sous-agent Gemini (suggestion IA)

Voir section dédiée ci-dessous.

---

## Sous-agent Gemini

### Objectif

Pour chaque compagnie, à partir de son **nom** et de son **URL**, l'agent Gemini :
1. Identifie le domaine d'activité principal.
2. Détermine les spécialités et publics cibles.
3. Retourne une liste de tags parmi les tags de référence + éventuels tags libres pertinents.

### Architecture

```
POST /api/admin/courtage/suggest-tags
Body: { id: string; compagnie: string; internet?: string }
Response: { suggestedTags: string[] }
```

- Route protégée **admin uniquement** (vérification `verifyAdmin`).
- Appel Gemini avec un prompt structuré (voir ci-dessous).
- Réponse JSON strict : `{ tags: string[] }`.
- Fallback : si Gemini échoue ou retourne du JSON invalide → retourner `[]` sans bloquer.

### Prompt Gemini (structure)

```
Tu es un expert en assurance. On t'indique le nom d'une compagnie partenaire et son site web.
Retourne uniquement un JSON : { "tags": ["tag1", "tag2", ...] }

Tags disponibles (tu peux en choisir plusieurs, et en ajouter de libres si pertinent) :
[liste des tags de référence]

Compagnie : {compagnie}
Site : {internet}

Règles :
- Maximum 8 tags.
- Ne retourne QUE le JSON, rien d'autre.
- Si tu ne connais pas la compagnie, retourne [].
```

### Bouton dans l'UI

- Dans la modale de détail, section "Points forts", ajouter un bouton **"Suggérer des tags IA"** visible uniquement pour les ADMINISTRATEUR.
- Clic → spinner → les tags suggérés apparaissent comme des badges "à valider" (style différent : pointillés ou couleur distincte).
- L'admin peut cocher/décocher les suggestions puis cliquer "Appliquer" pour les fusionner avec les tags existants.
- Les suggestions ne sont **jamais enregistrées automatiquement** : validation obligatoire.

### Mode batch (optionnel, phase ultérieure)

- Bouton "Analyser toutes les compagnies" dans la page admin courtage.
- Appelle `suggest-tags` pour chaque compagnie sans tags, en séquentiel (évite les rate limits).
- Affiche un rapport : N compagnies analysées, tags proposés par compagnie.
- L'admin valide compagnie par compagnie.

---

## UI — détail par phase

### Liste (Phase 2)

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Rechercher...          Filtrer par tag: [+ Ajouter]
├─────────────────────────────────────────────────────┤
│ Add Value            👁  ✏️                           │
│ [jeune conducteur] [malussé] [auto]                  │
├─────────────────────────────────────────────────────┤
│ Stoik                👁  ✏️                           │
│ [cyber] [RC pro]                                     │
└─────────────────────────────────────────────────────┘
```

### Modale détail (Phase 3 + 4)

```
┌─ Points forts / Spécialités ───────────────────────┐
│  [jeune conducteur ×] [malussé ×] [auto ×]         │
│  + Ajouter un tag...  (combobox avec suggestions)  │
│                                                     │
│  [Suggérer des tags IA ✨]  (admin only)            │
│                                                     │
│  Mis à jour par jeanmichel le 2026-03-12 14:30     │
│                              [Enregistrer les tags] │
└─────────────────────────────────────────────────────┘
```

---

## Permissions

| Action | Tous les rôles | Admin uniquement |
|---|---|---|
| Voir les tags | ✅ | |
| Ajouter / supprimer un tag | ✅ | |
| Filtrer par tag | ✅ | |
| Suggestion IA (bouton) | | ✅ |
| Batch IA (toutes les compagnies) | | ✅ |

---

## Résumé des fichiers

| Fichier | Action |
|---|---|
| `types/courtage.ts` | Ajouter `tags`, `tagsUpdatedBy`, `tagsUpdatedAt` |
| `lib/firebase/courtage.ts` | Ajouter `updateTags(id, tags, userEmail)` |
| `app/commun/courtage/page.tsx` | Affichage badges + filtre par tag |
| `components/courtage/tag-input.tsx` | **Nouveau** : combobox de tags avec création libre |
| `components/courtage/tag-suggestions.tsx` | **Nouveau** : badges "à valider" post-suggestion IA |
| Modale détail existante | Section tags + bouton IA |
| `app/api/admin/courtage/suggest-tags/route.ts` | **Nouveau** : endpoint Gemini suggestion tags |

---

## Ordre d'implémentation suggéré

1. Types + `updateTags` Firestore.
2. Composant `TagInput` + affichage dans la modale.
3. Badges + filtre dans la liste.
4. Endpoint Gemini + composant suggestions IA dans la modale.
5. (Optionnel) Mode batch admin.
