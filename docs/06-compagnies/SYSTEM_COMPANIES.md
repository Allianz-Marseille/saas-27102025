# Compagnies Système : Allianz et Courtage

## Vue d'ensemble

Allianz et Courtage sont des **compagnies système** qui ne peuvent jamais être modifiées ou supprimées. Elles apparaissent automatiquement dans l'interface.

## Caractéristiques

### ✅ Toujours disponibles
- Allianz et Courtage sont **toujours affichées** dans le dashboard admin
- Elles apparaissent **automatiquement** dans le select des commerciaux lors de la saisie d'actes
- Elles ne nécessitent **aucune création manuelle**

### 🚫 Non modifiables
- Impossible de **modifier** le nom
- Impossible de **supprimer** la compagnie
- Impossible de **désactiver** la compagnie (elle est toujours active)

### 🔄 Remplacement automatique
- Lorsqu'une compagnie **non système** est supprimée, tous les actes historiques utilisant cette compagnie sont **automatiquement mis à jour** pour utiliser "Courtage" à la place

## Comportement dans l'interface

### Dashboard Admin (`/admin`)

Allianz et Courtage :
- Sont affichées avec un badge **"Système"**
- Ont un fond légèrement coloré pour les différencier
- **N'ont pas de boutons** Modifier/Supprimer/Désactiver
- Affichent le texte "Compagnie système" à la place

### Modale de saisie (Dashboard commercial)

Dans le select des compagnies :
1. **Allianz** apparaît toujours en premier ⭐
2. Puis les autres compagnies par ordre alphabétique
3. Courtage est toujours disponible

## Exemple concret

### Scénario
1. En avril 2025 : Vous créez un acte avec la compagnie "AXA"
2. En août 2025 : Vous supprimez la compagnie "AXA" via le dashboard admin

### Résultat
- L'acte d'avril 2025 affiche maintenant **"Courtage"** au lieu de "AXA"
- La compagnie "AXA" n'existe plus dans la liste
- Tous les autres actes historiques utilisant "AXA" affichent "Courtage"

## Code technique

### Définition des compagnies système

```typescript
// lib/firebase/companies.ts
export const SYSTEM_COMPANIES = ["Allianz", "Courtage"];
```

### Vérification

```typescript
// Vérifie si une compagnie est système
export const isSystemCompany = (name: string): boolean => {
  return SYSTEM_COMPANIES.some(sys => sys.toLowerCase() === name.toLowerCase());
};
```

### Ajout automatique

Les compagnies système sont **automatiquement ajoutées** à la liste si elles n'existent pas dans Firestore :

```typescript
// Si Allianz ou Courtage n'existe pas en base
// Elles sont créées virtuellement avec isSystem: true
```

## Compagnies personnalisées

Vous pouvez créer autant de compagnies personnalisées que vous voulez via le dashboard admin. Ces compagnies :
- ✅ Peuvent être modifiées
- ✅ Peuvent être supprimées
- ✅ Peuvent être désactivées
- ⚠️ Si supprimées, tous les actes passés sont mis à jour avec "Courtage"

## Importante

Ne modifiez pas le code pour changer les compagnies système. Si vous souhaitez des compagnies systèmes différentes, modifiez la constante `SYSTEM_COMPANIES` dans `lib/firebase/companies.ts`.

