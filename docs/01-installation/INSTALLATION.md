# 📦 Installation & Configuration

## 1️⃣ Initialisation du projet

Le projet est déjà installé et configuré avec toutes les dépendances nécessaires.

## 2️⃣ Configuration Firebase

### Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet
3. Activez **Authentication** avec le provider **Email/Password**
4. Créez une base **Firestore**
5. Configurez les Security Rules (copiez le contenu de `firestore.rules`)
6. Déployez les index Firestore : `firebase deploy --only firestore:indexes`

### Récupérer les credentials

1. Dans Firebase Console → Project Settings → General
2. Trouvez "Your apps" et cliquez sur `</>` pour Web
3. Copiez les valeurs de configuration

### Créer le fichier `.env.local`

À la racine du projet :

```bash
cp env.example .env.local
```

Éditez `.env.local` avec vos credentials Firebase :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 3️⃣ Créer les collections Firestore

### Collection `users`

Créez un utilisateur pour tester :

```typescript
// Dans Firebase Console → Firestore Database
{
  id: "user-admin-123",
  email: "admin@allianz-marseille.fr",
  role: "ADMINISTRATEUR",
  active: true,
  createdAt: Timestamp.now()
}
```

### Collection `companies` (optionnel)

```typescript
{
  id: "comp-1",
  name: "Allianz France",
  active: true,
  createdAt: Timestamp.now()
}
```

## 4️⃣ Lancer l'application

### Mode développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

### Mode production

```bash
npm run build
npm start
```

## 5️⃣ Utilisation

### Accès rapide (mode dev)

Sur la page `/login` :
- **"Connexion ADMIN (dev)"** → Dashboard admin
- **"Connexion CDC (dev)"** → Dashboard commercial

⚠️ **Ces boutons dev doivent être retirés en production !**

### Accès réel

1. Créez un compte Firebase avec email `@allianz-nogaro.fr`
2. Connectez-vous via le formulaire
3. Accédez au dashboard correspondant à votre rôle

## 🎨 Personnalisation

### Palette de couleurs

Modifier dans `app/globals.css` :

```css
:root {
  --primary: #00529B;  /* Bleu Allianz */
  --primary-foreground: #ffffff;
  /* ... */
}
```

### Logo

Remplacer le composant `PaletteAllianz` dans `components/icons/allianz-logo.tsx`

## 📊 Données de test

Pour tester rapidement, des données mockées sont disponibles dans :
- `app/dashboard/page.tsx` (ligne 52-67)
- Ajoutez vos propres données Firebase pour les intégrer réellement

## 🔧 Dépannage

### Erreur "Firebase not initialized"

➡️ Vérifiez que `.env.local` est bien configuré et que les variables commencent par `NEXT_PUBLIC_`

### Erreur d'authentification

➡️ Vérifiez que Authentication est activé dans Firebase Console

### Erreur Firestore rules

➡️ Déployez les règles : `firebase deploy --only firestore:rules`

## 🚀 Déploiement

### Vercel (recommandé)

1. Connectez votre repo GitHub à Vercel
2. Ajoutez les variables d'environnement dans Vercel Dashboard
3. Déployez automatiquement

### Autres plateformes

- Netlify
- Railway
- Firebase Hosting

## 📝 Prochaines étapes

Voir `docs/ARCHITECTURE.md` pour les TODOs et fonctionnalités à implémenter.

