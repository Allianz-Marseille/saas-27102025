# Modales de Saisie et Modification des Actes - Commerciaux

## Vue d'ensemble

Ce document décrit le comportement des modales de **saisie (création)** et de **modification** des actes selon le type d'acte (AN, M+3, PRETERME_AUTO, PRETERME_IRD) et le rôle de l'utilisateur (Commercial vs Administrateur).

### Portée des fonctionnalités

Les fonctionnalités décrites dans ce document s'appliquent aux **modales de saisie** (création d'un nouvel acte) et aux **modales de modification** (édition d'un acte existant) pour les types d'actes suivants :
- ✅ **AN** (Apport Nouveau)
- ✅ **M+3**
- ✅ **PRETERME_AUTO**
- ✅ **PRETERME_IRD**

## Types d'actes

### AN - Apport Nouveau
Acte complet avec toutes les informations contractuelles.

### M+3
Acte de suivi (process) sans numéro de contrat. Suivi du processus d'appel téléphonique client avec validation par tags.

### PRETERME_AUTO
Préterme Auto avec numéro de contrat obligatoire. Suivi du processus d'appel téléphonique client avec validation par tags.

### PRETERME_IRD
Préterme IRD avec numéro de contrat obligatoire. Suivi du processus d'appel téléphonique client avec validation par tags.

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
- ✅ **Tags de suivi d'appel** (workflow d'appel téléphonique) - Disponible en saisie et modification

**Pour M+3 :**
- ✅ Nom du client
- ✅ Note
- ✅ **Tags de suivi d'appel** (workflow d'appel téléphonique)
- ❌ Numéro de contrat (non applicable)

**Pour PRETERME_AUTO / PRETERME_IRD :**
- ✅ Nom du client
- ✅ Note
- ✅ **Numéro de contrat** (modifiable par les commerciaux avant le 15)
- ✅ **Tags de suivi d'appel** (workflow d'appel téléphonique) - Disponible en saisie et modification

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
- ✅ **Tags de suivi d'appel** (workflow d'appel téléphonique) - Disponible en saisie et modification

**Pour M+3 :**
- ✅ Nom du client
- ✅ Note
- ✅ **Tags de suivi d'appel** (workflow d'appel téléphonique)
- ❌ Numéro de contrat (non applicable)

**Pour PRETERME_AUTO / PRETERME_IRD :**
- ✅ Nom du client
- ✅ **Numéro de contrat** (modifiable uniquement par les admins)
- ✅ Note
- ✅ **Tags de suivi d'appel** (workflow d'appel téléphonique) - Disponible en saisie et modification

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
- Tags de suivi : Optionnels (workflow progressif) - Disponible en saisie et modification

**Pour M+3 :**
- Nom du client : ✅ Obligatoire
- Note : Optionnelle
- Tags de suivi : Optionnels (workflow progressif) - Disponible en saisie et modification

---

## Modales de saisie (création) vs Modification

### Disponibilité des tags de suivi

Les **tags de suivi d'appel téléphonique** sont disponibles dans **deux contextes** :

1. **Modale de saisie (création)** : Lors de la création d'un nouvel acte
   - Les tags peuvent être définis dès la création de l'acte
   - Disponible pour : AN, M+3, PRETERME_AUTO, PRETERME_IRD
   - Permet de suivre le workflow dès le début

2. **Modale de modification** : Lors de l'édition d'un acte existant
   - Les tags peuvent être mis à jour ou complétés
   - Disponible pour : AN, M+3, PRETERME_AUTO, PRETERME_IRD
   - Permet de continuer ou modifier le workflow en cours

### Comportement identique

Le comportement des tags est **identique** dans les deux modales :
- Même affichage conditionnel (étapes suivantes visibles uniquement si étape précédente = OK)
- Mêmes règles de validation
- Mêmes permissions par rôle
- Même structure de stockage

---

## Workflow de suivi AN - Appel téléphonique

