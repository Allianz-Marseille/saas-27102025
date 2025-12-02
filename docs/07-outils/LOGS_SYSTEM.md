# Système de Logs

## 📋 Vue d'ensemble

Le système de logs permet de tracer toutes les actions importantes effectuées dans l'application, offrant une traçabilité complète pour les administrateurs.

## 🎯 Fonctionnalités

### Page Admin des Logs

Accessible via la sidebar admin : **Journal des logs**

**Fonctionnalités principales :**
- ✅ **Statistiques en temps réel** : Total, Info, Succès, Attention, Erreurs
- 🔍 **Recherche avancée** : Par description, email utilisateur, ou action
- 🎯 **Filtres multiples** : Par niveau (info, success, warning, error) et par action
- 📊 **Tri chronologique** : Les logs les plus récents en premier
- 💾 **Export CSV** : Téléchargement de l'historique complet
- 🔄 **Actualisation** : Bouton pour recharger les logs
- 📱 **Design responsive** : Optimisé mobile et desktop

### Types de Logs

#### Niveaux (LogLevel)
- `info` 🔵 : Informations générales (connexion, déconnexion)
- `success` 🟢 : Actions réussies (création d'acte)
- `warning` 🟠 : Avertissements (suppression d'acte)
- `error` 🔴 : Erreurs système

#### Actions (LogAction)
- `user_login` : Connexion utilisateur
- `user_logout` : Déconnexion utilisateur
- `act_created` : Création d'un acte
- `act_updated` : Modification d'un acte
- `act_deleted` : Suppression d'un acte
- `user_created` : Création d'un utilisateur
- `user_updated` : Modification d'un utilisateur
- `user_deleted` : Suppression d'un utilisateur
- `company_updated` : Modification d'une compagnie
- `commission_validated` : Validation de commission
- `system_error` : Erreur système
- `data_export` : Export de données

## 🔧 Utilisation dans le Code

### Import

```typescript
import { 
  createLog, 
  logActCreated, 
  logActUpdated, 
  logActDeleted,
  logUserLogin,
  logUserLogout,
  logSystemError
} from "@/lib/firebase/logs";
```

### Exemples d'utilisation

#### 1. Logger une connexion utilisateur

```typescript
import { logUserLogin } from "@/lib/firebase/logs";

// Dans votre fonction de connexion
async function handleLogin(user: User) {
  await logUserLogin(user.uid, user.email);
}
```

#### 2. Logger la création d'un acte

```typescript
import { logActCreated } from "@/lib/firebase/logs";
import { useAuth } from "@/lib/firebase/use-auth";

const { user, userData } = useAuth();

async function createAct(actData: ActData) {
  // Créer l'acte...
  const newAct = await createActInDatabase(actData);
  
  // Logger l'action
  if (user && userData) {
    await logActCreated(user.uid, userData.email, {
      clientNom: actData.clientNom,
      kind: actData.kind,
      contratType: actData.contratType,
    });
  }
}
```

#### 3. Logger une modification d'acte

```typescript
import { logActUpdated } from "@/lib/firebase/logs";

async function updateAct(actId: string, actData: ActData) {
  // Modifier l'acte...
  await updateActInDatabase(actId, actData);
  
  // Logger l'action
  if (user && userData) {
    await logActUpdated(user.uid, userData.email, actId, actData.clientNom);
  }
}
```

#### 4. Logger une suppression d'acte

```typescript
import { logActDeleted } from "@/lib/firebase/logs";

async function deleteAct(actId: string, clientNom: string) {
  // Supprimer l'acte...
  await deleteActFromDatabase(actId);
  
  // Logger l'action
  if (user && userData) {
    await logActDeleted(user.uid, userData.email, actId, clientNom);
  }
}
```

#### 5. Logger une erreur système

```typescript
import { logSystemError } from "@/lib/firebase/logs";

try {
  // Opération risquée...
  await dangerousOperation();
} catch (error) {
  // Logger l'erreur
  if (user && userData) {
    await logSystemError(
      user.uid, 
      userData.email, 
      error.message,
      { stack: error.stack, operation: "dangerousOperation" }
    );
  }
}
```

#### 6. Logger une action personnalisée

```typescript
import { createLog } from "@/lib/firebase/logs";

await createLog({
  level: "info",
  action: "data_export",
  userId: user.uid,
  userEmail: userData.email,
  description: "Export des données de commissions",
  metadata: {
    month: "2024-01",
    format: "CSV",
    recordCount: 150,
  },
});
```

## 🔐 Sécurité

### Règles Firestore

```javascript
// Logs collection
match /logs/{logId} {
  allow read: if isAdmin(); // Seuls les admins peuvent lire
  allow create: if isAuthenticated(); // Tous les users authentifiés peuvent créer
  allow update: if false; // Immutables
  allow delete: if false; // Ne peuvent pas être supprimés
}
```

### Bonnes pratiques

1. ✅ **Toujours logger les actions critiques** : Création, modification, suppression
2. ✅ **Inclure des métadonnées utiles** : IDs, noms, valeurs importantes
3. ✅ **Ne jamais logger de données sensibles** : Mots de passe, tokens, etc.
4. ✅ **Utiliser le bon niveau** : info, success, warning, error
5. ✅ **Descriptions claires** : "Création d'un acte AN pour Dupont Jean"

## 📊 Structure d'un Log

```typescript
interface LogEntry {
  id?: string;
  timestamp: Date | Timestamp;
  level: "info" | "warning" | "error" | "success";
  action: LogAction;
  userId: string;
  userEmail: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
```

## 🚀 Déploiement

### 1. Déployer les règles Firestore

```bash
firebase deploy --only firestore:rules
```

### 2. Déployer les index Firestore

```bash
firebase deploy --only firestore:indexes
```

### 3. Vérifier

Connectez-vous en tant qu'admin et accédez à la page "Journal des logs" pour vérifier que tout fonctionne.

## 📈 Performance

- Les logs sont limités à 200 entrées par défaut
- Tri par timestamp décroissant (index composite)
- Filtres optimisés avec des index Firestore
- Lazy loading avec ScrollArea

## 🎨 Design

Le design de la page des logs suit le même pattern moderne que le reste de l'application :
- 🎨 Gradients bleu-violet
- 💫 Animations smooth
- 📱 Responsive design
- 🌓 Support dark mode
- 🎯 Badges colorés par niveau
- 📊 Statistiques visuelles

## 🔮 Évolutions futures

- [ ] Filtres par date (date picker)
- [ ] Pagination pour de gros volumes
- [ ] Graphiques de tendances
- [ ] Alertes en temps réel
- [ ] Rétention automatique (suppression après X jours)
- [ ] Export PDF
- [ ] Notifications pour les erreurs critiques

