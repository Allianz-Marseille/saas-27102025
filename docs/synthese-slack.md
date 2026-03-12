# Synthèse Slack — Étape finale des processus Préterme

## Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du flux](#2-architecture-du-flux)
3. [Création de l'application Slack](#3-création-de-lapplication-slack)
4. [Permissions (OAuth Scopes)](#4-permissions-oauth-scopes)
5. [Installation dans le workspace](#5-installation-dans-le-workspace)
6. [Configuration des variables d'environnement](#6-configuration-des-variables-denvironnement)
7. [Inviter le bot dans le canal](#7-inviter-le-bot-dans-le-canal)
8. [Trouver l'ID du canal cible](#8-trouver-lid-du-canal-cible)
9. [Format du message Slack (Block Kit)](#9-format-du-message-slack-block-kit)
10. [Fichiers et rôles](#10-fichiers-et-rôles)
11. [Flux d'appel côté serveur](#11-flux-dappel-côté-serveur)
12. [Checklist de validation complète](#12-checklist-de-validation-complète)
13. [Codes d'erreur Slack et résolutions](#13-codes-derreur-slack-et-résolutions)
14. [Test manuel avec curl](#14-test-manuel-avec-curl)

---

## 1. Vue d'ensemble

L'étape Synthèse Slack est la **dernière étape des processus Préterme Auto et IARD**. Elle intervient après que toutes les cartes Trello ont été créées (statut import = `TERMINE` ou `DISPATCH_TRELLO`).

**Ce qu'elle fait :**

- Agrège les données de l'import terminé (clients globaux, conservés, répartition par CDC, sociétés en attente)
- Formate un message structuré au format **Slack Block Kit**
- L'envoie via l'API Web Slack (`chat.postMessage`) dans le canal `#allianz-nogaro` (ID : `CE58HNVF0`)
- Le message sert de compte-rendu opérationnel visible par toute l'équipe

**Canaux concernés :**

| Branche | Canal | ID canal |
|---------|-------|----------|
| Auto    | `#allianz-nogaro` | `CE58HNVF0` |
| IARD    | `#allianz-nogaro` | `CE58HNVF0` |

Les deux branches partagent le même canal. Le header du message indique la branche (`📋 Prétermes Auto` ou `📋 Prétermes IARD`).

---

## 2. Architecture du flux

```
[UI – SynthesisReport.tsx]
        │
        │  POST /api/admin/preterme-auto/slack
        │  POST /api/admin/preterme-ird/slack
        │  Body : { importId: string }
        │  Header : Authorization: Bearer <Firebase ID Token>
        ▼
[Route API Next.js – /app/api/admin/preterme-*/slack/route.ts]
        │
        ├── verifyAdmin() → vérifie le Firebase ID Token
        ├── Lecture Firestore : import + clients
        ├── Agrégation : parCharge, nbSocietesEnAttente
        └── envoyerSlack() / envoyerIrdSlack()
                │
                │  POST https://slack.com/api/chat.postMessage
                │  Authorization: Bearer SLACK_BOT_TOKEN
                ▼
        [API Web Slack]
                │
                ▼
        [Canal Slack CE58HNVF0]
```

---

## 3. Création de l'application Slack

### 3.1 Créer l'app

1. Aller sur **https://api.slack.com/apps**
2. Cliquer **"Create New App"** → **"From scratch"**
3. Nom de l'app : `Allianz Nogaro Bot` (ou autre)
4. Workspace : sélectionner le workspace Allianz Nogaro
5. Cliquer **"Create App"**

> **Lien direct** : https://api.slack.com/apps/new

### 3.2 Configurer les métadonnées (optionnel mais recommandé)

Dans **Basic Information** :
- **App icon** : logo Allianz
- **Description** : `Bot de synthèse opérationnelle — prétermes Auto & IARD`
- **Background color** : `#003781` (bleu Allianz)

---

## 4. Permissions (OAuth Scopes)

Dans le menu **OAuth & Permissions** → section **Bot Token Scopes**, ajouter :

| Scope | Pourquoi |
|-------|----------|
| `chat:write` | Envoyer des messages dans les canaux où le bot est membre |
| `chat:write.public` | Envoyer des messages dans les canaux publics sans invitation préalable (optionnel si le canal est public) |
| `channels:read` | Lister les canaux pour récupérer un ID (utile en debug) |

> **Lien direct** : `https://api.slack.com/apps/{APP_ID}/oauth`

**Scopes minimaux requis :** `chat:write` suffit si le bot est invité dans le canal.

---

## 5. Installation dans le workspace

Dans **OAuth & Permissions** → cliquer **"Install to Workspace"**.

Slack affiche alors le **Bot User OAuth Token**, sous la forme :

```
xoxb-[chiffres]-[chiffres]-[caractères aléatoires]
```

⚠️ **Ce token ne s'affiche qu'une fois.** Le copier immédiatement.

> **Lien direct** : `https://api.slack.com/apps/{APP_ID}/install-on-team`

Si le token a été perdu : **OAuth & Permissions** → **"Reinstall App"** pour en générer un nouveau.

---

## 6. Configuration des variables d'environnement

### 6.1 En local — `.env.local`

```bash
# Slack Bot Token — commence par "xoxb-"
SLACK_BOT_TOKEN=<coller_ici_le_token_depuis_api.slack.com>
```

> ⚠️ Ce fichier est dans `.gitignore`. Ne jamais le committer.

### 6.2 En production — Vercel

1. Dashboard Vercel → projet → **Settings** → **Environment Variables**
2. Ajouter :
   - **Key** : `SLACK_BOT_TOKEN`
   - **Value** : `<votre_token>`
   - **Environments** : Production + Preview

> **Lien direct** : `https://vercel.com/{team}/{project}/settings/environment-variables`

### 6.3 Priorité de lecture dans le code

Les routes lisent le token dans cet ordre :

```
1. process.env.SLACK_BOT_TOKEN  (variable serveur — Vercel ou système)
2. .env.local (fallback local via readSlackTokenFromEnvLocal)
3. → Erreur 503 si aucun des deux n'est défini
```

---

## 7. Inviter le bot dans le canal

Une fois le bot installé, il faut l'inviter dans `#allianz-nogaro` **avant** le premier envoi :

Dans Slack, aller dans le canal `#allianz-nogaro`, puis taper :

```
/invite @Allianz Nogaro Bot
```

Ou depuis l'interface : clic sur le nom du canal → **Members** → **Add people** → chercher le nom du bot.

> Sans cette invitation, l'API retourne l'erreur `not_in_channel`.

---

## 8. Trouver l'ID du canal cible

L'ID `CE58HNVF0` est l'identifiant interne Slack du canal. Pour le retrouver ou le vérifier :

### Méthode 1 — Via l'interface Slack

1. Clic droit sur le canal → **"View channel details"**
2. Tout en bas de la popup → **"Channel ID"** (ex: `CE58HNVF0`)
3. Cliquer pour copier

### Méthode 2 — Via l'API Slack

```bash
curl -X GET "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200" \
  -H "Authorization: Bearer SLACK_BOT_TOKEN"
```

Chercher dans la réponse JSON le canal par `name`.

### Méthode 3 — Via l'URL Slack web

L'URL d'un canal dans le client web ressemble à :
```
https://app.slack.com/client/{WORKSPACE_ID}/{CHANNEL_ID}
```
Le dernier segment est l'ID du canal.

> **Canal actuel configuré** : `CE58HNVF0` — hardcodé dans les routes et le composant.

---

## 9. Format du message Slack (Block Kit)

Le message utilise le format **Block Kit** de Slack. Voici la structure générée par `buildSlackBlocks()` / `buildIrdSlackBlocks()` :

```
┌─────────────────────────────────────────────────┐
│  📋 Prétermes Auto — mars 2026                  │  ← header
├─────────────────────────────────────────────────┤
│  divider                                        │
├─────────────────────────────────────────────────┤
│  Synthèse globale                               │  ← section
│  320 prétermes importés → 87 conservés (27%)   │
├─────────────────────────────────────────────────┤
│  H91358 – La Corniche    │ H92083 – La Rouvière │  ← section fields (2 col)
│  180 imp · 52 cons · 29% │ 140 imp · 35 cons · 25%│
├─────────────────────────────────────────────────┤
│  divider                                        │
├─────────────────────────────────────────────────┤
│  Charge par collaborateur                       │  ← section
│  • Corentin : 18 dossiers                      │
│  • Emma : 14 dossiers                          │
│  • Matthieu : 12 dossiers                      │
│  • Donia : 8 dossiers                          │
├─────────────────────────────────────────────────┤
│  ⚠️ 3 société(s) en attente  (si applicable)   │  ← section conditionnelle
├─────────────────────────────────────────────────┤
│  divider                                        │
├─────────────────────────────────────────────────┤
│  _Seuils : ETP ≥ 120 | Variation ≥ 20%_        │  ← context (pied de message)
└─────────────────────────────────────────────────┘
```

### Tester le rendu avant envoi

Utiliser le **Block Kit Builder** officiel :

> **Lien** : https://app.slack.com/block-kit-builder

Coller le JSON de blocs généré (visible dans les logs serveur ou en appelant l'API directement) pour prévisualiser le rendu exact.

---

## 10. Fichiers et rôles

| Fichier | Rôle |
|---------|------|
| `components/preterme/SynthesisReport.tsx` | UI Auto — affiche les métriques, bouton "Envoyer sur Slack" |
| `components/preterme-ird/SynthesisReport.tsx` | UI IARD — même structure |
| `app/api/admin/preterme-auto/slack/route.ts` | Route POST Auto — agrège Firestore + appelle `envoyerSlack` |
| `app/api/admin/preterme-ird/slack/route.ts` | Route POST IARD — agrège Firestore + appelle `envoyerIrdSlack` |
| `lib/services/preterme-slack.ts` | Service Auto — `buildSlackBlocks()` + `envoyerSlack()` |
| `lib/services/preterme-ird-slack.ts` | Service IARD — `buildIrdSlackBlocks()` + `envoyerIrdSlack()` |

### Collections Firestore lues

| Collection | Données lues |
|-----------|-------------|
| `preterme_imports` | `moisKey`, `agence`, `pretermesGlobaux`, `pretermesConserves`, `seuilEtpApplique`, `seuilVariationApplique` |
| `preterme_clients` | `conserve`, `typeEntite`, `nomGerant`, `chargeAttribue` |
| `preterme_iard_imports` | Idem (branche IRD) |
| `preterme_iard_clients` | Idem (branche IRD) |

---

## 11. Flux d'appel côté serveur

```
POST /api/admin/preterme-auto/slack
  { importId: "abc123" }

  1. verifyAdmin(request)
     → décode le Firebase ID Token
     → vérifie rôle ADMINISTRATEUR
     → 403 si invalide

  2. Lecture SLACK_BOT_TOKEN
     → process.env ou .env.local
     → 503 si absent

  3. Firestore: preterme_imports.doc(importId)
     → 404 si introuvable

  4. Firestore: preterme_clients WHERE importId = ...
     → agrège parCharge et nbSocietesEnAttente

  5. buildSlackBlocks(synthData)
     → construit le JSON Block Kit

  6. fetch("https://slack.com/api/chat.postMessage")
     → Authorization: Bearer SLACK_BOT_TOKEN
     → body: { channel, text (fallback), blocks }

  7. Vérification json.ok
     → 502 + json.error si false

  8. Retourne { success: true, ts: "...", channelId, moisKey }
```

Le champ `ts` retourné est le **timestamp Slack** du message — il sert d'identifiant unique et permet de modifier ou supprimer le message plus tard via `chat.update`.

---

## 12. Checklist de validation complète

### Côté Slack

- [ ] App Slack créée sur https://api.slack.com/apps
- [ ] Scope `chat:write` ajouté dans **OAuth & Permissions**
- [ ] App installée dans le workspace → token Bot copié depuis **OAuth & Permissions**
- [ ] Bot invité dans le canal `#allianz-nogaro` via `/invite @NomDuBot`
- [ ] ID du canal vérifié : `CE58HNVF0`

### Côté serveur

- [ ] `SLACK_BOT_TOKEN=<votre_token>` dans `.env.local` (local)
- [ ] `SLACK_BOT_TOKEN` dans les variables Vercel (production)
- [ ] Redémarrage du serveur Next.js après ajout de la variable (local)
- [ ] Redéploiement Vercel après ajout de la variable (production)

### Test fonctionnel

- [ ] Lancer le processus jusqu'à l'étape Synthèse Slack
- [ ] Vérifier que l'import a le statut `TERMINE` ou `DISPATCH_TRELLO`
- [ ] Cliquer "Envoyer sur Slack" → pas d'erreur toast
- [ ] Vérifier la réception du message dans `#allianz-nogaro`
- [ ] Vérifier le contenu : mois, métriques, répartition CDC
- [ ] Tester le cas "sociétés en attente" (bloc ⚠️ apparaît si `nbSocietesEnAttente > 0`)

---

## 13. Codes d'erreur Slack et résolutions

| Code Slack | Signification | Résolution |
|------------|---------------|------------|
| `not_in_channel` | Le bot n'est pas membre du canal | `/invite @NomDuBot` dans le canal |
| `channel_not_found` | L'ID canal est incorrect | Vérifier l'ID (cf. §8) — attention aux espaces |
| `invalid_auth` | Le token est invalide ou révoqué | Régénérer le token : **OAuth & Permissions** → **Reinstall App** |
| `token_revoked` | Le token a été révoqué manuellement | Même action que ci-dessus |
| `missing_scope` | Le scope `chat:write` est absent | Ajouter le scope + réinstaller l'app |
| `rate_limited` | Trop d'appels en peu de temps | Attendre quelques secondes et réessayer |
| `no_text` | Ni `text` ni `blocks` fournis | Ne pas toucher au code — le fallback `text` est toujours présent |

**Erreur 503 de notre API :**
> `SLACK_BOT_TOKEN non configuré côté serveur.`

→ La variable d'environnement est manquante ou mal nommée. Vérifier `.env.local` (local) ou Vercel (production).

---

## 14. Test manuel avec curl

Utile pour valider le token et le canal sans passer par l'interface.

### Tester l'authentification

```bash
curl -X GET "https://slack.com/api/auth.test" \
  -H "Authorization: Bearer VOTRE_SLACK_BOT_TOKEN"
```

Réponse attendue :
```json
{
  "ok": true,
  "url": "https://allianz-nogaro.slack.com/",
  "team": "Allianz Nogaro",
  "user": "allianz-nogaro-bot",
  "team_id": "TXXXXXXXX",
  "user_id": "UXXXXXXXX",
  "bot_id": "BXXXXXXXX"
}
```

### Envoyer un message de test

```bash
curl -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer VOTRE_SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "CE58HNVF0",
    "text": "🧪 Test bot Allianz Nogaro — connexion OK"
  }'
```

Réponse attendue :
```json
{
  "ok": true,
  "channel": "CE58HNVF0",
  "ts": "1234567890.123456",
  "message": { ... }
}
```

### Tester la route API locale (Next.js en cours)

```bash
# Récupérer d'abord un Firebase ID Token via la console Firebase
# ou depuis le localStorage du navigateur (champ firebaseToken)

curl -X POST "http://localhost:3000/api/admin/preterme-auto/slack" \
  -H "Authorization: Bearer FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "importId": "ID_IMPORT_TERMINE" }'
```

---

## Liens utiles

| Ressource | URL |
|-----------|-----|
| Tableau de bord des apps Slack | https://api.slack.com/apps |
| Créer une app Slack | https://api.slack.com/apps/new |
| Block Kit Builder (prévisualisation) | https://app.slack.com/block-kit-builder |
| Référence API `chat.postMessage` | https://api.slack.com/methods/chat.postMessage |
| Référence Block Kit (types de blocs) | https://api.slack.com/reference/block-kit/blocks |
| Référence OAuth scopes | https://api.slack.com/scopes |
| Variables Vercel | https://vercel.com/dashboard (Settings → Env Vars) |
