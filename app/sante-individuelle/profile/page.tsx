"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/use-auth";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Stethoscope, Sparkles, Crown, Zap, Star, Activity } from "lucide-react";
import { getRoleLabel } from "@/lib/utils/roles";

export default function ProfilePage() {
  const { user, userData } = useAuth();

  // Extraire le prénom depuis l'email
  const rawFirstName = userData?.email.split('@')[0]?.split('.')[0] || 'Utilisateur';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
  const lastName = userData?.email.split('@')[0]?.split('.')[1]?.toUpperCase() || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 cyber-grid relative">
      {/* Effet de lumière de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Gaming */}
      <header className="border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 shadow-md supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80 energy-border">
        <div className="container mx-auto px-6 py-4 relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent neon-text flex items-center gap-2">
            <User className="h-6 w-6 text-green-500" />
            Mon profil
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500" />
            Vos informations de compte
          </p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 relative z-10">
        <div className="grid gap-6 max-w-4xl mx-auto">
          {/* Carte Avatar / Hero - Style Super Héro */}
          <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative group">
            <div className="absolute inset-0 holographic opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 cyber-grid opacity-10" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-6">
                {/* Avatar avec effets gaming */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 flex items-center justify-center text-white shadow-2xl shadow-green-500/50 card-3d neon-border relative overflow-hidden group">
                    <div className="absolute inset-0 holographic opacity-20" />
                    <span className="text-6xl font-black relative z-10">{firstName.charAt(0)}</span>
                    {/* Effet de scan */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-1000" />
                  </div>
                  {/* Badge niveau */}
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl achievement-badge">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Info utilisateur */}
                <div className="flex-1">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2 neon-text">
                    {firstName} {lastName}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-3 py-1 shadow-lg">
                      <Stethoscope className="h-3 w-3 mr-1" />
                      Commercial Santé
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`font-bold px-3 py-1 ${
                        userData?.active 
                          ? "border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20" 
                          : "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
                      }`}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      {userData?.active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </p>
                </div>

                {/* Stats rapides */}
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 text-center glass-morphism">
                    <Star className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">5</div>
                    <div className="text-xs text-muted-foreground font-bold">Niveau MAX</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 text-center glass-morphism">
                    <Zap className="h-6 w-6 mx-auto text-purple-600 dark:text-purple-400 mb-1" />
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">Pro</div>
                    <div className="text-xs text-muted-foreground font-bold">Status</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grille d'informations - Style Gaming */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Carte d'informations utilisateur */}
            <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative card-3d group">
              <div className="absolute inset-0 cyber-grid opacity-10" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 font-black">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  Informations personnelles
                </CardTitle>
                <CardDescription className="font-semibold">
                  Vos informations de compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-500/10 transition-all duration-300 card-3d">
                  <div className="p-2 bg-green-500/20 rounded-lg neon-border">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-bold">Email</p>
                    <p className="font-bold text-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-500/10 transition-all duration-300 card-3d">
                  <div className="p-2 bg-emerald-500/20 rounded-lg neon-border">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-bold">Rôle</p>
                    <Badge className="mt-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-lg">
                      {userData?.role ? getRoleLabel(userData.role) : "Commercial"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-500/10 transition-all duration-300 card-3d">
                  <div className="p-2 bg-blue-500/20 rounded-lg neon-border">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-bold">Statut</p>
                    <Badge 
                      className={`mt-1 font-bold shadow-lg ${
                        userData?.active 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                      }`}
                    >
                      {userData?.active ? "✓ Actif" : "✗ Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carte d'informations de domaine */}
            <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative card-3d group">
              <div className="absolute inset-0 cyber-grid opacity-10" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 font-black">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  Domaine d'activité
                </CardTitle>
                <CardDescription className="font-semibold">
                  Votre spécialisation
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-500/50 glass-morphism relative overflow-hidden group">
                  <div className="absolute inset-0 holographic opacity-10 group-hover:opacity-20 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-2xl shadow-green-500/50 neon-border">
                      <Stethoscope className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Santé Individuelle
                      </p>
                      <p className="text-sm text-muted-foreground font-semibold mt-1">
                        Gestion des contrats de santé individuelle et calcul des commissions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats domaine */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-center">
                    <div className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">∞</div>
                    <div className="text-xs text-muted-foreground font-bold mt-1">Potentiel</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-center">
                    <div className="text-2xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Pro</div>
                    <div className="text-xs text-muted-foreground font-bold mt-1">Expertise</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carte des achievements */}
          <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative">
            <div className="absolute inset-0 cyber-grid opacity-10" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 font-black">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                Succès & Compétences
              </CardTitle>
              <CardDescription className="font-semibold">
                Vos réussites et capacités
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Star className="h-8 w-8" />, label: "Expert Santé", color: "from-yellow-500 to-orange-500", achieved: true },
                  { icon: <Zap className="h-8 w-8" />, label: "Rapidité", color: "from-blue-500 to-cyan-500", achieved: true },
                  { icon: <Shield className="h-8 w-8" />, label: "Fiabilité", color: "from-green-500 to-emerald-500", achieved: true },
                  { icon: <Crown className="h-8 w-8" />, label: "Champion", color: "from-purple-500 to-pink-500", achieved: true },
                ].map((achievement, index) => (
                  <div
                    key={index}
                    className={`relative p-6 rounded-xl bg-gradient-to-br ${achievement.color} text-white text-center shadow-2xl card-3d group cursor-pointer achievement-badge`}
                  >
                    <div className="absolute inset-0 holographic opacity-20 group-hover:opacity-40 transition-opacity rounded-xl" />
                    <div className="relative z-10">
                      <div className="flex justify-center mb-2 group-hover:scale-125 transition-transform duration-300">
                        {achievement.icon}
                      </div>
                      <p className="text-sm font-black">{achievement.label}</p>
                    </div>
                    {achievement.achieved && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-green-500">
                          <span className="text-green-500 font-black">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Carte de paramètres à venir */}
          <Card className="border-0 shadow-2xl glass-morphism overflow-hidden relative card-3d">
            <div className="absolute inset-0 cyber-grid opacity-10" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 font-black">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Paramètres
              </CardTitle>
              <CardDescription className="font-semibold">
                Gérez vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-indigo-600 dark:text-indigo-400 mb-3" />
                <p className="text-muted-foreground font-bold">
                  Les paramètres du profil seront disponibles prochainement.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Nouvelles fonctionnalités en développement ! 🚀
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
