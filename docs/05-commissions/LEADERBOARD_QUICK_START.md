# Guide Rapide - Leaderboard

## 🎯 Qu'est-ce que le Leaderboard ?

Le leaderboard affiche les classements des commerciaux pour :
- **Commissions potentielles** : Top 3 des commerciaux avec le plus de commissions
- **Process** : Top 3 des commerciaux avec le plus de M+3 et prétermés

Ces données sont stockées dans la collection Firestore `leaderboard` pour optimiser les performances.

---

## 🚀 Mise à Jour Automatique

Le leaderboard se met à jour **automatiquement tous les jours à 2h00 UTC** via un cron job Vercel.

### Prérequis pour l'automatisation

La variable d'environnement `CRON_SECRET` doit être configurée dans Vercel :

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Ouvrez votre projet → **Settings** → **Environment Variables**
3. Ajoutez `CRON_SECRET` avec une clé aléatoire sécurisée

---

## 🔧 Mise à Jour Manuelle

### Quand régénérer le leaderboard manuellement ?

- Après un import massif d'actes
- Si les classements ne s'affichent pas dans le dashboard
- Pour initialiser les données d'un nouveau mois
- Pour corriger des incohérences

### Comment régénérer ?

#### Option 1 : Script npm (recommandé)

```bash
# Mois en cours
npm run generate-leaderboard

# Mois spécifique
npm run generate-leaderboard 2025-11
npm run generate-leaderboard 2025-10
```

#### Option 2 : Script direct

```bash
npx ts-node --project tsconfig.scripts.json scripts/generate-leaderboard.ts 2025-11
```

### Sortie attendue

```
📊 Génération du leaderboard pour 2025-11...
   ✓ 7 commerciaux trouvés
   ✓ 385 actes trouvés
   - Joelle: 112 actes, 1330€, 59 process, 28941€ CA
   - Astrid: 53 actes, 830€, 19 process, 13089€ CA
   - Donia: 71 actes, 700€, 44 process, 15301€ CA
   ...

✅ Leaderboard mis à jour: 7 entrées
```

---

## 📊 Visualisation dans le Dashboard

Une fois le leaderboard généré, les commerciaux verront :

### Commissions Potentielles
- Leur position actuelle
- Le montant de leurs commissions
- L'écart avec le 1er
- La progression vers l'objectif (800€)
- Le Top 3 du mois avec médailles 🥇🥈🥉

### Classement Process
- Leur nombre de process (M+3, prétermés)
- Leur moyenne par jour
- L'écart avec le 1er
- Le Top 3 du mois

---

## 🔍 Vérification

### Dans Firestore

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Ouvrez **Firestore Database**
3. Collection `leaderboard`
4. Vérifiez qu'il y a des documents avec :
   - `monthKey`: "2025-11" (mois actuel)
   - `commissions`, `process`, `ca`, `actsCount`
   - `lastUpdated` récent

### Dans le Dashboard

1. Connectez-vous en tant que commercial
2. Allez sur le Dashboard (`/dashboard`)
3. Scrollez jusqu'aux sections "Commissions potentielles" et "Classement Process"
4. Vous devriez voir :
   - Votre position avec avatar
   - Vos statistiques
   - Le Top 3 des commerciaux

---

## ⚠️ Dépannage

### "Aucune donnée disponible"

**Cause** : La collection `leaderboard` est vide pour le mois en cours.

**Solution** :
```bash
npm run generate-leaderboard
```

### Les données ne sont pas à jour

**Cause 1** : Le cron job n'a pas été exécuté (CRON_SECRET manquante)

**Solution** : Configurer `CRON_SECRET` dans Vercel et attendre le prochain cron (2h UTC)

**Cause 2** : Des actes ont été ajoutés récemment

**Solution** : Régénérer manuellement le leaderboard

### Erreur "getAllCommercialsKPI is deprecated"

**Statut** : ✅ Corrigé

Le composant `LeaderboardWidget` utilise maintenant la fonction optimisée `getLeaderboard()` qui lit directement la collection `leaderboard` au lieu de recalculer tous les KPIs.

---

## 📈 Performance

### Avant (getAllCommercialsKPI)
- ❌ Lit tous les actes de tous les commerciaux (ex: 385 documents)
- ❌ Calcule les KPIs à chaque chargement
- ❌ Lent pour de nombreux commerciaux/actes

### Après (getLeaderboard)
- ✅ Lit uniquement la collection `leaderboard` (7 documents)
- ✅ Données pré-calculées
- ✅ Rapide quelle que soit la quantité d'actes

---

## 🔐 Sécurité

### Collection Firestore Rules

La collection `leaderboard` devrait être accessible en lecture par tous les commerciaux authentifiés :

```javascript
match /leaderboard/{leaderboardId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "CDC_COMMERCIAL";
  allow write: if false; // Seuls les scripts admin peuvent écrire
}
```

---

## 📚 Ressources

- **Script de génération** : `scripts/generate-leaderboard.ts`
- **API Cron** : `app/api/cron/update-leaderboard/route.ts`
- **Collection Firestore** : `leaderboard`
- **Composants** :
  - `components/dashboard/leaderboard-widget.tsx`
  - `components/dashboard/process-leaderboard-widget.tsx`
- **Documentation complète** : `docs/LEADERBOARD_AUTO_UPDATE.md`

---

## ✅ Checklist de Configuration

Pour un nouveau déploiement :

- [ ] Variable `CRON_SECRET` configurée dans Vercel
- [ ] `vercel.json` avec la config du cron job
- [ ] Script de génération exécuté au moins une fois
- [ ] Firestore Rules configurées pour la collection `leaderboard`
- [ ] Test du cron job via l'API route
- [ ] Vérification du leaderboard dans le dashboard commercial

---

**Dernière mise à jour** : Novembre 2025

