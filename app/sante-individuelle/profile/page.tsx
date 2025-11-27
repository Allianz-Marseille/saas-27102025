"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/use-auth";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Stethoscope } from "lucide-react";
import { getRoleLabel } from "@/lib/utils/roles";

export default function ProfilePage() {
  const { user, userData } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
            Mon profil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vos informations de compte
          </p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid gap-6 max-w-3xl">
          {/* Carte d'informations utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Vos informations de compte Commercial Santé Individuel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rôle</p>
                  <Badge variant="outline" className="mt-1 border-green-500 text-green-600">
                    {userData?.role ? getRoleLabel(userData.role) : "Commercial"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge 
                    variant="outline" 
                    className={`mt-1 ${
                      userData?.active 
                        ? "border-green-500 text-green-600 dark:text-green-400" 
                        : "border-red-500 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {userData?.active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carte d'informations de domaine */}
          <Card>
            <CardHeader>
              <CardTitle>Domaine d'activité</CardTitle>
              <CardDescription>
                Votre spécialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Santé Individuelle</p>
                  <p className="text-sm text-muted-foreground">
                    Gestion des contrats de santé individuelle et calcul des commissions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carte de paramètres à venir */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>
                Gérez vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les paramètres du profil seront disponibles prochainement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

