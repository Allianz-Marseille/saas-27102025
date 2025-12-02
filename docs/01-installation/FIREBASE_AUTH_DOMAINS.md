# Configurer les Domaines Autorisés Firebase Auth

## 🚨 Problème courant : Erreur 400 lors de la connexion

Si vous obtenez une erreur 400 lors de la tentative de connexion sur Vercel, c'est probablement parce que le domaine Vercel n'est pas dans la liste des domaines autorisés de Firebase Auth.

## ✅ Solution : Ajouter le domaine Vercel

### Étapes :

1. **Allez sur [Firebase Console](https://console.firebase.google.com)**

2. **Sélectionnez votre projet** : `saas-27102025`

3. **Allez dans Authentication** → **Settings** (⚙️) → **Authorized domains**

4. **Ajoutez votre domaine Vercel** :
   - Cliquez sur **"Add domain"**
   - Entrez : `saas-27102025-记忆zt.vercel.app`
   - Cliquez sur **"Add"**

5. **Vérifiez que ces domaines sont présents** :
   - ✅ `localhost` (pour le dev local)
   - ✅ `saas-27102025-4zjt.vercel.app` (votre domaine Vercel)
   - ✅ `saas-allianz-marseille-git-main-jean-michel-nogaros-projects.vercel.app` (si présent)

### Important :

Chaque sous-domaine Vercel doit être ajouté séparément :
- Si vous avez plusieurs déploiements (Production, Preview), ajoutez chaque URL
- Si vous changez de domaine Vercel, ajoutez le nouveau

## 🔍 Vérification

Après avoir ajouté le domaine :

1. **Attendez quelques secondes** (les changements sont immédiats)
2. **Retournez sur votre application Vercel**
3. **Essayez de vous connecter à nouveau**
4. L'erreur 400 devrait disparaître

## 📝 Autres causes possibles

Si l'erreur persiste après avoir ajouté le domaine :

1. **L'utilisateur n'existe pas** dans Firebase Auth
   - Vérifiez dans Firebase Console → Authentication → Users

2. **Le mot de passe est incorrect**
   - Réinitialisez le mot de passe si nécessaire

3. **Les variables d'environnement ne sont pas correctes**
   - Vérifiez dans Vercel → Settings → Environment Variables
   - Toutes les variables `NEXT_PUBLIC_FIREBASE_*` doivent être présentes

4. **Le domaine n'a pas été sauvegardé**
   - Vérifiez que le domaine apparaît bien dans la liste après ajout

