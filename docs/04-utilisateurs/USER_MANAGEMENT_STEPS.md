# Guide Pas à Pas : Implémentation de la Gestion des Utilisateurs

Ce guide vous accompagne étape par étape pour implémenter l'interface d'administration des utilisateurs.

## 📋 Checklist globale

- [ ] Étape 1 : Installer les dépendances nécessaires
- [ ] Étape 2 : Créer les fonctions utilitaires
- [ ] Étape 3 : Créer les API Routes
- [ ] Étape 4 : Créer la page d'administration
- [ ] Étape 5 : Ajouter le lien dans la sidebar
- [ ] Étape 6 : Tester l'interface

---

## 🔧 Étape 1 : Installer les dépendances

**Action :** Installer `firebase-admin` pour les API Routes

```bash
npm install firebase-admin
```

**Vérification :** Vérifiez que le package est bien ajouté dans `package.json`

---

## 📝 Étape 2 : Créer les fonctions utilitaires

**Fichier à modifier :** `lib/firebase/auth.ts`

**Action :** Ajouter ces 3 fonctions à la fin du fichier (avant la dernière accolade fermante) :

```typescript
export const getAllUsers = async (): Promise<UserData[]> => {
  if (!db) return [];
  
  const querySnapshot = await getDocs(collection(db, "users"));
  const users = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      active: data.active,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as UserData;
  });
  
  return users;
};

export const updateUserRole = async (
  userId: string,
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL"
): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { role }, { merge: true });
};

export const toggleUserActive = async (
  userId: string,
  active: boolean
): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { active }, { merge: true });
};
```

**Vérification :** Vérifiez que le fichier compile sans erreur avec `npm run build` ou vérifiez dans votre IDE.

---

## 🛠️ Étape 3 : Créer le dossier et les API Routes

### Étape 3.1 : Créer le dossier

**Action :** Créer le dossier `app/api/admin/users/`

```bash
mkdir -p app/api/admin/users
```

### Étape 3.2 : Créer le fichier route.ts

**Fichier à créer :** `app/api/admin/users/route.ts`

**Action :** Créer ce fichier avec tout le contenu suivant :

