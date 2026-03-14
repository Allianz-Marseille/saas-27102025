# Spécification — Outil de déclaration et suivi des Boosts

## Contexte

Outil de **déclaration** et **suivi des boosts** pour tous les rôles de l'agence, incluant notamment :
- Commerciaux (CDC, Santé Individuel, Santé Collective)
- **Gestionnaires de sinistres**
- Autres rôles métier

---

## Navigation

### Accès côté collaborateur

- **Sidebar** : ajout d'un bouton **"Boost"** visible pour tous les rôles concernés
- Clic sur le bouton → ouverture d'une **nouvelle page** dédiée `/boost` (ou chemin équivalent)

### Accès côté administrateur

- **Admin Sidebar** : nouvel item **"Boost"** placé **après Sinistre**, avant Process / Outils / Agents IA
- **Admin Dashboard** (`/admin`) : nouvelle section **"Boost"** dans la grille des domaines, **sous Sinistre**

Ordre des sections sur le dashboard admin :

1. Commerciaux (CDC)
2. Santé Individuelle
3. Santé Collective
4. Sinistre (en construction)
5. **Boost** ← nouveau

---

## Structure de la page Boost

La page se compose de **deux sections principales**.

---

### Section 1 : Ma déclaration et mes boosts du mois

#### 1.1 CTA principal

- Un bouton / CTA **"Boost"** en haut de la section
- Au clic → ouverture d'une **modale**

#### 1.2 Modale de déclaration

La modale contient des **boutons cliquables** pour choisir le type de boost :

| Type      | Bouton        | Image                          | Rémunération |
|----------|---------------|--------------------------------|--------------|
| Google   | Bouton Google | `public/boost/google.png`      | 5 €          |
| *(autres à venir)* | —          | —                              | À définir    |

**Flux de déclaration (ex. Google) :**

1. L'utilisateur clique sur le bouton **Google**
2. **Date de saisie** : enregistrée automatiquement (date du jour)
3. **Champs à saisir :**
   - **Nom du client** (champ texte)
   - **Nombre d'étoiles** : select avec valeurs de **1 à 5 étoiles**
4. **Rémunération** : 5 € (affichée, non modifiable pour Google)
5. Validation → enregistrement du boost

#### 1.3 Liste des boosts du mois

- **Sous le CTA** : affichage de la **liste des boosts du mois** de l'utilisateur connecté
- Filtrage automatique sur le mois en cours
- Colonnes utiles : date, type de boost, client, étoiles, rémunération

---

### Section 2 : Classement des boosts par type

- **Sous la section 1** : classement **boost par boost** de **tous les collaborateurs**
- Vue agrégée / leaderboard par type de boost (ex. Google)
- Permet de comparer les performances et le nombre de boosts déclarés entre les rôles

---

## Données et structure

### Modèle de données (boost)

| Champ         | Type   | Description                          |
|---------------|--------|--------------------------------------|
| `id`          | string | Identifiant unique                   |
| `userId`      | string | ID du collaborateur déclarant        |
| `type`        | string | `"GOOGLE"` (extensible : autres types) |
| `clientName`  | string | Nom du client                        |
| `stars`       | number | 1 à 5                                |
| `remuneration`| number | En euros (ex. 5 pour Google)         |
| `date`        | date   | Date de saisie (auto)                |
| `createdAt`   | timestamp | Horodatage de création            |

---

## Ressources

- **Image Google** : `public/boost/google.png`
- Chemin à prévoir pour d'autres types : `public/boost/<type>.png`

---

## Vision administrateur

### Objectif

Permettre à l'admin d'**identifier les réalisations** (boosts) de tous les collaborateurs, d'en suivre le volume et les montants, et de disposer des données pour la rémunération.

### Section Boost sur le Dashboard admin (`/admin`)

Nouvelle carte **sous Sinistre** dans la grille des domaines, avec :

- **Indicateurs synthétiques** (mois sélectionné) :
  - Nombre total de boosts déclarés
  - Rémunération totale (somme des boosts)
  - Nombre de collaborateurs ayant déclaré au moins un boost
- **Bouton** : « Voir le détail complet » → `/admin/boost`
- **Filtre mois** : même `MonthSelector` que les autres sections

Différence avec les autres sections : les boosts concernent **tous les rôles** (CDC, Santé Indiv, Santé Coll, Sinistre), pas un seul rôle métier. La carte affiche donc des agrégats transversaux.

### Page admin Boost (`/admin/boost`)

Page dédiée pour **identifier et suivre les réalisations** :

| Fonctionnalité | Description |
|----------------|-------------|
| **Liste exhaustive** | Tableau de tous les boosts avec : date, collaborateur, type, client, étoiles, rémunération |
| **Filtres** | Mois, collaborateur, type de boost (Google, autres) |
| **Identification des réalisations** | Voir qui a déclaré quoi, avec le nom du client et la note pour contrôle/audit |
| **Totaux par collaborateur** | Nombre de boosts et rémunération par personne |
| **Classement** | Leaderboard par type de boost (aligné sur la vue collaborateur) |
| **Export** | Export CSV/Excel pour paie ou reporting (optionnel, point d'extension) |

### Admin Sidebar

- **Position** : après « Sinistre », avant « Process »
- **Label** : « Boost »
- **Icône** : `Zap` ou `TrendingUp` ou `Star` (Lucide)
- **Lien** : `/admin/boost`

---

## Rôles et visibilité

| Rôle                     | Accès page Boost | Déclaration | Vue classement | Accès admin Boost |
|--------------------------|------------------|-------------|----------------|-------------------|
| CDC_COMMERCIAL           | ✅               | ✅          | ✅             | —                 |
| COMMERCIAL_SANTE_INDIVIDUEL | ✅            | ✅          | ✅             | —                 |
| COMMERCIAL_SANTE_COLLECTIVE | ✅            | ✅          | ✅             | —                 |
| GESTIONNAIRE_SINISTRE    | ✅               | ✅          | ✅             | —                 |
| ADMINISTRATEUR           | ✅               | ✅          | ✅             | ✅ `/admin/boost`  |

---

## Points d'extension

- Ajout de nouveaux types de boosts (boutons supplémentaires dans la modale)
- Grille de rémunération par type (configurable)
- Filtres sur le classement (par période, par agence, etc.)
- Export CSV/Excel pour paie ou reporting
- Validation des boosts par l'admin (workflow optionnel)

---

## Schéma récapitulatif

```
Admin Dashboard (/admin)
├── Commerciaux (CDC)
├── Santé Individuelle
├── Santé Collective
├── Sinistre (en construction)
└── Boost  ← nouvelle section (KPIs synthétiques + lien vers /admin/boost)

Admin Sidebar
├── …
├── Sinistre
├── Boost  ← nouvel item → /admin/boost
├── Process
├── Outils
└── …

Collaborateur (tous rôles)
└── Sidebar → Boost → /boost (déclaration + mes boosts + classement)
```
