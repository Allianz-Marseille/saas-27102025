# Modales de Modification des Actes - Commerciaux

## Vue d'ensemble

Ce document décrit le comportement des modales de modification des actes selon le type d'acte (AN, M+3, PRETERME_AUTO, PRETERME_IRD) et le rôle de l'utilisateur (Commercial vs Administrateur).

## Types d'actes

### AN - Apport Nouveau
Acte complet avec toutes les informations contractuelles.

### M+3
Acte de suivi (process) sans numéro de contrat.

### PRETERME_AUTO
Préterme Auto avec numéro de contrat obligatoire.

### PRETERME_IRD
Préterme IRD avec numéro de contrat obligatoire.

---

## Règles de modification par rôle

### Commerciaux (CDC_COMMERCIAL)

#### Restrictions temporelles
- **Jusqu'au 15 du mois suivant** : Les commerciaux peuvent modifier **tous les champs** de leurs actes
- **Après le 15 du mois suivant** : Tous les champs sont **bloqués** (affichage d'un badge "Bloqué pour les commerciaux")
- Exemple : Le 15 février, les actes de janvier sont bloqués pour les commerciaux

#### Champs modifiables (avant le 15)

**Pour AN :**
- ✅ Nom du client
- ✅ Type de contrat
- ✅ Compagnie
- ✅ Date d'effet
- ✅ Prime annuelle
- ✅ Montant versé (pour VIE_PU)
- ✅ Note
- ✅ **Numéro de contrat** (modifiable par les commerciaux avant le 15)

**Pour M+3 :**
- ✅ Nom du client
- ✅ Note
- ❌ Numéro de contrat (non applicable)

**Pour PRETERME_AUTO / PRETERME_IRD :**
- ✅ Nom du client
- ✅ Note
- ✅ **Numéro de contrat** (modifiable par les commerciaux avant le 15)

---

### Administrateurs (ADMINISTRATEUR)

#### Aucune restriction temporelle
- Les administrateurs peuvent modifier **tous les champs** à **tout moment**, même après le 15 du mois suivant
- Aucun badge de blocage n'est affiché pour les administrateurs

#### Champs modifiables (toujours)

**Pour AN :**
- ✅ Nom du client
- ✅ **Numéro de contrat** (modifiable uniquement par les admins)
- ✅ Type de contrat
- ✅ Compagnie
- ✅ Date d'effet
- ✅ Prime annuelle
- ✅ Montant versé (pour VIE_PU)
- ✅ Note

**Pour M+3 :**
- ✅ Nom du client
- ✅ Note
- ❌ Numéro de contrat (non applicable)

**Pour PRETERME_AUTO / PRETERME_IRD :**
- ✅ Nom du client
- ✅ **Numéro de contrat** (modifiable uniquement par les admins)
- ✅ Note

---

## Validation et vérifications

### Vérification d'unicité du numéro de contrat

**Pour les AN :**
- Lorsqu'un administrateur modifie le numéro de contrat d'un AN, le système vérifie que le nouveau numéro n'existe pas déjà dans la base de données
- Si le numéro existe déjà, une erreur est affichée : "Ce numéro de contrat est déjà enregistré"
- La modification est annulée

**Pour les PRETERME :**
- Le numéro de contrat peut être modifié librement par les administrateurs
- Aucune vérification d'unicité (les prétermes peuvent avoir le même numéro de contrat)

### Validation des champs obligatoires

**Pour AN :**
- Nom du client : ✅ Obligatoire
- Type de contrat : ✅ Obligatoire
- Compagnie : ✅ Obligatoire
- Date d'effet : ✅ Obligatoire
- Numéro de contrat : ✅ Obligatoire (mais non modifiable par les commerciaux)

**Pour PRETERME_AUTO / PRETERME_IRD :**
- Nom du client : ✅ Obligatoire
- Note : ✅ Obligatoire
- Numéro de contrat : ✅ Obligatoire (modifiable uniquement par les admins)

**Pour M+3 :**
- Nom du client : ✅ Obligatoire
- Note : Optionnelle

---

## Interface utilisateur

### Badge de blocage
- Un badge orange "🔒 Bloqué pour les commerciaux" s'affiche dans le titre de la modale lorsque l'acte est verrouillé pour les commerciaux
- Ce badge n'apparaît jamais pour les administrateurs

### États des champs

**Pour les commerciaux (acte bloqué) :**
- Tous les champs sont désactivés (`disabled={true}`)
- Style visuel : fond gris (`bg-muted`)
- Le bouton "Enregistrer" est désactivé

**Pour les administrateurs :**
- Tous les champs sont activés
- Le numéro de contrat est modifiable (pour AN et PRETERME)
- Le bouton "Enregistrer" est toujours actif

### Messages d'aide

**Numéro de contrat (pour les commerciaux) :**
```
Le numéro de contrat ne peut pas être modifié par les commerciaux
```

**Numéro de contrat (pour les administrateurs) :**
```
Modifiable uniquement par les administrateurs
```

---

## Implémentation technique

### Fichiers concernés

- `components/acts/edit-act-dialog.tsx` : Composant principal de la modale
- `lib/utils/act-lock.ts` : Fonction de vérification du blocage temporel
- `lib/utils/roles.ts` : Fonction de vérification du rôle administrateur
- `firestore.rules` : Règles de sécurité Firestore

### Logique de blocage

```typescript
const userIsAdmin = isAdmin(userData);
const isLocked = checkActLocked(act, userData);
// Les admins peuvent toujours modifier, même si l'acte est bloqué
const canEdit = userIsAdmin || !isLocked;
```

### Règles Firestore

```javascript
match /acts/{actId} {
  allow update: if isAdmin() || (isCDC() && resource.data.userId == request.auth.uid);
}
```

Les administrateurs peuvent modifier n'importe quel acte, les commerciaux uniquement leurs propres actes.

---

## Cas d'usage

### Cas 1 : Commercial modifie un acte avant le 15
- ✅ Tous les champs sont modifiables (sauf numéro de contrat)
- ✅ Modification enregistrée avec succès

### Cas 2 : Commercial tente de modifier un acte après le 15
- ❌ Tous les champs sont désactivés
- ❌ Le bouton "Enregistrer" est désactivé
- ℹ️ Badge "Bloqué pour les commerciaux" affiché

### Cas 3 : Admin modifie un acte après le 15
- ✅ Tous les champs sont modifiables (y compris numéro de contrat)
- ✅ Modification enregistrée avec succès
- ℹ️ Aucun badge de blocage

### Cas 4 : Admin modifie le numéro de contrat d'un AN
- ✅ Le numéro de contrat est modifiable
- ✅ Vérification d'unicité effectuée
- ✅ Si le numéro existe déjà, erreur affichée et modification annulée

---

## Historique des modifications

### Version actuelle
- ✅ Ajout de la possibilité pour les admins de modifier le numéro de contrat (AN et PRETERME)
- ✅ Implémentation des restrictions temporelles pour les commerciaux
- ✅ Vérification d'unicité du numéro de contrat pour les AN
- ✅ Désactivation des champs pour les commerciaux après le 15 du mois suivant

---

## Notes importantes

1. **Numéro de contrat** : Champ critique qui ne peut être modifié que par les administrateurs
2. **Restrictions temporelles** : Basées sur la date de saisie de l'acte, pas sur la date d'effet
3. **Logs** : Toutes les modifications sont enregistrées dans le système de logs
4. **Sécurité** : Les règles Firestore empêchent les modifications non autorisées au niveau de la base de données