```typescript
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialiser Firebase Admin si pas déjà fait
if (!admin.apps.length) {
  const serviceAccount = require("../../../../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// GET - Liste tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // Récupérer tous les utilisateurs Auth
    const listUsersResult = await auth.listUsers();
    
    // Récupérer les données Firestore
    const usersSnapshot = await db.collection("users").get();
    const usersData = new Map();
    usersSnapshot.forEach((doc) => {
      usersData.set(doc.id, doc.data());
    });

    const usersWithData = listUsersResult.users.map((user) => {
      const userData = usersData.get(user.uid) || {};
      return {
        uid: user.uid,
        email: user.email,
        role: userData.role || "CDC_COMMERCIAL",
        active: userData.active !== false,
        createdAt: user.metadata.creationTime,
        emailVerified: user.emailVerified,
      };
    });

    return NextResponse.json({ users: usersWithData });
  } catch (error: any) {
    console.error("Erreur GET users:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password et role requis" },
        { status: 400 }
      );
    }

    // Vérifier le domaine email
    const ALLOWED_DOMAINS = ["@allianz-nogaro.fr"];
    const isValidDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
    if (!isValidDomain) {
      return NextResponse.json(
        { error: `Email doit se terminer par ${ALLOWED_DOMAINS.join(' ou ')}` },
        { status: 400 }
      );
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Créer l'utilisateur dans Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Créer le document Firestore
    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      role,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
      },
    });
  } catch (error: any) {
    console.error("Erreur POST user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un utilisateur
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, role, active } = body;

    if (!uid) {
      return NextResponse.json(
        { error: "UID requis" },
        { status: 400 }
      );
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Mettre à jour le rôle dans Firestore
    if (role) {
      await db.collection("users").doc(uid).update({ role });
    }

    // Mettre à jour active dans Firestore
    if (typeof active === "boolean") {
      await db.collection("users").doc(uid).update({ active });
      // Désactiver/Activer l'utilisateur dans Auth aussi
      if (!active) {
        await auth.updateUser(uid, { disabled: true });
      } else {
        await auth.updateUser(uid, { disabled: false });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur PATCH user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "UID requis" },
        { status: 400 }
      );
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Supprimer de Auth
    await auth.deleteUser(uid);

    // Supprimer de Firestore
    await db.collection("users").doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Important :** Vérifiez que le chemin vers votre fichier de service account (`saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json`) est correct.

**Vérification :** Le fichier devrait être créé sans erreur de syntaxe.

---

## 📄 Étape 4 : Créer la page d'administration

### Étape 4.1 : Créer le dossier

**Action :** Créer le dossier `app/admin/users/`

```bash
mkdir -p app/admin/users
```

### Étape 4.2 : Créer le fichier page.tsx

**Fichier à créer :** `app/admin/users/page.tsx`

**Action :** Créer ce fichier avec tout le contenu suivant :

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserX, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RouteGuard } from "@/components/auth/route-guard";

interface User {
  uid: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL";
  active: boolean;
  createdAt: string;
  emailVerified: boolean;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "CDC_COMMERCIAL" as "ADMINISTRATEUR" | "CDC_COMMERCIAL",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Erreur chargement utilisateurs");
      const data = await response.json();
      setUsers(data.users);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur création utilisateur");
      }

      toast.success("Utilisateur créé avec succès");
      setIsDialogOpen(false);
      setFormData({ email: "", password: "", role: "CDC_COMMERCIAL" });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          active: !user.active,
        }),
      });

      if (!response.ok) throw new Error("Erreur mise à jour");
      
      toast.success(`Utilisateur ${!user.active ? "activé" : "désactivé"}`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateRole = async (user: User, newRole: "ADMINISTRATEUR" | "CDC_COMMERCIAL") => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          role: newRole,
        }),
      });

      if (!response.ok) throw new Error("Erreur mise à jour");
      
      toast.success(`Rôle mis à jour : ${newRole}`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users?uid=${selectedUser.uid}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur suppression");
      
      toast.success("Utilisateur supprimé");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des Utilisateurs</CardTitle>
                  <CardDescription>
                    Créer, modifier et supprimer les utilisateurs
                  </CardDescription>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm border-b">Email</th>
                        <th className="text-center p-3 font-semibold text-sm border-b">Rôle</th>
                        <th className="text-center p-3 font-semibold text-sm border-b">Statut</th>
                        <th className="text-center p-3 font-semibold text-sm border-b">Email vérifié</th>
                        <th className="text-center p-3 font-semibold text-sm border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.uid} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">{user.email}</td>
                          <td className="p-3 text-center">
                            <Select
                              value={user.role}
                              onValueChange={(value: "ADMINISTRATEUR" | "CDC_COMMERCIAL") =>
                                handleUpdateRole(user, value)
                              }
                            >
                              <SelectTrigger className="w-[180px] mx-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMINISTRATEUR">Administrateur</SelectItem>
                                <SelectItem value="CDC_COMMERCIAL">CDC Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={user.active ? "default" : "secondary"}>
                              {user.active ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={user.emailVerified ? "default" : "outline"}>
                              {user.emailVerified ? "Vérifié" : "Non vérifié"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(user)}
                                title={user.active ? "Désactiver" : "Activer"}
                              >
                                {user.active ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog création utilisateur */}
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Nouvel utilisateur</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@allianz-nogaro.fr"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "ADMINISTRATEUR" | "CDC_COMMERCIAL") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMINISTRATEUR">Administrateur</SelectItem>
                      <SelectItem value="CDC_COMMERCIAL">CDC Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateUser}>Créer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dialog suppression */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer {selectedUser?.email} ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteUser} 
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </RouteGuard>
  );
}
```

**Vérification :** Le fichier devrait être créé et compilable.

---

## 🧭 Étape 5 : Ajouter le lien dans la sidebar admin

**Fichier à modifier :** `components/admin/admin-sidebar.tsx`

**Action :** Ouvrir le fichier et ajouter un nouveau lien dans la section de navigation.

**1. Trouver la section de navigation** (généralement entre les liens "Accueil" et "Compagnies")

