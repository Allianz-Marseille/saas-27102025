"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherCard } from "@/components/admin/weather-card";
import { motion } from "framer-motion";
import { Sparkles, User, Users, Heart, Building2, AlertTriangle, Construction, TrendingUp, FileText, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getAllCommercials, type UserData } from "@/lib/firebase/auth";
import { getActsByMonth } from "@/lib/firebase/acts";
import { getHealthActsByMonth } from "@/lib/firebase/health-acts";
import { calculateKPI } from "@/lib/utils/kpi";
import { calculateHealthKPI } from "@/lib/utils/health-kpi";
import { toast } from "sonner";

interface RoleSectionProps {
  title: string;
  role: "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL" | "COMMERCIAL_SANTE_COLLECTIVE" | "GESTIONNAIRE_SINISTRE";
  icon: React.ElementType;
  selectedMonth: string;
  underConstruction?: boolean;
  linkHref: string;
  color: string;
}

function RoleSection({ title, role, icon: Icon, selectedMonth, underConstruction, linkHref, color }: RoleSectionProps) {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKPIs] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedUser, role]);

  const loadData = async () => {
    if (underConstruction) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (!db) throw new Error("Firebase non initialisé");

      // Charger les utilisateurs du rôle
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where("role", "==", role), where("active", "==", true));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as UserData[];
      setUsers(usersData);

      // Charger les KPIs selon le rôle
      if (role === "CDC_COMMERCIAL") {
        // Commerciaux
        const acts = await getActsByMonth(selectedUser === "all" ? null : selectedUser, selectedMonth);
        const calculatedKPIs = calculateKPI(acts);
        setKPIs({
          ...calculatedKPIs,
          nbActes: acts.length,
          nbUsers: usersData.length,
        });
      } else if (role === "COMMERCIAL_SANTE_INDIVIDUEL") {
        // Santé Individuelle
        let healthActs = [];
        for (const user of usersData) {
          const acts = await getHealthActsByMonth(selectedMonth, user.id);
          if (selectedUser === "all" || user.id === selectedUser) {
            healthActs.push(...acts);
          }
        }
        const calculatedKPIs = calculateHealthKPI(healthActs);
        setKPIs({
          ...calculatedKPIs,
          nbActes: healthActs.length,
          nbUsers: usersData.length,
        });
      } else {
        // Autres rôles (en construction)
        setKPIs({
          caMensuel: 0,
          commissionsPotentielles: 0,
          nbActes: 0,
          nbUsers: usersData.length,
        });
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  if (underConstruction) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-8 text-center">
          <Construction className={`h-12 w-12 mx-auto mb-4 ${color}`} />
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">Section en construction</p>
          <Button asChild variant="outline" size="sm">
            <Link href={linkHref}>Voir la page →</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${color}`} />
              {title}
            </CardTitle>
            <CardDescription>Performance globale du mois sélectionné</CardDescription>
          </div>

          {/* Filtre utilisateur */}
          {users.length > 0 && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Tous les utilisateurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌟 Tous les utilisateurs ({users.length})</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* KPIs Grid - Ligne 1 : Compteurs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Utilisateurs</p>
                      <p className="text-2xl font-bold">{kpis?.nbUsers || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Total Actes</p>
                      <p className="text-2xl font-bold">{kpis?.nbActes || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Apports Nouveaux (AN)</p>
                      <p className="text-2xl font-bold">{kpis?.nbContrats || 0}</p>
                    </div>
                    <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Process</p>
                      <p className="text-2xl font-bold">{kpis?.nbProcess || 0}</p>
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">M+3, Préterme Auto/IRD</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs Grid - Ligne 2 : CA et Ventilation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="w-full">
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">CA Total</p>
                      <p className="text-2xl font-bold">{formatCurrency(kpis?.caMensuel || kpis?.caTotal || kpis?.caPondere || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-4">
                  <div>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">CA Auto/Moto</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis?.caAuto || 0)}</p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{kpis?.nbContratsAuto || 0} contrats</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30 border-cyan-200 dark:border-cyan-800">
                <CardContent className="p-4">
                  <div>
                    <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mb-1">CA Autres</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis?.caAutres || 0)}</p>
                    <p className="text-xs text-cyan-500 dark:text-cyan-400 mt-0.5">{kpis?.nbContratsAutres || 0} contrats</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs Grid - Ligne 3 : Commissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="w-full">
                      <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Commissions Potentielles</p>
                      <p className="text-2xl font-bold">{formatCurrency(kpis?.commissionsPotentielles || kpis?.commissionsAcquises || 0)}</p>
                      {role === "CDC_COMMERCIAL" && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          Seuil : 200 € minimum
                        </p>
                      )}
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${
                kpis?.commissionValidee 
                  ? 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800' 
                  : 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="w-full">
                      <p className={`text-xs font-medium mb-1 ${
                        kpis?.commissionValidee 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        Commissions Réelles
                      </p>
                      <p className="text-2xl font-bold">{formatCurrency(kpis?.commissionsReelles || 0)}</p>
                      {role === "CDC_COMMERCIAL" && (
                        <p className={`text-xs mt-1 ${
                          kpis?.commissionValidee 
                            ? 'text-green-600 dark:text-green-500' 
                            : 'text-red-600 dark:text-red-500'
                        }`}>
                          {kpis?.commissionValidee ? '✓ Objectifs validés' : '✗ Objectifs non validés'}
                        </p>
                      )}
                    </div>
                    {kpis?.commissionValidee ? (
                      <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 opacity-50" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lien vers page dédiée */}
            <div className="text-center">
              <Button asChild variant="outline" className="gap-2">
                <Link href={linkHref}>
                  Voir le détail complet →
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminHome() {
  const { userData } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getUserName = () => {
    if (!userData?.email) return 'Administrateur';
    const emailParts = userData.email.split('@')[0].split('.');
    const firstName = emailParts[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
          
          <CardContent className="relative z-10 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                  Bonjour {getUserName()} !
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-300/50 dark:border-blue-700/50">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {userData?.email || 'Chargement...'}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold">
                    ADMIN
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-600/20 dark:to-amber-600/20 border border-orange-300/50 dark:border-orange-700/50">
                  <span className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {capitalizeFirstLetter(formattedDate)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 shadow-md">
                  <WeatherCard />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation mensuelle */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </CardContent>
      </Card>

      {/* Sections par rôle */}
      <div className="space-y-6">
        <RoleSection
          title="Commerciaux (CDC)"
          role="CDC_COMMERCIAL"
          icon={Users}
          selectedMonth={selectedMonth}
          linkHref="/admin/commercial"
          color="text-blue-600"
        />

        <RoleSection
          title="Santé Individuelle"
          role="COMMERCIAL_SANTE_INDIVIDUEL"
          icon={Heart}
          selectedMonth={selectedMonth}
          linkHref="/admin/sante-individuelle"
          color="text-pink-600"
        />

        <RoleSection
          title="Santé Collective"
          role="COMMERCIAL_SANTE_COLLECTIVE"
          icon={Building2}
          selectedMonth={selectedMonth}
          linkHref="/admin/sante-collective"
          color="text-emerald-600"
          underConstruction
        />

        <RoleSection
          title="Sinistre"
          role="GESTIONNAIRE_SINISTRE"
          icon={AlertTriangle}
          selectedMonth={selectedMonth}
          linkHref="/admin/sinistre"
          color="text-orange-600"
          underConstruction
        />
      </div>
    </div>
  );
}