### Vue d'ensemble

Pour les actes de type **AN** (Apport Nouveau), un système de tags permet de suivre le processus d'appel téléphonique au client. Le workflow est identique à celui des M+3 et PRETERME.

### Étapes du workflow

Le processus suit un chemin logique avec des validations par tags :

#### Étape 1 : Appel téléphonique
- **Tag disponible** : `appelTelephonique`
- **Valeurs possibles** : `OK` / `KO`
- **Description** : Indique si le client a été joint au téléphone
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (client non joint)
  - Si `OK` → Passage à l'étape suivante

#### Étape 2 : Mise à jour fiche Lagoon
- **Tag disponible** : `miseAJourFicheLagoon`
- **Valeurs possibles** : `OK` / `KO`
- **Condition d'accès** : Uniquement si `appelTelephonique = OK`
- **Description** : Indique si la fiche client a été mise à jour dans Lagoon
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (fiche non mise à jour)
  - Si `OK` → Passage à l'étape suivante

#### Étape 3 : Bilan effectué
- **Tag disponible** : `bilanEffectue`
- **Valeurs possibles** : `OK` / `KO`
- **Condition d'accès** : Uniquement si `miseAJourFicheLagoon = OK`
- **Description** : Indique si un bilan a pu être réalisé avec le client
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (bilan non effectué)
  - Si `OK` → Processus complété avec succès

### Interface utilisateur

#### Affichage des tags dans la modale

Dans la modale de **saisie** (création) et de **modification** d'un acte AN, les tags sont affichés sous forme de **badges cliquables** :

1. **Badge "Appel téléphonique"**
   - Toujours visible
   - États possibles :
     - Non défini : Badge gris avec texte "Appel téléphonique" + icône téléphone
     - OK : Badge vert avec texte "Appel téléphonique : OK"
     - KO : Badge rouge avec texte "Appel téléphonique : KO"

2. **Badge "Mise à jour fiche Lagoon"**
   - Visible uniquement si `appelTelephonique = OK`
   - États possibles :
     - Non défini : Badge gris avec texte "Mise à jour fiche Lagoon" + icône document
     - OK : Badge vert avec texte "Mise à jour fiche Lagoon : OK"
     - KO : Badge rouge avec texte "Mise à jour fiche Lagoon : KO"

3. **Badge "Bilan effectué"**
   - Visible uniquement si `miseAJourFicheLagoon = OK`
   - États possibles :
     - Non défini : Badge gris avec texte "Bilan effectué" + icône check
     - OK : Badge vert avec texte "Bilan effectué : OK"
     - KO : Badge rouge avec texte "Bilan effectué : KO"

### Stockage des données

Les tags sont stockés dans l'objet acte avec la structure suivante :

```typescript
{
  // ... autres champs de l'acte
  anSuivi?: {
    appelTelephonique?: "OK" | "KO";
    miseAJourFicheLagoon?: "OK" | "KO";
    bilanEffectue?: "OK" | "KO";
  };
}
```

---

## Workflow de suivi M+3 - Appel téléphonique

### Vue d'ensemble

Pour les actes de type **M+3**, un système de tags permet de suivre le processus d'appel téléphonique au client. Le workflow est séquentiel et conditionnel.

### Étapes du workflow

Le processus suit un chemin logique avec des validations par tags :

#### Étape 1 : Appel téléphonique
- **Tag disponible** : `appelTelephonique`
- **Valeurs possibles** : `OK` / `KO`
- **Description** : Indique si le client a été joint au téléphone
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (client non joint)
  - Si `OK` → Passage à l'étape suivante

#### Étape 2 : Mise à jour fiche Lagoon
- **Tag disponible** : `miseAJourFicheLagoon`
- **Valeurs possibles** : `OK` / `KO`
- **Condition d'accès** : Uniquement si `appelTelephonique = OK`
- **Description** : Indique si la fiche client a été mise à jour dans Lagoon
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (fiche non mise à jour)
  - Si `OK` → Passage à l'étape suivante

