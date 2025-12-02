# Configuration des compagnies

## Vue d'ensemble

Les compagnies sont maintenant gérées dynamiquement dans le dashboard administrateur et sont utilisées automatiquement lors de la saisie des actes par les commerciaux.

## Initialisation

### Option 1 : Via l'interface administrateur (Recommandé)

1. Connectez-vous avec un compte administrateur
2. Allez dans le **Dashboard Administrateur** (`/admin`)
3. Cliquez sur **"Ajouter une compagnie"**
4. Ajoutez les compagnies suivantes :
   - **Allianz**
   - **Courtage**

### Option 2 : Directement dans Firestore

Si vous préférez ajouter les compagnies directement dans la console Firebase :

1. Allez dans la console Firebase : https://console.firebase.google.com
2. Sélectionnez votre projet
3. Allez dans **Firestore Database**
4. Créez une collection appelée `companies` (si elle n'existe pas)
5. Ajoutez deux documents avec les données suivantes :

**Document 1 :**
```
name: "Allianz"
active: true
createdAt: [timestamp courant]
```

**Document 2 :**
```
name: "Courtage"
active: true
createdAt: [timestamp courant]
```

## Structure des données

Chaque compagnie dans Firestore contient :

```typescript
{
  id: string;              // ID généré par Firestore
  name: string;           // Nom de la compagnie (ex: "Allianz", "Courtage")
  active: boolean;        // Active ou inactive
  createdAt: Date;         // Date de création
}
```

## Fonctionnalités

### Pour les administrateurs

- ✅ **Voir toutes les compagnies** : Liste complète avec statut
- ✅ **Ajouter une compagnie** : Dialog d'ajout avec validation
- ✅ **Modifier une compagnie** : Changement du nom
- ✅ **Désactiver/Activer** : Toggle du statut
- ✅ **Supprimer** : Suppression avec confirmation
- ✅ **Compteur** : Affichage du nombre total et actif

### Pour les commerciaux

- ✅ Les compagnies **actives** sont automatiquement chargées dans le select
- ✅ Le select affiche toutes les compagnies enregistrées et actives
- ✅ Plus besoin de hardcoder les valeurs

## Validation

- Le nom de la compagnie est requis
- Les doublons sont détectés (insensible à la casse)
- Seules les compagnies actives apparaissent dans le formulaire de saisie

## Migration depuis les valeurs hardcodées

Le système bascule automatiquement de :
- ❌ Avant : Compagnies hardcodées dans `COMPANIES = [...]`
- ✅ Maintenant : Compagnies dynamiques chargées depuis Firestore

Toutes les compagnies ajoutées via l'interface admin sont immédiatement disponibles pour la saisie des actes.

