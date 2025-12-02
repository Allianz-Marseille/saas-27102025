# 🚀 Guide de démarrage rapide - Chatbot RAG

## ✅ État actuel

Toutes les phases de développement sont terminées :
- ✅ Phase 1 : Infrastructure et configuration
- ✅ Phase 2 : Services backend
- ✅ Phase 3 : API Routes
- ✅ Phase 4 : Composants UI

## 🎯 Accès au chatbot

### Pour tous les utilisateurs

1. **Via le bouton flottant** :
   - Un bouton flottant apparaît en bas à droite sur toutes les pages (sauf `/login`)
   - Cliquez dessus pour ouvrir le chatbot

2. **Via le menu "Outils"** :
   - Dans la sidebar, cliquez sur "Outils"
   - Ou allez directement sur `/outils`
   - Cliquez sur "Ouvrir le chatbot"

### Pour les admins

En plus de l'accès au chatbot, les admins peuvent :

1. **Uploader des documents** :
   - Allez sur `/outils`
   - Onglet "Documents"
   - Cliquez sur "Sélectionner un fichier"
   - Types supportés : PDF (max 10MB), Images PNG/JPG/WEBP (max 5MB)

2. **Gérer les documents** :
   - Voir la liste de tous les documents indexés
   - Supprimer des documents si nécessaire

## 📝 Utilisation du chatbot

### Poser une question

1. Ouvrez le chatbot (bouton flottant ou page Outils)
2. Tapez votre question dans le champ de saisie
3. Appuyez sur `Enter` ou cliquez sur le bouton d'envoi
4. Attendez la réponse (génération en cours...)

### Fonctionnalités

- **Formatage markdown** : Les réponses sont formatées avec des titres, listes, code, etc.
- **Copie rapide** : Cliquez sur "Copier" pour copier une réponse
- **Auto-select** : Le champ de saisie est automatiquement sélectionné après chaque réponse
- **Historique** : Le chatbot garde en mémoire les 10 derniers messages
- **Sources** : Les documents utilisés pour la réponse sont affichés

### Exemples de questions

- "Quelles sont les procédures pour souscrire une assurance auto ?"
- "Comment fonctionne le système de commissions ?"
- "Quels sont les délais de traitement des sinistres ?"
- "Explique-moi les différents types d'actes commerciaux"

## 🔧 Configuration

### Variables d'environnement requises

Assurez-vous que votre `.env.local` contient :

```env
# Qdrant Cloud
QDRANT_URL=https://votre-cluster.qdrant.io
QDRANT_API_KEY=votre_cle_api

# OpenAI
OPENAI_API_KEY=sk-...

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 🧪 Tests

### Tester les routes API

```bash
npm run test-rag-api VOTRE_TOKEN_FIREBASE
```

### Tester la connexion RAG

```bash
npm run test-rag
```

## 📚 Documentation complète

- `PLAN.md` - Plan d'implémentation complet
- `TESTING.md` - Guide de test détaillé
- `TEST_QUICK_START.md` - Guide de test rapide

## 🐛 Dépannage

### Le chatbot ne répond pas

1. Vérifiez que le serveur Next.js est lancé : `npm run dev`
2. Vérifiez les variables d'environnement
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez que vous êtes connecté

### Erreur "Non authentifié"

- Reconnectez-vous à l'application
- Le token Firebase expire après 1 heure

### Erreur lors de l'upload

- Vérifiez que vous êtes admin
- Vérifiez la taille du fichier (max 10MB pour PDF, 5MB pour images)
- Vérifiez le type de fichier (PDF, PNG, JPG, JPEG, WEBP uniquement)

### Le chatbot ne trouve pas d'informations

- Vérifiez qu'au moins un document a été uploadé et indexé
- Les documents doivent être uploadés par un admin
- Attendez quelques secondes après l'upload pour que l'indexation soit terminée

## 🎨 Personnalisation

### Modifier le style

Les composants utilisent Tailwind CSS et peuvent être personnalisés dans :
- `components/chatbot/chatbot-window.tsx` - Style de la fenêtre
- `components/chatbot/chat-message.tsx` - Style des messages
- `components/chatbot/floating-chat-button.tsx` - Style du bouton flottant

### Modifier le prompt système

Éditez `lib/config/rag-config.ts` :
```typescript
systemPrompt: `Votre prompt personnalisé ici...`
```

## 📊 Statistiques

- **Documents indexés** : Visible dans l'onglet "Documents" (admin)
- **Chunks par document** : Affiché dans la liste des documents
- **Confiance OCR** : Affichée pour les images (si applicable)

## 🚀 Prochaines étapes

Voir `PLAN.md` section "Améliorations futures" pour les fonctionnalités à venir.