#### Étape 3 : Bilan effectué
- **Tag disponible** : `bilanEffectue`
- **Valeurs possibles** : `OK` / `KO`
- **Condition d'accès** : Uniquement si `miseAJourFicheLagoon = OK`
- **Description** : Indique si un bilan a pu être réalisé avec le client
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (bilan non effectué)
  - Si `OK` → Processus complété avec succès

### Interface utilisateur

#### Affichage des tags dans la modale

Dans la modale de **saisie** (création) et de **modification** d'un acte M+3, les tags sont affichés sous forme de **badges cliquables** :

1. **Badge "Appel téléphonique"**
   - Toujours visible
   - États possibles :
     - Non défini : Badge gris avec texte "Appel téléphonique" + icône téléphone
     - OK : Badge vert avec texte "Appel téléphonique : OK"
     - KO : Badge rouge avec texte "Appel téléphonique : KO"

2. **Badge "Mise à jour fiche Lagoon"**
   - Visible uniquement si `appelTelephonique = OK`
   - États possibles :
     - Non défini : Badge gris avec texte "Mise à jour fiche Lagoon" + icône document
     - OK : Badge vert avec texte "Mise à jour fiche Lagoon : OK"
     - KO : Badge rouge avec texte "Mise à jour fiche Lagoon : KO"

3. **Badge "Bilan effectué"**
   - Visible uniquement si `miseAJourFicheLagoon = OK`
   - États possibles :
     - Non défini : Badge gris avec texte "Bilan effectué" + icône check
     - OK : Badge vert avec texte "Bilan effectué : OK"
     - KO : Badge rouge avec texte "Bilan effectué : KO"

#### Interaction avec les tags

- **Clic sur un badge** : Ouvre un menu contextuel ou un sélecteur pour choisir entre `OK` et `KO`
- **Validation** : Le tag est mis à jour immédiatement dans la base de données
- **Affichage conditionnel** : Les étapes suivantes n'apparaissent que si l'étape précédente est à `OK`

### Règles de validation

1. **Séquence obligatoire** : Les étapes doivent être validées dans l'ordre
2. **Pas de retour en arrière** : Une fois une étape validée, elle ne peut pas être modifiée (sauf par un administrateur)
3. **Arrêt du processus** : Si une étape est marquée `KO`, les étapes suivantes ne sont pas accessibles
4. **Réinitialisation** : Seuls les administrateurs peuvent réinitialiser les tags

### Exemples de workflows

#### Workflow complet (succès)
```
1. Appel téléphonique : OK ✅
2. Mise à jour fiche Lagoon : OK ✅
3. Bilan effectué : OK ✅
→ Processus complété
```

#### Workflow interrompu (client non joint)
```
1. Appel téléphonique : KO ❌
→ Processus arrêté
```

#### Workflow interrompu (fiche non mise à jour)
```
1. Appel téléphonique : OK ✅
2. Mise à jour fiche Lagoon : KO ❌
→ Processus arrêté
```

#### Workflow interrompu (bilan non effectué)
```
1. Appel téléphonique : OK ✅
2. Mise à jour fiche Lagoon : OK ✅
3. Bilan effectué : KO ❌
→ Processus arrêté
```

### Permissions par rôle

#### Commerciaux
- ✅ Peuvent définir les tags dans l'ordre du workflow
- ✅ Peuvent marquer une étape comme `OK` ou `KO`
- ❌ Ne peuvent pas modifier une étape déjà validée
- ❌ Ne peuvent pas réinitialiser les tags

#### Administrateurs
- ✅ Peuvent définir les tags dans l'ordre du workflow
- ✅ Peuvent marquer une étape comme `OK` ou `KO`
- ✅ Peuvent modifier une étape déjà validée
- ✅ Peuvent réinitialiser tous les tags
- ✅ Peuvent accéder à toutes les étapes indépendamment de l'état précédent

