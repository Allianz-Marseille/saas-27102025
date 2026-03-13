# Réflexion — Page Paramètres Trello

## Statut

| Date       | Décision                                          |
|------------|---------------------------------------------------|
| 2026-03-13 | Données réelles validées (Kennedy + Rouvière)     |
| 2026-03-13 | Schéma Firestore arrêté (document unique)         |
| 2026-03-13 | Design UI/UX validé (split-panel + grille A–Z)    |
| 2026-03-13 | Architecture fichiers définie                     |
| 2026-03-13 | Stack technique confirmée                         |

> Ce fichier est relu au début de chaque session Cursor / Claude Code pour reprendre le contexte.

---

## Accès
- Accessible depuis **"Paramètres Trello"** dans la sidebar admin
- Visible uniquement pour le rôle `ADMINISTRATEUR`

---

## Section 1 — Déclarer les agences

Chaque agence a :
- **Code** — ex: `KEN`  — majuscules automatiques à la saisie
- **Nom** — ex: `Kennedy`
- Capitalisation automatique à la saisie

Résultat affiché : liste des agences (code + nom)
Exemples : `KEN Kennedy`, `ROU Rouvière`

Actions : ajouter, modifier, supprimer une agence

### Agences réelles

**Agence Kennedy**

| CDC      | Lettres | Board ID | URL du tableau Trello                                        |
|----------|---------|----------|--------------------------------------------------------------|
| Corentin | A – C   | 816      | https://trello.com/b/nfhDBmQg/corentin                      |
| Emma     | D – F   | 417      | https://trello.com/b/DkhXnVU8/emma                          |
| Matthieu | G – M   | 876      | —                                                            |
| Donia    | N – Z   | 825      | https://trello.com/b/yYu4W7FJ/donia                         |

**Agence Rouvière**

| CDC        | Lettres | Board ID | URL du tableau Trello                                        |
|------------|---------|----------|--------------------------------------------------------------|
| Joelle     | A – H   | 750      | https://trello.com/b/3oWnNHUr/joelle                        |
| Christelle | I – Z   | 721      | https://trello.com/b/IexKz87i/christelle                    |

---

## URLs des tableaux Trello — Collaborateurs

> Section de référence pour récupérer les Board IDs réels via l'API Trello (`GET /1/boards/{boardId}` avec `.json` en suffixe d'URL).

### Agence Kennedy

| CDC      | URL Trello                                                                          | Board ID (à extraire) |
|----------|-------------------------------------------------------------------------------------|----------------------|
| Corentin | https://trello.com/b/nfhDBmQg/corentin                                              | `nfhDBmQg`           |
| Emma     | https://trello.com/b/DkhXnVU8/emma                                                  | `DkhXnVU8`           |
| Donia    | https://trello.com/b/yYu4W7FJ/donia                                                 | `yYu4W7FJ`           |

### Agence Rouvière

| CDC        | URL Trello                                                                        | Board ID (à extraire) |
|------------|-----------------------------------------------------------------------------------|----------------------|
| Joelle     | https://trello.com/b/3oWnNHUr/joelle                                              | `3oWnNHUr`           |
| Christelle | https://trello.com/b/IexKz87i/christelle                                          | `IexKz87i`           |

> **Note** : Le Board ID dans l'URL Trello (ex: `nfhDBmQg`) est l'identifiant court. L'API Trello retourne un ID long différent — utiliser le short ID dans la config Firestore suffit pour les appels API (`/1/boards/{shortId}/lists`).

---

## Section 2 — Configurer les CDC par agence

Une fois les agences déclarées, pour chaque agence on peut déclarer ses CDC.

Chaque CDC a :
- **Prénom** — ex: `Corentin` — capitalisation automatique à la saisie
- **Lettres attribuées** — plage ou liste de lettres — ex: `A à C`
- **Board ID Trello** — l'identifiant du tableau Trello personnel du CDC — **requis avant toute sauvegarde**
- **List ID — Process M+3** — colonne cible pour les cartes Process M+3
- **List ID — Préterme AUTO** — colonne cible pour les cartes Préterme Auto
- **List ID — Préterme IRD** — colonne cible pour les cartes Préterme IRD

Logique métier :
- Un client est routé vers un CDC en fonction de la **première lettre de son nom**
- Exemple : Corentin → A, B, C → reçoit tous les clients dont le nom commence par A, B ou C

Interface :
- Par agence : liste des CDC avec leurs lettres et paramètres Trello
- Ajout d'un CDC : input prénom libre + sélecteur alphabet cliquable (A–Z)
- Alphabet cliquable : chaque lettre est un bouton toggle, déjà attribuée à un autre CDC = désactivée (impossible de double-attribuer)
- Les 26 lettres doivent être couvertes sans doublon entre CDC d'une même agence

---

## Schéma de données Firestore

```typescript
// Document unique : /config/trello
// Pas de sous-collections — tout dans un seul document

{
  agencies: [
    {
      id: string,           // auto-generated
      code: string,         // ex: "KEN" — majuscules auto
      name: string,         // ex: "Kennedy"
      cdc: [
        {
          id: string,
          firstName: string,          // capitalisation auto à la saisie
          letters: string[],          // ex: ["A","B","C"]
          boardId: string,            // requis avant toute sauvegarde
          lists: {
            processM3: string,        // List ID — Process M+3
            pretermeAuto: string,     // List ID — Préterme AUTO
            pretermeIrd: string       // List ID — Préterme IRD
          }
        }
      ]
    }
  ]
}
```

