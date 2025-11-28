"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Heart, TrendingUp, DollarSign, FileText, Users, Calendar, Award, Target } from "lucide-react";
import { calculateHealthKPI } from "@/lib/utils/health-kpi";
import { HealthAct } from "@/types";
import { Timestamp } from "firebase/firestore";

interface CommercialData {
  id: string;
  email: string;
  name: string;
  acts: HealthAct[];
  kpis: {
    caTotal: number;
    caPondere: number;
    commissionsAcquises: number;
    tauxCommission: number;
    nbActes: number;
    seuilAtteint: number;
    objectifRestant: number;
    nbAffaireNouvelle: number;
    nbRevision: number;
    nbAdhesionSalarie: number;
    nbCourtToAz: number;
    nbAzToCourtage: number;
  };
}

export default function AdminSanteIndividuellePage() {
  const [commerciaux, setCommerciaux] = useState<CommercialData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!db) {
        throw new Error("Firebase non initialisé");
      }

      // 1. Récupérer tous les commerciaux santé individuelle
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "COMMERCIAL_SANTE_INDIVIDUEL"), where("active", "==", true));
      const usersSnapshot = await getDocs(q);

      const commerciauxData: CommercialData[] = [];

      // 2. Pour chaque commercial, récupérer ses actes du mois
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Récupérer les actes du mois
        const actsRef = collection(db, "health_acts");
        const actsQuery = query(
          actsRef,
          where("commercialId", "==", userDoc.id),
          where("monthKey", "==", selectedMonth)
        );
        const actsSnapshot = await getDocs(actsQuery);

        // Convertir les actes
        const acts: HealthAct[] = actsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dateEffet: data.dateEffet instanceof Timestamp ? data.dateEffet.toDate() : data.dateEffet,
            dateSaisie: data.dateSaisie instanceof Timestamp ? data.dateSaisie.toDate() : data.dateSaisie,
          } as HealthAct;
        });

        // Calculer les KPIs
        const kpis = calculateHealthKPI(acts);

        // Extraire le nom depuis l'email
        const name = userData.email.split('@')[0].split('.').map(
          (part: string) => part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');

        commerciauxData.push({
          id: userDoc.id,
          email: userData.email,
          name,
          acts,
          kpis,
        });
      }

      // Trier par CA pondéré décroissant
      commerciauxData.sort((a, b) => b.kpis.caPondere - a.kpis.caPondere);

      setCommerciaux(commerciauxData);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Calculer les totaux globaux
  const totaux = commerciaux.reduce(
    (acc, c) => ({
      nbActes: acc.nbActes + c.kpis.nbActes,
      caTotal: acc.caTotal + c.kpis.caTotal,
      caPondere: acc.caPondere + c.kpis.caPondere,
      commissions: acc.commissions + c.kpis.commissionsAcquises,
    }),
    { nbActes: 0, caTotal: 0, caPondere: 0, commissions: 0 }
  );

  const getSeuilCouleur = (seuil: number) => {
    const colors = [
      "bg-gray-200 text-gray-700",
      "bg-yellow-200 text-yellow-700",
      "bg-blue-200 text-blue-700",
      "bg-indigo-200 text-indigo-700",
      "bg-green-200 text-green-700",
    ];
    return colors[seuil - 1] || colors[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-600" />
            Santé Individuelle
          </h1>
          <p className="text-muted-foreground mt-1">
            Synthèse de l'activité des commerciaux
          </p>
        </div>

        {/* Sélecteur de mois */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-900 font-semibold"
          />
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-400">
              Commerciaux actifs
            </CardTitle>
            <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900 dark:text-pink-100">
              {commerciaux.length}
            </div>
            <p className="text-xs text-pink-600/70 dark:text-pink-400/70 mt-1">
              {format(new Date(selectedMonth), "MMMM yyyy", { locale: fr })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Total actes
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {totaux.nbActes}
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
              CA Pondéré total
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(totaux.caPondere)}
            </div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
              Pour calcul commissions
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Commissions totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
              {formatCurrency(totaux.commissions)}
            </div>
            <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-1">
              À payer ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commerciaux */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-pink-600" />
            Détail par commercial
          </CardTitle>
          <CardDescription>
            Performance individuelle des commerciaux santé individuelle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
            </div>
          ) : commerciaux.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun commercial santé individuelle actif
            </div>
          ) : (
            <div className="space-y-4">
              {commerciaux.map((commercial, index) => (
                <Card
                  key={commercial.id}
                  className="border-2 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {commercial.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{commercial.name}</h3>
                          <p className="text-sm text-muted-foreground">{commercial.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && commerciaux.length > 1 && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            🏆 Meilleur
                          </Badge>
                        )}
                        <Badge className={cn("font-bold", getSeuilCouleur(commercial.kpis.seuilAtteint))}>
                          Seuil {commercial.kpis.seuilAtteint}
                        </Badge>
                      </div>
                    </div>

                    {/* KPIs du commercial */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                          Actes
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {commercial.kpis.nbActes}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">
                          CA Total
                        </div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {formatCurrency(commercial.kpis.caTotal)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                          CA Pondéré
                        </div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {formatCurrency(commercial.kpis.caPondere)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mb-1 flex items-center gap-1">
                          Commissions
                          <span className="text-[10px]">({(commercial.kpis.tauxCommission * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                          {formatCurrency(commercial.kpis.commissionsAcquises)}
                        </div>
                      </div>
                    </div>

                    {/* Répartition des types d'actes */}
                    {commercial.kpis.nbActes > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground font-semibold mb-2">
                          Répartition par type :
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {commercial.kpis.nbAffaireNouvelle > 0 && (
                            <Badge variant="outline" className="text-xs">
                              🆕 AN: {commercial.kpis.nbAffaireNouvelle}
                            </Badge>
                          )}
                          {commercial.kpis.nbRevision > 0 && (
                            <Badge variant="outline" className="text-xs">
                              🔄 Révision: {commercial.kpis.nbRevision}
                            </Badge>
                          )}
                          {commercial.kpis.nbAdhesionSalarie > 0 && (
                            <Badge variant="outline" className="text-xs">
                              👥 Adhésion: {commercial.kpis.nbAdhesionSalarie}
                            </Badge>
                          )}
                          {commercial.kpis.nbCourtToAz > 0 && (
                            <Badge variant="outline" className="text-xs">
                              ➡️ COURT→AZ: {commercial.kpis.nbCourtToAz}
                            </Badge>
                          )}
                          {commercial.kpis.nbAzToCourtage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              ⬅️ AZ→Court: {commercial.kpis.nbAzToCourtage}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