### Stockage des données

Les tags sont stockés dans l'objet acte avec la structure suivante :

```typescript
{
  // ... autres champs de l'acte
  m3Suivi?: {
    appelTelephonique?: "OK" | "KO";
    miseAJourFicheLagoon?: "OK" | "KO";
    bilanEffectue?: "OK" | "KO";
  };
}
```

### Historique et logs

- Chaque modification de tag est enregistrée dans le système de logs
- L'historique des changements de tags est traçable
- Les logs incluent : utilisateur, date/heure, tag modifié, ancienne valeur, nouvelle valeur

---

## Workflow de suivi PRETERME - Appel téléphonique

### Vue d'ensemble

Pour les actes de type **PRETERME_AUTO** et **PRETERME_IRD**, un système de tags permet de suivre le processus d'appel téléphonique au client. Le workflow est identique à celui des M+3 et suit un chemin logique avec des validations par tags.

### Étapes du workflow

Le processus suit un chemin logique avec des validations par tags :

#### Étape 1 : Appel téléphonique
- **Tag disponible** : `appelTelephonique`
- **Valeurs possibles** : `OK` / `KO`
- **Description** : Indique si le client a été joint au téléphone
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (client non joint)
  - Si `OK` → Passage à l'étape suivante

#### Étape 2 : Mise à jour fiche Lagoon
- **Tag disponible** : `miseAJourFicheLagoon`
- **Valeurs possibles** : `OK` / `KO`
- **Condition d'accès** : Uniquement si `appelTelephonique = OK`
- **Description** : Indique si la fiche client a été mise à jour dans Lagoon
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (fiche non mise à jour)
  - Si `OK` → Passage à l'étape suivante

#### Étape 3 : Bilan effectué
- **Tag disponible** : `bilanEffectue`
- **Valeurs possibles** : `OK` / `KO`
- **Condition d'accès** : Uniquement si `miseAJourFicheLagoon = OK`
- **Description** : Indique si un bilan a pu être réalisé avec le client
- **Comportement** :
  - Si `KO` → Le processus s'arrête ici (bilan non effectué)
  - Si `OK` → Processus complété avec succès

### Interface utilisateur

#### Affichage des tags dans la modale

Dans la modale de **saisie** (création) et de **modification** d'un acte PRETERME, les tags sont affichés sous forme de **badges cliquables** :

1. **Badge "Appel téléphonique"**
   - Toujours visible
   - États possibles :
     - Non défini : Badge gris avec texte "Appel téléphonique" + icône téléphone
     - OK : Badge vert avec texte "Appel téléphonique : OK"
     - KO : Badge rouge avec texte "Appel téléphonique : KO"

2. **Badge "Mise à jour fiche Lagoon"**
   - Visible uniquement si `appelTelephonique = OK`
   - États possibles :
     - Non défini : Badge gris avec texte "Mise à jour fiche Lagoon" + icône document
     - OK : Badge vert avec texte "Mise à jour fiche Lagoon : OK"
     - KO : Badge rouge avec texte "Mise à jour fiche Lagoon : KO"

3. **Badge "Bilan effectué"**
   - Visible uniquement si `miseAJourFicheLagoon = OK`
   - États possibles :
     - Non défini : Badge gris avec texte "Bilan effectué" + icône check
     - OK : Badge vert avec texte "Bilan effectué : OK"
     - KO : Badge rouge avec texte "Bilan effectué : KO"

#### Interaction avec les tags

- **Clic sur un badge** : Ouvre un menu contextuel ou un sélecteur pour choisir entre `OK` et `KO`
- **Validation** : Le tag est mis à jour immédiatement dans la base de données
- **Affichage conditionnel** : Les étapes suivantes n'apparaissent que si l'étape précédente est à `OK`

### Règles de validation

