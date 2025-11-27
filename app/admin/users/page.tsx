"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserX, UserCheck, Trash2, KeyRound } from "lucide-react";
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
import { useAuth } from "@/lib/firebase/use-auth";

interface User {
  uid: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL";
  active: boolean;
  createdAt: string;
  emailVerified: boolean;
}

export default function UsersManagementPage() {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "CDC_COMMERCIAL" as "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL",
  });

  // Helper pour créer les headers avec l'ID et l'email de l'admin
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (user?.uid) headers["x-user-id"] = user.uid;
    if (userData?.email) headers["x-user-email"] = userData.email;
    return headers;
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Utilisateurs chargés:", data.users);
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast.error(error.message || "Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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

  const handleUpdateRole = async (user: User, newRole: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL") => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uid: selectedUser.uid,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur réinitialisation mot de passe");
      }
      
      toast.success("Mot de passe réinitialisé avec succès");
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
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
                              onValueChange={(value: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL") =>
                                handleUpdateRole(user, value)
                              }
                            >
                              <SelectTrigger className="w-[220px] mx-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMINISTRATEUR">Administrateur</SelectItem>
                                <SelectItem value="CDC_COMMERCIAL">CDC Commercial</SelectItem>
                                <SelectItem value="COMMERCIAL_SANTE_INDIVIDUEL">Commercial Santé Individuel</SelectItem>
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
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewPassword("");
                                  setIsPasswordDialogOpen(true);
                                }}
                                title="Réinitialiser le mot de passe"
                              >
                                <KeyRound className="h-4 w-4" />
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
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 caractères"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMINISTRATEUR">Administrateur</SelectItem>
                      <SelectItem value="CDC_COMMERCIAL">CDC Commercial</SelectItem>
                      <SelectItem value="COMMERCIAL_SANTE_INDIVIDUEL">Commercial Santé Individuel</SelectItem>
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

          {/* Dialog réinitialisation mot de passe */}
          <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
                <AlertDialogDescription>
                  Définir un nouveau mot de passe pour {selectedUser?.email}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoComplete="new-password"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setNewPassword("")}>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetPassword}
                  disabled={!newPassword || newPassword.length < 6}
                >
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </RouteGuard>
  );
}