---

## Logique métier — Routing et validation

```typescript
// Routing client → CDC
function routeClient(lastName: string, agency: Agency): CDC | null {
  const firstLetter = lastName.charAt(0).toUpperCase()
  return agency.cdc.find(cdc => cdc.letters.includes(firstLetter)) ?? null
}

// Validation couverture complète
const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const coveredLetters = agency.cdc.flatMap(cdc => cdc.letters)
const isComplete = allLetters.every(l => coveredLetters.includes(l))
const hasDuplicate = coveredLetters.length !== new Set(coveredLetters).size
```

Règles de validation :
- Les 26 lettres doivent être couvertes sans doublon par agence
- Impossible d'attribuer une lettre déjà prise dans la même agence
- Impossible de supprimer un CDC si cela laisse des lettres non couvertes → warning modal
- Board ID requis avant toute sauvegarde
- Capitalisation automatique du prénom à la saisie

---

## UI/UX — Décisions de design

### Layout général

Split-panel :
- **Sidebar gauche fixe** (220px) : liste des agences
- **Panel principal** : CDC de l'agence sélectionnée

### Sidebar agences

- Badge code monospace + nom + compteur CDC (ex: `KEN Kennedy · 4 CDC`)
- Agence active : highlight bleu + bordure droite 2px
- Bouton "＋ Ajouter une agence" en dashed border en bas

### Barre de couverture alphabet

Indicateur permanent en haut du panel :
- `26/26 ✓` en vert → couverture complète
- `X/26 ⚠` en orange → couverture incomplète
- Largeur de la barre animée à chaque changement de lettre (Framer Motion)

### Carte CDC

Chaque CDC = une card avec :
- Avatar initiales (couleur unique par CDC : bleu, vert, amber, violet en rotation)
- Prénom + badge plage de lettres (`A – C`) + Board ID discret
- Grille A–Z 2 rangées × 13 colonnes :
  - **Active** (ce CDC) → couleur du CDC
  - **Taken** (autre CDC) → grisé 45% opacité + cursor not-allowed + tooltip nom du propriétaire
  - **Libre** → neutre, cliquable
- 3 inputs compacts mono : List ID Process M+3 / Préterme AUTO / Préterme IRD
- Boutons ✎ modifier et ✕ supprimer (rouge au hover)

### Animations Framer Motion

- Entrée des cartes CDC : stagger 0.08s (opacity + translateY + scale)
- Changement d'agence : slide horizontal avec AnimatePresence
- Lettres alphabet : spring `whileTap(scale 0.85)` + `whileHover(scale 1.15)`
- Barre de couverture : largeur animée ease-out 0.6s
- Modals : scale 0.95→1 + backdrop blur 4px
- Bouton ＋ : icône qui tourne 90deg au hover

---

## Architecture fichiers

```
/app
  /admin
    /parametres-trello
      page.tsx                    ← server component, accès ADMINISTRATEUR

/components
  /admin
    /parametres-trello
      AgencySidebar.tsx           ← liste agences + bouton ajout
      AgencyPanel.tsx             ← panel principal + AnimatePresence
      CdcCard.tsx                 ← carte CDC complète
      AlphabetGrid.tsx            ← grille A–Z (taken/active/libre)
      CoverageBar.tsx             ← barre progression couverture
      AddAgencyModal.tsx          ← dialog ajout/modif agence
      AddCdcModal.tsx             ← dialog ajout/modif CDC

/lib
  /trello-config
    types.ts                      ← interfaces Agency, CDC, TrelloLists
    hooks.ts                      ← useTrelloConfig() — Firestore temps réel
    validators.ts                 ← validateCoverage(), routeClient()
    constants.ts                  ← ALPHABET, CDC_COLORS, AGENCIES
```

---

## Hook Firestore — `useTrelloConfig`

```typescript
export function useTrelloConfig() {
  // Lecture temps réel via onSnapshot sur /config/trello
  // Optimistic updates : UI mise à jour avant confirmation Firestore

  return {
    agencies,
    loading,
    addAgency:    async (data: { code: string; name: string }) => {},
    updateAgency: async (id: string, data: Partial<Agency>) => {},
    deleteAgency: async (id: string) => {},
    addCdc:       async (agencyId: string, data: Omit<CDC, 'id'>) => {},
    updateCdc:    async (agencyId: string, cdcId: string, data: Partial<CDC>) => {},
    deleteCdc:    async (agencyId: string, cdcId: string) => {},
    getCoverageStatus: (agency: Agency) => ({
      covered: number,
      total: 26,
      missing: string[],
      isComplete: boolean
    })
  }
}
```

---

## Stack technique

- **Framework** : Next.js (App Router)
- **Styles** : Tailwind CSS + shadcn/ui
- **Animations** : Framer Motion
- **Icônes** : Lucide React
- **Base de données** : Firebase Firestore (temps réel, onSnapshot)
- **IDE** : Cursor + Claude Code
- **Stratégie data** : document unique `/config/trello`, optimistic updates, mobile-friendly (sidebar → select dropdown sur mobile)
