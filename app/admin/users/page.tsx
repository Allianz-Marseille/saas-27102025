"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserX, UserCheck, Trash2, KeyRound, Users, Shield, Heart, Building2, AlertTriangle, TrendingUp, CheckCircle2, Mail, MailCheck } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { motion } from "framer-motion";

interface User {
  uid: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL" | "COMMERCIAL_SANTE_COLLECTIVE" | "GESTIONNAIRE_SINISTRE";
  active: boolean;
  createdAt: string;
  emailVerified: boolean;
}

const roleConfig = {
  ADMINISTRATEUR: {
    label: "Administrateur",
    icon: Shield,
    gradient: "from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/30 border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
  },
  CDC_COMMERCIAL: {
    label: "CDC Commercial",
    icon: Users,
    gradient: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  },
  COMMERCIAL_SANTE_INDIVIDUEL: {
    label: "Commercial Santé Individuel",
    icon: Heart,
    gradient: "from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
  },
  COMMERCIAL_SANTE_COLLECTIVE: {
    label: "Commercial Santé Collective",
    icon: Building2,
    gradient: "from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/30 border-violet-200 dark:border-violet-800",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300 dark:border-violet-700",
  },
  GESTIONNAIRE_SINISTRE: {
    label: "Gestionnaire Sinistre",
    icon: AlertTriangle,
    gradient: "from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/30 border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  },
};

export default function UsersManagementPage() {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("CDC_COMMERCIAL");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "CDC_COMMERCIAL" as User["role"],
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
      setUsers(data.users || []);
    } catch (error: unknown) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      toast.error((error as Error).message || "Erreur lors du chargement des utilisateurs");
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
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uid: targetUser.uid,
          active: !targetUser.active,
        }),
      });

      if (!response.ok) throw new Error("Erreur mise à jour");
      
      toast.success(`Utilisateur ${!targetUser.active ? "activé" : "désactivé"}`);
      loadUsers();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uid: selectedUser.uid,
          role: newRole,
        }),
      });

      if (!response.ok) throw new Error("Erreur mise à jour");
      
      toast.success(`Rôle mis à jour : ${roleConfig[newRole].label}`);
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: unknown) {
      toast.error((error as Error).message);
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
    } catch (error: unknown) {
      toast.error((error as Error).message);
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
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  // Statistiques
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.active).length;
  const adminCount = users.filter(u => u.role === "ADMINISTRATEUR").length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;

  // Grouper les utilisateurs par rôle
  const usersByRole: Record<string, User[]> = {
    ADMINISTRATEUR: users.filter(u => u.role === "ADMINISTRATEUR"),
    CDC_COMMERCIAL: users.filter(u => u.role === "CDC_COMMERCIAL"),
    COMMERCIAL_SANTE_INDIVIDUEL: users.filter(u => u.role === "COMMERCIAL_SANTE_INDIVIDUEL"),
    COMMERCIAL_SANTE_COLLECTIVE: users.filter(u => u.role === "COMMERCIAL_SANTE_COLLECTIVE"),
    GESTIONNAIRE_SINISTRE: users.filter(u => u.role === "GESTIONNAIRE_SINISTRE"),
  };

  if (loading) {
    return (
      <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
          </motion.div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <TooltipProvider>
        <div className="space-y-6">
        {/* Header animé avec statistiques */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
            
            <CardContent className="relative z-10 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm mb-2">
                    Gestion des Utilisateurs
                  </h2>
                  <p className="text-muted-foreground">
                    Créer, modifier et gérer les accès utilisateurs
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Stats cards */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-300/50 dark:border-blue-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalUsers}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Total</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/50 dark:border-green-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activeUsers}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Actifs</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-300/50 dark:border-red-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{adminCount}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">Admins</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Nouvel utilisateur
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {users.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <Users className="h-20 w-20 mx-auto text-muted-foreground/50 mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Aucun utilisateur enregistré</h3>
                <p className="text-muted-foreground mb-6">
                  Commencez par créer votre premier utilisateur
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Créer mon premier utilisateur
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Utilisateurs par rôle */}
            {Object.entries(usersByRole).map(([role, roleUsers]) => {
              if (roleUsers.length === 0) return null;
              
              const config = roleConfig[role as keyof typeof roleConfig];
              const RoleIcon = config.icon;
              
              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-4">
                    <RoleIcon className={`h-5 w-5 ${config.iconColor}`} />
                    <h3 className="text-lg font-semibold">{config.label}</h3>
                    <Badge variant="outline" className="text-xs">
                      {roleUsers.length}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roleUsers.map((targetUser, index) => (
                      <motion.div
                        key={targetUser.uid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        <Card className={`bg-gradient-to-br ${config.gradient} shadow-md hover:shadow-xl transition-all`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20 flex-shrink-0">
                                  <RoleIcon className={`h-6 w-6 ${config.iconColor}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate" title={targetUser.email}>
                                    {targetUser.email}
                                  </p>
                                  <Badge variant="outline" className={`text-xs mt-1 ${config.badgeColor}`}>
                                    {config.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                              <Badge variant={targetUser.active ? "default" : "secondary"} className="text-xs">
                                {targetUser.active ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Actif
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3 mr-1" />
                                    Inactif
                                  </>
                                )}
                              </Badge>
                              <Badge variant={targetUser.emailVerified ? "default" : "outline"} className="text-xs">
                                {targetUser.emailVerified ? (
                                  <>
                                    <MailCheck className="h-3 w-3 mr-1" />
                                    Vérifié
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Non vérifié
                                  </>
                                )}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleActive(targetUser)}
                                    className="flex-1"
                                  >
                                    {targetUser.active ? (
                                      <UserX className="h-4 w-4" />
                                    ) : (
                                      <UserCheck className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{targetUser.active ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(targetUser);
                                      setNewRole(targetUser.role);
                                      setIsRoleDialogOpen(true);
                                    }}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Changer le rôle</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(targetUser);
                                      setNewPassword("");
                                      setIsPasswordDialogOpen(true);
                                    }}
                                  >
                                    <KeyRound className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Réinitialiser le mot de passe</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(targetUser);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Supprimer l'utilisateur</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dialog création utilisateur */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Créer un nouveau compte utilisateur avec un rôle spécifique
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@allianz-nogaro.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: User["role"]) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([roleKey, roleValue]) => (
                      <SelectItem key={roleKey} value={roleKey}>
                        {roleValue.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog changement de rôle */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Changer le rôle</DialogTitle>
              <DialogDescription>
                Modifier le rôle de {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-role">Nouveau rôle</Label>
                <Select
                  value={newRole}
                  onValueChange={(value: User["role"]) => setNewRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([roleKey, roleValue]) => (
                      <SelectItem key={roleKey} value={roleKey}>
                        {roleValue.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateRole}>
                <Shield className="mr-2 h-4 w-4" />
                Modifier le rôle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              <AlertDialogCancel asChild>
                <Button variant="outline">Annuler</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog réinitialisation mot de passe */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
              <DialogDescription>
                Définir un nouveau mot de passe pour {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword("");
              }}>
                Annuler
              </Button>
              <Button 
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </TooltipProvider>
    </RouteGuard>
  );
}