1. **Séquence obligatoire** : Les étapes doivent être validées dans l'ordre
2. **Pas de retour en arrière** : Une fois une étape validée, elle ne peut pas être modifiée (sauf par un administrateur)
3. **Arrêt du processus** : Si une étape est marquée `KO`, les étapes suivantes ne sont pas accessibles
4. **Réinitialisation** : Seuls les administrateurs peuvent réinitialiser les tags

### Exemples de workflows

#### Workflow complet (succès)
```
1. Appel téléphonique : OK ✅
2. Mise à jour fiche Lagoon : OK ✅
3. Bilan effectué : OK ✅
→ Processus complété
```

#### Workflow interrompu (client non joint)
```
1. Appel téléphonique : KO ❌
→ Processus arrêté
```

#### Workflow interrompu (fiche non mise à jour)
```
1. Appel téléphonique : OK ✅
2. Mise à jour fiche Lagoon : KO ❌
→ Processus arrêté
```

#### Workflow interrompu (bilan non effectué)
```
1. Appel téléphonique : OK ✅
2. Mise à jour fiche Lagoon : OK ✅
3. Bilan effectué : KO ❌
→ Processus arrêté
```

### Permissions par rôle

#### Commerciaux
- ✅ Peuvent définir les tags dans l'ordre du workflow
- ✅ Peuvent marquer une étape comme `OK` ou `KO`
- ❌ Ne peuvent pas modifier une étape déjà validée
- ❌ Ne peuvent pas réinitialiser les tags

#### Administrateurs
- ✅ Peuvent définir les tags dans l'ordre du workflow
- ✅ Peuvent marquer une étape comme `OK` ou `KO`
- ✅ Peuvent modifier une étape déjà validée
- ✅ Peuvent réinitialiser tous les tags
- ✅ Peuvent accéder à toutes les étapes indépendamment de l'état précédent

### Stockage des données

Les tags sont stockés dans l'objet acte avec la structure suivante :

```typescript
{
  // ... autres champs de l'acte
  pretermeSuivi?: {
    appelTelephonique?: "OK" | "KO";
    miseAJourFicheLagoon?: "OK" | "KO";
    bilanEffectue?: "OK" | "KO";
  };
}
```

### Historique et logs

- Chaque modification de tag est enregistrée dans le système de logs
- L'historique des changements de tags est traçable
- Les logs incluent : utilisateur, date/heure, tag modifié, ancienne valeur, nouvelle valeur

### Différences avec M+3

- **Numéro de contrat** : Les prétermes ont un numéro de contrat obligatoire (contrairement aux M+3)
- **Structure de stockage** : Les tags sont stockés dans `pretermeSuivi` au lieu de `m3Suivi`
- **Workflow identique** : Le processus de suivi d'appel est exactement le même

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

- `components/acts/new-act-dialog.tsx` : Composant principal de la modale de saisie (création)
- `components/acts/edit-act-dialog.tsx` : Composant principal de la modale de modification
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

### À venir
- 🔄 Implémentation du workflow de suivi AN avec tags d'appel téléphonique (appelTelephonique, miseAJourFicheLagoon, bilanEffectue) - Disponible en saisie et modification
- 🔄 Implémentation du workflow de suivi M+3 avec tags d'appel téléphonique (appelTelephonique, miseAJourFicheLagoon, bilanEffectue) - Disponible en saisie et modification
- 🔄 Implémentation du workflow de suivi PRETERME (AUTO et IRD) avec tags d'appel téléphonique (appelTelephonique, miseAJourFicheLagoon, bilanEffectue) - Disponible en saisie et modification

---

## Notes importantes

1. **Numéro de contrat** : Champ critique qui ne peut être modifié que par les administrateurs
2. **Restrictions temporelles** : Basées sur la date de saisie de l'acte, pas sur la date d'effet
3. **Logs** : Toutes les modifications sont enregistrées dans le système de logs
4. **Sécurité** : Les règles Firestore empêchent les modifications non autorisées au niveau de la base de données

