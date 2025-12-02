# Gestion des Utilisateurs par les Administrateurs

Ce guide explique comment implémenter et utiliser l'interface d'administration pour gérer les utilisateurs (création, modification, suppression) directement depuis l'application.

## 📋 Vue d'ensemble

L'interface d'administration permet aux administrateurs de :
- ✅ **Créer** de nouveaux utilisateurs (Auth + Firestore)
- ✅ **Lister** tous les utilisateurs existants
- ✅ **Modifier** le rôle d'un utilisateur
- ✅ **Activer/Désactiver** un utilisateur
- ✅ **Supprimer** un utilisateur (Auth + Firestore)

## 🏗️ Architecture

La gestion des utilisateurs nécessite l'utilisation de **Firebase Admin SDK** côté serveur, car le SDK client Firebase a des limitations de sécurité pour ces opérations.

**Flux de données :**
```
Interface Admin → API Routes Next.js → Firebase Admin SDK → Firebase Auth + Firestore
```

## 📦 Implémentation

### 1. Fonctions utilitaires dans `lib/firebase/auth.ts`

Ajouter ces fonctions pour récupérer et mettre à jour les données utilisateurs :

```typescript
// lib/firebase/auth.ts (ajouts)

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

### 2. API Routes Next.js

Créer le fichier `app/api/admin/users/route.ts` pour gérer toutes les opérations CRUD :

#### GET - Liste tous les utilisateurs

```typescript
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require("../../../../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

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
```

#### POST - Créer un nouvel utilisateur

```typescript
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
```

#### PATCH - Mettre à jour un utilisateur

```typescript
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
```

#### DELETE - Supprimer un utilisateur

```typescript
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

### 3. Page d'administration des utilisateurs

Créer le fichier `app/admin/users/page.tsx` avec l'interface complète :

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
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
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### 4. Ajouter le lien dans la sidebar admin

Mettre à jour `components/admin/admin-sidebar.tsx` pour ajouter un lien vers la gestion des utilisateurs :

```typescript
// Dans le composant AdminSidebar
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

## 🔒 Sécurité

### Vérification des permissions

Il est **crucial** d'ajouter une vérification que l'utilisateur qui appelle l'API est bien administrateur. Voici un middleware à ajouter dans chaque route API :

```typescript
// middleware/verify-admin.ts
import { NextRequest } from "next/server";
import admin from "firebase-admin";

export async function verifyAdmin(request: NextRequest): Promise<{ valid: boolean; uid?: string; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "Non authentifié" };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return { valid: false, error: "Utilisateur non trouvé" };
    }

    const userData = userDoc.data();
    if (userData?.role !== "ADMINISTRATEUR" || !userData?.active) {
      return { valid: false, error: "Accès refusé : Admin requis" };
    }

    return { valid: true, uid: decodedToken.uid };
  } catch (error) {
    return { valid: false, error: "Token invalide" };
  }
}
```

**Utilisation dans les routes API :**

```typescript
import { verifyAdmin } from "../../../../middleware/verify-admin";

export async function POST(request: NextRequest) {
  // Vérifier que l'utilisateur est admin
  const verification = await verifyAdmin(request);
  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: 401 }
    );
  }

  // ... reste du code
}
```

**Côté client, passer le token :**

```typescript
import { useAuth } from "@/lib/firebase/use-auth";

const { user } = useAuth();

const response = await fetch("/api/admin/users", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${await user?.getIdToken()}`
  },
  body: JSON.stringify(formData),
});
```

## 🎯 Fonctionnalités

### Création d'utilisateur

- ✅ Vérifie le domaine email (@allianz-nogaro.fr)
- ✅ Crée l'utilisateur dans Firebase Auth
- ✅ Crée le document dans Firestore avec le rôle
- ✅ Gère les erreurs (email existant, etc.)

### Modification de rôle

- ✅ Permet de changer le rôle sans supprimer l'utilisateur
- ✅ Met à jour uniquement Firestore (Auth ne stocke pas les rôles)

### Activation/Désactivation

- ✅ Active/désactive dans Firestore (`active: true/false`)
- ✅ Désactive également dans Firebase Auth (`disabled: true/false`)
- ✅ Un utilisateur désactivé ne peut plus se connecter

### Suppression

- ⚠️ **Action irréversible**
- ✅ Supprime de Firebase Auth
- ✅ Supprime de Firestore
- ⚠️ Les actes liés à cet utilisateur restent dans la base (à gérer selon vos besoins)

## 📝 Notes importantes

1. **Sécurité** : Toujours vérifier que l'utilisateur est admin avant d'exécuter une action
2. **Domaine email** : Seuls les emails se terminant par `@allianz-nogaro.fr` sont autorisés
3. **Suppression** : La suppression d'un utilisateur ne supprime pas ses actes commerciaux historiques
4. **Password** : Les administrateurs doivent définir un mot de passe initial lors de la création
5. **Email vérifié** : L'email n'est pas vérifié automatiquement lors de la création (peut être fait manuellement dans Firebase Console)

## 🔍 Dépannage

### Erreur : "Email doit se terminer par @allianz-nogaro.fr"
- Vérifiez que l'email saisi correspond au domaine autorisé

### Erreur : "L'email est déjà utilisé"
- L'utilisateur existe déjà dans Firebase Auth
- Utilisez la modification plutôt que la création

### Erreur : "Non autorisé"
- Vérifiez que vous êtes connecté en tant qu'administrateur
- Vérifiez que votre compte est actif dans Firestore

### Les utilisateurs ne s'affichent pas
- Vérifiez que les API routes fonctionnent correctement
- Vérifiez les logs du serveur Next.js
- Vérifiez que Firebase Admin SDK est correctement initialisé

## 📚 Ressources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Firebase Auth Admin](https://firebase.google.com/docs/auth/admin)

