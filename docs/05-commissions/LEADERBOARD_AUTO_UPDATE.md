# Mise à Jour Automatique du Leaderboard

Ce document explique comment configurer la mise à jour automatique quotidienne du leaderboard.

---

## 🚀 Solution 1 : Vercel Cron Job (Recommandé)

### Configuration

Le cron job est déjà configuré dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/update-leaderboard",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Planning** : Tous les jours à 2h00 du matin (UTC)

### Étapes de déploiement

#### 1. Générer une clé secrète

Générez une clé aléatoire sécurisée :

```bash
# Sur Mac/Linux
openssl rand -base64 32

# Ou utilisez un générateur en ligne
https://generate-secret.vercel.app/32
```

#### 2. Ajouter la variable d'environnement dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Ouvrez votre projet
3. **Settings** → **Environment Variables**
4. Ajoutez :
   - **Name** : `CRON_SECRET`
   - **Value** : [votre clé générée]
   - **Environment** : Production, Preview, Development ✅

#### 3. Déployer

```bash
git add .
git commit -m "feat: add automatic leaderboard update with Vercel Cron"
git push origin corrections_codex
```

Vercel va automatiquement :
- ✅ Détecter le fichier `vercel.json`
- ✅ Configurer le cron job
- ✅ Exécuter `/api/cron/update-leaderboard` tous les jours à 2h00 UTC

#### 4. Vérifier

Dans Vercel Dashboard :
1. Allez dans **Deployments** → **Functions**
2. Vous devriez voir le cron job configuré
3. Consultez les logs pour vérifier les exécutions

---

## 🔧 Solution 2 : Service Externe (GitHub Actions, etc.)

Si vous n'utilisez pas Vercel, vous pouvez appeler l'API route depuis un service externe.

### GitHub Actions

Créez `.github/workflows/update-leaderboard.yml` :

```yaml
name: Update Leaderboard

on:
  schedule:
    # Tous les jours à 2h00 UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Permet déclenchement manuel

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Call API to update leaderboard
        run: |
          curl -X POST https://votre-app.vercel.app/api/cron/update-leaderboard \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Ajoutez `CRON_SECRET` dans GitHub Secrets.

---

## 📊 Fonctionnement

L'API route `/api/cron/update-leaderboard` :

1. ✅ Vérifie l'autorisation (clé secrète)
2. ✅ Récupère tous les commerciaux actifs
3. ✅ Récupère tous les actes du mois en cours
4. ✅ Calcule les KPIs pour chaque commercial
5. ✅ Met à jour ou crée les entrées dans `leaderboard`
6. ✅ Retourne un résumé de l'opération

### Logs typiques

```
[CRON] Mise à jour du leaderboard pour 2025-11...
[CRON] 7 commerciaux trouvés
[CRON] 385 actes trouvés
[CRON] Leaderboard mis à jour: 7 entrées
```

---

## 🔒 Sécurité

### Protection par clé secrète

L'API route vérifie un header `Authorization` :

```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}
```

**Important** :
- ⚠️ Ne commitez JAMAIS la clé secrète dans Git
- ✅ Utilisez toujours des variables d'environnement
- ✅ Générez une clé longue et aléatoire (32+ caractères)

---

## 🧪 Test manuel

Pour tester le cron job manuellement :

```bash
curl -X POST http://localhost:3000/api/cron/update-leaderboard \
  -H "Authorization: Bearer votre_cron_secret"
```

Ou en production :

```bash
curl -X POST https://votre-app.vercel.app/api/cron/update-leaderboard \
  -H "Authorization: Bearer votre_cron_secret"
```

**Réponse attendue** :

```json
{
  "success": true,
  "monthKey": "2025-11",
  "commercialsCount": 7,
  "actsCount": 385,
  "updatedCount": 7
}
```

---

## ⏰ Modifier le planning

Le planning du cron job est défini en format cron dans `vercel.json` :

```
"schedule": "0 2 * * *"
```

### Exemples

| Planning | Description |
|----------|-------------|
| `0 2 * * *` | Tous les jours à 2h00 UTC |
| `0 */6 * * *` | Toutes les 6 heures |
| `0 0 * * 0` | Tous les dimanches à minuit |
| `*/30 * * * *` | Toutes les 30 minutes |

**Format** : `minute heure jour mois jour_semaine`

---

## 📈 Monitoring

### Logs Vercel

1. Vercel Dashboard → **Deployments**
2. Cliquez sur un déploiement
3. **Functions** → Consultez les logs de `/api/cron/update-leaderboard`

### Logs Firebase

Dans Firebase Console → **Firestore**, vous pouvez voir :
- Les timestamps `lastUpdated` dans la collection `leaderboard`
- La fréquence des mises à jour

---

## 🔄 Mise à jour des mois précédents

Le cron job met à jour **uniquement le mois en cours**.

Pour mettre à jour les mois précédents, utilisez le script manuel :

```bash
npx tsx scripts/generate-leaderboard.ts 2025-10
npx tsx scripts/generate-leaderboard.ts 2025-09
```

---

## ⚠️ Limitations Vercel

**Vercel Hobby Plan** :
- ✅ Cron jobs gratuits
- ⚠️ Maximum 1 cron job par projet
- ⚠️ Intervalle minimum : toutes les heures

**Vercel Pro Plan** :
- ✅ Jusqu'à 100 cron jobs
- ✅ Intervalle minimum : toutes les minutes

---

## 🎯 Résumé

**Configuration simple en 3 étapes** :

1. Générer `CRON_SECRET`
2. Ajouter dans Vercel Environment Variables
3. Déployer

Le leaderboard se mettra à jour **automatiquement chaque jour** ! 🎉

---

## 📚 Ressources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Generate Secret Key](https://generate-secret.vercel.app/)

