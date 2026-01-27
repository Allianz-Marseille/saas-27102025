# Todo — Déploiement Nina (Bot Secrétaire)

> Checklist et runbook pour gérer le déploiement de Nina en préproduction et production.  
> Référence fonctionnelle : [NINA-SECRETAIRE.md](./NINA-SECRETAIRE.md).  
> Route : `/commun/agents-ia/bot-secretaire` · Code : `lib/assistant/nina-system-prompt.ts`, `app/commun/agents-ia/bot-secretaire/`.

**Dernière mise en œuvre** : build OK, `.env.example` aligné (section Nina), page fullscreen + Phase 2 (conversation, saisie, stream, copier, collage image Ctrl+V, upload docs, « Nina écrit… », erreurs + Réessayer), API `context.agent === "nina"` → prompt Nina, déploiement Vercel prod (`npx vercel --prod`), smoke test endpoint OK. Points de contact à renseigner par l’équipe.

### Priorités hautes (à traiter en premier)

| Priorité | Action | Où |
|----------|--------|-----|
| **1** | Configurer les **variables Vercel** pour Nina (prod) | [§ 5.2 Checklist variables Vercel](#52-checklist-variables-vercel-nina) |
| **2** | Exécuter les **tests manuels post-déploiement** sur l’URL de prod | [§ 7.1 Tests manuels post-déploiement](#71-tests-manuels-post-déploiement) |

Après chaque déploiement Nina : vérifier les variables (§ 5.2), puis suivre la checklist § 7.1 (accès, Bonjour, envoi, copier, collage image, upload, Réessayer).

---

## Sommaire

1. [Pré-déploiement](#1-pré-déploiement)
2. [Variables d’environnement](#2-variables-denvironnement)
3. [Assets et static](#3-assets-et-static)
4. [Sécurité et conformité](#4-sécurité-et-conformité)
5. [Infrastructure et hébergement](#5-infrastructure-et-hébergement)
6. [Monitoring et observabilité](#6-monitoring-et-observabilité)
7. [Post-déploiement](#7-post-déploiement)
8. [Rollback et runbook](#8-rollback-et-runbook)

---

## 1. Pré-déploiement

- [x] **Build** : `npm run build` sans erreur (y compris avec Turbopack si utilisé).
- [ ] **Lint** : `npm run lint` OK sur tout le projet (linter corrigé sur `app/api/assistant/chat/route.ts` ; reste d’éventuelles erreurs hors périmètre Nina).
- [ ] **Tests** : exécuter les tests existants (`npm run test` ou équivalent) ; pas de régression.
- [x] **Prompt Nina** : vérifier que `lib/assistant/nina-system-prompt.ts` est aligné avec [NINA-SECRETAIRE.md](./NINA-SECRETAIRE.md) avant chaque release Nina.
- [ ] **Feature flags** (si utilisés) : confirmer que l’activation de Nina en prod est cohérente avec la stratégie de rollout.

---

## 2. Variables d’environnement

### Obligatoires pour Nina et l’assistant

- [ ] **`OPENAI_API_KEY`** : définie côté serveur (jamais exposée au client). Utilisée par `/api/assistant/chat` et par l’extraction de fichiers si Nina traite des documents.
- [ ] **Firebase (client)** : `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
- [ ] **Firebase Admin** (si conversations/export persistés) : `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`.

### Optionnelles selon usage

- [ ] **`NEXT_PUBLIC_BASE_URL`** : URL de base de l’app (ex. pour liens dans les réponses ou webhooks). Fallback sur `Host` si absent.
- [ ] **`GOOGLE_APPLICATION_CREDENTIALS_JSON`** : si extraction de texte depuis PDF/images (OCR, Document AI).
- [ ] **`CRON_SECRET`** : si des crons appellent des routes protégées.

### Vérifications

- [ ] Aucune clé API ou secret dans le code client ou dans un bundle exposé.
- [x] **`.env.example`** à jour avec les variables nécessaires pour Nina (section « Nina / Assistant », sans valeurs réelles).
- [ ] En prod, variables configurées dans la plateforme (Vercel, Firebase, etc.) et non dans un fichier versionné.

---

## 3. Assets et static

- [x] **Avatars Nina** :
  - [x] `public/agents-ia/bot-secretaire/avatar.jpg` (page, écran d’accueil).
  - [x] `public/agents-ia/bot-secretaire/avatar-tete.jpg` (icône chat, écran d’accueil, typing indicator).
- [x] Chemins dans l’app : `/agents-ia/bot-secretaire/avatar.jpg` et `avatar-tete.jpg` utilisés sur la page Nina.
- [ ] En prod : vérifier que les images sont bien servies ; tailles/formats adaptés (Next/Image utilisé).

---

## 4. Sécurité et conformité

- [x] **Auth** : `/commun/agents-ia/bot-secretaire` protégée via `RouteGuard` (layout commun) ; `/api/assistant/*` protégées par `verifyAuth` (Firebase Auth).
- [x] **Rate limiting** : en place sur `/api/assistant/chat` (`lib/assistant/rate-limiting.ts`).
- [x] **Budget / quotas** : `lib/assistant/budget-alerts.ts` appelé dans la route chat ; à configurer pour la prod (limites, alertes).
- [ ] **Validation des entrées** : fichiers (types, taille max), contenu utilisateur ; pas d’injection dans le prompt.
- [ ] **Focus secrétariat** : le prompt Nina décourage les usages hors sujet ; vérifier en tests manuels après déploiement.

---

## 5. Infrastructure et hébergement

- [ ] **Next.js** : déployé sur la cible (Vercel, Firebase Hosting, autre) avec la version Node supportée.
- [ ] **Firebase** : Firestore, Storage, Auth configurés pour la prod ; règles Firestore/Storage déployées (`firebase deploy` si utilisé).
- [ ] **API Routes** : `/api/assistant/chat`, `conversations`, `export`, `files/extract`, etc. disponibles et répondant correctement.
- [ ] **Domaine / SSL** : HTTPS actif ; pas d’appels en HTTP depuis le client vers les APIs.

### 5.1 Déploiement Vercel (procédure)

Le projet utilise `vercel.json` (crons) ; l’app est hébergeable sur Vercel.

**À retenir** : le projet est relié à Vercel via Git ; un push sur `origin/main` déclenche automatiquement un déploiement. Pas besoin de redeploy manuel après un commit/push.

1. **Lier le projet** (si pas déjà fait) : `npx vercel link` puis choisir l’équipe et le projet.
2. **Variables d’environnement** : dans le dashboard Vercel (Settings → Environment Variables), définir au minimum pour Nina :
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_*` (toutes les variables client Firebase)
   - Optionnel : `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `NEXT_PUBLIC_BASE_URL`, `CRON_SECRET`.
3. **Déployer en production** :
   - Via Git : push sur la branche connectée (souvent `main`) déclenche le déploiement si l’intégration GitHub est configurée.
   - En CLI : `npx vercel --prod` (depuis la racine du projet).
4. **Firebase** : règles Firestore/Storage à déployer séparément : `firebase deploy` (depuis la racine, avec un projet Firebase configuré).

### 5.2 Checklist variables Vercel (Nina)

À configurer dans **Vercel** → **Settings** → **Environment Variables** pour l’environnement **Production** (et Preview si besoin) :

| Variable | Obligatoire pour Nina | Note |
|----------|------------------------|------|
| `OPENAI_API_KEY` | Oui | Jamais exposée au client. Requise pour `/api/assistant/chat`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Oui | Auth + accès aux pages protégées. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Oui | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Oui | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Oui | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Oui | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Oui | |
| `FIREBASE_PROJECT_ID` | Si persistance conversation/export | Côté serveur uniquement. |
| `FIREBASE_PRIVATE_KEY` | Si persistance | Côté serveur uniquement. |
| `FIREBASE_CLIENT_EMAIL` | Si persistance | Côté serveur uniquement. |
| `NEXT_PUBLIC_BASE_URL` | Optionnel | URL de l’app (liens, webhooks). Fallback sur Host si absent. |
| `CRON_SECRET` | Si crons | Bearer pour `/api/cron/*`. |

Après ajout/modification de variables : **redéployer** (nouveau déploiement ou « Redeploy » depuis le dashboard).

---

## 6. Monitoring et observabilité

- [ ] **Logs** : erreurs API assistant (et Nina) loguées de façon centralisée (ex. Vercel Logs, Sentry, Cloud Logging).
- [ ] **Usage** : `lib/assistant/usage-tracking` et `monitoring` opérationnels ; métriques (tokens, appels, erreurs) consultables.
- [ ] **Audit** : `lib/assistant/audit` utilisé pour les actions sensibles (export, suppression conversation, etc.).
- [ ] **Alertes** : seuils (quotas, erreurs 5xx) configurés ; canal (email, Slack, etc.) défini.

---

## 7. Post-déploiement

- [ ] **Smoke tests** :
  - [ ] Page `/commun/agents-ia` accessible, lien vers Nina OK.
  - [ ] Page `/commun/agents-ia/bot-secretaire` s’affiche (fullscreen ou selon spec), bouton retour OK, avatar visible.
  - [ ] Si le chat Nina est déployé : clic « Bonjour », première réponse, envoi d’un message, pas d’erreur console/réseau.
  - [ ] **Smoke test automatisé** : `npm run smoke:nina [BASE_URL]`  
    - Ex. local : `npm run smoke:nina` (serveur sur `http://localhost:3000`).  
    - Ex. prod : `SMOKE_TEST_BASE_URL=https://xxx.vercel.app npm run smoke:nina`.  
    - Pour valider la réponse « Nina » au « Bonjour » : définir `SMOKE_TEST_AUTH_TOKEN` (Bearer = Firebase ID token).  
    - **Obtenir un token** : `SMOKE_TEST_EMAIL=... SMOKE_TEST_PASSWORD=... npm run get-firebase-token` (écrit le token sur stdout).  
      Puis :  
      `SMOKE_TEST_AUTH_TOKEN=$(SMOKE_TEST_EMAIL=... SMOKE_TEST_PASSWORD=... npm run get-firebase-token 2>/dev/null) SMOKE_TEST_BASE_URL=https://... npm run smoke:nina`
- [ ] **Export PDF** (quand implémenté) : test « Télécharger en PDF » et « Exporter la conversation » ; vérifier compatibilité mobile (ouverture nouvel onglet si applicable).
- [ ] **Checklist courte** : build OK, env OK, assets OK, auth OK, smoke OK → déploiement validé.

### 7.1 Tests manuels post-déploiement

À faire **sur l’URL de production** (ex. `https://xxx.vercel.app`) après chaque déploiement Nina :

1. **Accès et navigation**
   - [ ] Se connecter (login Firebase).
   - [ ] Aller sur `/commun/agents-ia` : la liste des agents s’affiche, lien « Nina » ou « Bot Secrétaire » visible.
   - [ ] Cliquer vers Nina : redirection vers `/commun/agents-ia/bot-secretaire`.

2. **Page Nina**
   - [ ] Page en pleine largeur (pas de sidebar), barre avec « ← Retour » et titre « Nina — Bot Secrétaire ».
   - [ ] Écran d’accueil : avatar, texte « Je suis Nina… », bouton **Bonjour** visible.

3. **Chat**
   - [ ] Clic sur **Bonjour** : message « Bonjour ! Je suis Nina… » affiché, zone de saisie en bas.
   - [ ] Saisir un court message (ex. « Résume-moi ce que tu fais ») et envoyer : réponse de Nina sans erreur console/réseau.
   - [ ] Vérifier **Copier** sur une réponse Nina : le texte est copié, feedback « Copié » (ou équivalent).
   - [ ] (Optionnel) Coller une image (Ctrl+V / Cmd+V) dans la zone de saisie : aperçu affiché, envoi possible.
   - [ ] (Optionnel) Ajouter un fichier via le bouton ou par glisser-déposer : aperçu affiché, envoi possible.

4. **Erreurs**
   - [ ] En cas d’erreur affichée : clic sur **Réessayer** renvoie le dernier message sans doublon.

5. **Récap**
   - [ ] Aucune erreur 5xx ou message d’erreur bloquant ; retour, Bonjour, envoi et copier fonctionnent → déploiement Nina validé.

---

## 8. Rollback et runbook

### Avant de rollback

- [ ] Identifier la version / le commit déployé et la cause suspecte (régression Nina, API, infra).
- [ ] Vérifier logs et métriques (erreurs, latency, usage).

### Procédure de rollback

1. [ ] Revenir au commit/version précédent stable (ex. `git revert` + redéploiement, ou rollback sur la plateforme).
2. [ ] Redéployer l’app et les éventuelles configs (env, Firebase rules).
3. [ ] Refaire les smoke tests (page Nina, chat, export si utilisé).
4. [ ] Confirmer que les utilisateurs accèdent à la version rollback.

### Runbook rapide

| Étape | Action |
|-------|--------|
| 1 | Décider du rollback (impact utilisateur, criticité). |
| 2 | Rollback app (Vercel / Firebase Hosting / autre). |
| 3 | Vérifier env, Firebase, APIs. |
| 4 | Smoke tests sur `/commun/agents-ia` et `/commun/agents-ia/bot-secretaire`. |
| 5 | Communiquer (équipe, users si besoin). |
| 6 | Post-mortem : cause, correctifs, mise à jour de ce TODO si nécessaire. |

### Points de contact

À renseigner par l’équipe avant mise en production :

- **Responsable déploiement** : _à renseigner_
- **Responsable produit / Nina** : _à renseigner_
- **Incidents / support** : _à renseigner_

---

*Document vivant : à mettre à jour à chaque évolution du déploiement (outils, env, procédures).*
