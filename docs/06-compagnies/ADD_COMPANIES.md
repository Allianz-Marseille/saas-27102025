# Ajouter Allianz et Courtage

## Méthode rapide via l'interface

### Étape 1 : Ajouter Allianz
1. Dans le dashboard admin (`/admin`), cliquez sur **"+ Ajouter une compagnie"**
2. Dans le champ "Nom de la compagnie", tapez : **Allianz**
3. Cliquez sur **"Ajouter"**

### Étape 2 : Ajouter Courtage
1. Toujours dans le dashboard admin, cliquez à nouveau sur **"+ Ajouter une compagnie"**
2. Dans le champ "Nom de la compagnie", tapez : **Courtage**
3. Cliquez sur **"Ajouter"**

### Résultat attendu

Votre liste de compagnies devrait contenir :
- ✅ **Allianz** (active)
- ✅ **Courtage** (active)
- Axa (si vous l'avez ajouté)

Dans la modale de saisie d'actes, vous verrez :
1. **Allianz** (toujours en premier)
2. Courtage (ou tout autre ordre alphabétique)
3. Axa (ou toute autre compagnie active)

## Importante

Les compagnies doivent être ajoutées **manuellement** via l'interface :
- Elles ne sont **pas créées automatiquement**
- Elles ne sont **pas hardcodées**
- Elles proviennent **uniquement de Firestore** via le dashboard admin

## Ordre d'affichage

Dans la liste du dashboard admin : **ordre alphabétique**

Dans le select de la modale de saisie :
1. **Allianz** (toujours en premier) ⭐
2. Puis les autres compagnies par ordre alphabétique