**2. Ajouter l'import de l'icône Users** en haut du fichier (si ce n'est pas déjà fait) :

```typescript
import { Home, Building2, LogOut, Users } from "lucide-react";
```

**3. Ajouter le lien "Utilisateurs"** dans la liste des liens de navigation, par exemple :

```typescript
<Link
  href="/admin/users"
  className={cn(
    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
    pathname === "/admin/users"
      ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
      : "hover:bg-accent text-accent-foreground"
  )}
>
  <Users className="h-5 w-5" />
  Utilisateurs
</Link>
```

**Placement recommandé :** Entre "Accueil" et "Compagnies" ou après "Compagnies", selon votre préférence.

**Vérification :** Le lien "Utilisateurs" devrait apparaître dans la sidebar.

---

## ✅ Étape 6 : Tester l'interface

### Test 6.1 : Vérifier que la page est accessible

**Action :**
1. Lancez votre application : `npm run dev`
2. Connectez-vous en tant qu'administrateur
3. Cliquez sur "Utilisateurs" dans la sidebar
4. La page devrait s'afficher avec la liste des utilisateurs

**Résultat attendu :**
- ✅ La page se charge sans erreur
- ✅ La liste des utilisateurs s'affiche
- ✅ Les colonnes sont visibles (Email, Rôle, Statut, Email vérifié, Actions)

### Test 6.2 : Tester la création d'un utilisateur

**Action :**
1. Cliquez sur "Nouvel utilisateur"
2. Remplissez le formulaire :
   - Email : `test@allianz-nogaro.fr`
   - Mot de passe : `Test123456!`
   - Rôle : CDC Commercial
3. Cliquez sur "Créer"

**Résultat attendu :**
- ✅ Message de succès apparaît
- ✅ Le nouvel utilisateur apparaît dans la liste
- ✅ Le dialog se ferme

**Si erreur :**
- Vérifiez que l'email finit bien par `@allianz-nogaro.fr`
- Vérifiez les logs du serveur Next.js dans le terminal
- Vérifiez que Firebase Admin SDK est correctement initialisé

### Test 6.3 : Tester la modification du rôle

**Action :**
1. Cliquez sur le select de rôle d'un utilisateur
2. Changez le rôle (ex: de "CDC Commercial" à "Administrateur")
3. Le changement devrait se faire automatiquement

**Résultat attendu :**
- ✅ Message de succès apparaît
- ✅ Le rôle se met à jour dans la liste
- ✅ Pas besoin de recharger la page

### Test 6.4 : Tester l'activation/désactivation

**Action :**
1. Cliquez sur l'icône pour activer/désactiver un utilisateur (icône UserX/UserCheck)
2. Le statut devrait changer

**Résultat attendu :**
- ✅ Message de succès apparaît
- ✅ Le badge "Actif/Inactif" se met à jour
- ✅ L'utilisateur ne peut plus se connecter s'il est désactivé

### Test 6.5 : Tester la suppression

**Action :**
1. Cliquez sur l'icône poubelle (Trash2) d'un utilisateur
2. Confirmez la suppression dans le dialog

**Résultat attendu :**
- ✅ Message de confirmation s'affiche
- ✅ Après confirmation, message de succès
- ✅ L'utilisateur disparaît de la liste
- ⚠️ L'utilisateur ne peut plus se connecter

**Important :** Ne supprimez pas vos propres comptes administrateur !

---

## 🐛 Dépannage

### Problème : "Cannot find module 'firebase-admin'"

**Solution :**
```bash
npm install firebase-admin
```

### Problème : "Cannot find module '../../../../saas-27102025-firebase-adminsdk-...'"

**Solution :** Vérifiez que le fichier JSON du service account existe bien à la racine du projet.

### Problème : La liste des utilisateurs est vide

**Vérifications :**
1. Vérifiez que vous avez des utilisateurs dans Firebase Auth
2. Vérifiez les logs du serveur Next.js (console du terminal)
3. Ouvrez les DevTools du navigateur (F12) → onglet Network → vérifiez la réponse de `/api/admin/users`

### Problème : Erreur 500 lors de la création

**Vérifications :**
1. Vérifiez les logs du serveur
2. Vérifiez que l'email n'existe pas déjà
3. Vérifiez que le mot de passe respecte les règles Firebase (min 6 caractères)

### Problème : Les modifications ne s'appliquent pas

**Vérifications :**
1. Rechargez la page manuellement (F5)
2. Vérifiez les logs du serveur
3. Vérifiez la console du navigateur pour les erreurs JavaScript

---

## 🎉 C'est terminé !

Une fois tous les tests passés, vous avez une interface complète de gestion des utilisateurs fonctionnelle !

**Prochaines étapes optionnelles :**
- Ajouter une vérification de permissions côté serveur (middleware)
- Ajouter un système de recherche/filtrage
- Ajouter la pagination si beaucoup d'utilisateurs
- Ajouter l'export de la liste des utilisateurs

