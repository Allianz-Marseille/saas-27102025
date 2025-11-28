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
import { Heart, TrendingUp, TrendingDown, DollarSign, FileText, Users, Award, Target, Download, Mail, ExternalLink, Search, Filter, BarChart3, PieChart, History, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { calculateHealthKPI } from "@/lib/utils/health-kpi";
import { HealthAct } from "@/types";
import { Timestamp } from "firebase/firestore";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    seuilAtteint: number;
    objectifRestant: number;
    nbAffaireNouvelle: number;
    nbRevision: number;
    nbAdhesionSalarie: number;
    nbCourtToAz: number;
    nbAzToCourtage: number;
    prochainSeuil: number;
  };
}

interface HistoricalData {
  month: string;
  monthKey: string;
  data: CommercialData[];
}

export default function AdminSanteIndividuellePage() {
  const [commerciaux, setCommerciaux] = useState<CommercialData[]>([]);
  const [commerciauxPrevMonth, setCommerciauxPrevMonth] = useState<CommercialData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeuil, setFilterSeuil] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("caPondere");
  const [showGraphs, setShowGraphs] = useState(true);

  const loadCommercialData = async (monthKey: string, userId: string, userData: any): Promise<CommercialData | null> => {
    if (!db) return null;

    const actsRef = collection(db, "health_acts");
    const actsQuery = query(
      actsRef,
      where("commercialId", "==", userId),
      where("monthKey", "==", monthKey)
    );
    const actsSnapshot = await getDocs(actsQuery);

    const acts: HealthAct[] = actsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateEffet: data.dateEffet instanceof Timestamp ? data.dateEffet.toDate() : data.dateEffet,
        dateSaisie: data.dateSaisie instanceof Timestamp ? data.dateSaisie.toDate() : data.dateSaisie,
      } as HealthAct;
    });

    const kpis = calculateHealthKPI(acts);
    const name = userData.email.split('@')[0].split('.').map(
      (part: string) => part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');

    return {
      id: userId,
      email: userData.email,
      name,
      acts,
      kpis,
    };
  };

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
      const commerciauxPrevData: CommercialData[] = [];
      
      // Calculer le mois précédent
      const prevMonthDate = subMonths(new Date(selectedMonth + "-01"), 1);
      const prevMonthKey = format(prevMonthDate, "yyyy-MM");

      // 2. Pour chaque commercial, récupérer ses actes du mois actuel et précédent
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Mois actuel
        const currentData = await loadCommercialData(selectedMonth, userDoc.id, userData);
        if (currentData) commerciauxData.push(currentData);

        // Mois précédent
        const prevData = await loadCommercialData(prevMonthKey, userDoc.id, userData);
        if (prevData) commerciauxPrevData.push(prevData);
      }

      // Trier par CA pondéré décroissant
      commerciauxData.sort((a, b) => b.kpis.caPondere - a.kpis.caPondere);
      commerciauxPrevData.sort((a, b) => b.kpis.caPondere - a.kpis.caPondere);

      setCommerciaux(commerciauxData);
      setCommerciauxPrevMonth(commerciauxPrevData);

      // Charger l'historique (6 derniers mois)
      const historical: HistoricalData[] = [];
      for (let i = 5; i >= 0; i--) {
        const histMonthDate = subMonths(new Date(selectedMonth + "-01"), i);
        const histMonthKey = format(histMonthDate, "yyyy-MM");
        const histData: CommercialData[] = [];

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const data = await loadCommercialData(histMonthKey, userDoc.id, userData);
          if (data) histData.push(data);
        }

        historical.push({
          month: format(histMonthDate, "MMMM yyyy", { locale: fr }),
          monthKey: histMonthKey,
          data: histData,
        });
      }

      setHistoricalData(historical);
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
      nbActes: acc.nbActes + c.acts.length,
      caTotal: acc.caTotal + c.kpis.caTotal,
      caPondere: acc.caPondere + c.kpis.caPondere,
      commissions: acc.commissions + c.kpis.commissionsAcquises,
    }),
    { nbActes: 0, caTotal: 0, caPondere: 0, commissions: 0 }
  );

  // Calculer la tendance vs mois précédent
  const getTrend = (commercial: CommercialData, metric: 'acts' | 'caPondere' | 'commissions'): { value: number; isPositive: boolean } => {
    const prev = commerciauxPrevMonth.find(c => c.id === commercial.id);
    if (!prev) return { value: 0, isPositive: true };

    let current = 0;
    let previous = 0;

    switch (metric) {
      case 'acts':
        current = commercial.acts.length;
        previous = prev.acts.length;
        break;
      case 'caPondere':
        current = commercial.kpis.caPondere;
        previous = prev.kpis.caPondere;
        break;
      case 'commissions':
        current = commercial.kpis.commissionsAcquises;
        previous = prev.kpis.commissionsAcquises;
        break;
    }

    if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  // Filtres et tri
  const filteredAndSorted = commerciaux
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeuil = filterSeuil === "all" || c.kpis.seuilAtteint.toString() === filterSeuil;
      return matchesSearch && matchesSeuil;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'acts':
          return b.acts.length - a.acts.length;
        case 'caTotal':
          return b.kpis.caTotal - a.kpis.caTotal;
        case 'caPondere':
          return b.kpis.caPondere - a.kpis.caPondere;
        case 'commissions':
          return b.kpis.commissionsAcquises - a.kpis.commissionsAcquises;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.kpis.caPondere - a.kpis.caPondere;
      }
    });

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Commercial', 'Email', 'Actes', 'CA Total', 'CA Pondéré', 'Commissions', 'Taux', 'Seuil'];
    const rows = filteredAndSorted.map(c => [
      c.name,
      c.email,
      c.acts.length,
      c.kpis.caTotal.toFixed(2),
      c.kpis.caPondere.toFixed(2),
      c.kpis.commissionsAcquises.toFixed(2),
      `${(c.kpis.tauxCommission * 100).toFixed(0)}%`,
      c.kpis.seuilAtteint,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sante-individuelle-${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export CSV réussi !');
  };

  // Données pour graphiques
  const evolutionData = historicalData.map(h => {
    const total = h.data.reduce((sum, c) => sum + c.kpis.caPondere, 0);
    const acts = h.data.reduce((sum, c) => sum + c.acts.length, 0);
    const commissions = h.data.reduce((sum, c) => sum + c.kpis.commissionsAcquises, 0);
    return {
      month: format(new Date(h.monthKey + "-01"), "MMM yy", { locale: fr }),
      'CA Pondéré': total,
      'Actes': acts,
      'Commissions': commissions,
    };
  });

  const repartitionData = [
    { name: 'Affaire Nouvelle', value: totaux.nbActes > 0 ? commerciaux.reduce((sum, c) => sum + c.kpis.nbAffaireNouvelle, 0) : 0, color: '#3b82f6' },
    { name: 'Révision', value: totaux.nbActes > 0 ? commerciaux.reduce((sum, c) => sum + c.kpis.nbRevision, 0) : 0, color: '#a855f7' },
    { name: 'Adhésion Salarié', value: totaux.nbActes > 0 ? commerciaux.reduce((sum, c) => sum + c.kpis.nbAdhesionSalarie, 0) : 0, color: '#f97316' },
    { name: 'COURT → AZ', value: totaux.nbActes > 0 ? commerciaux.reduce((sum, c) => sum + c.kpis.nbCourtToAz, 0) : 0, color: '#06b6d4' },
    { name: 'AZ → Courtage', value: totaux.nbActes > 0 ? commerciaux.reduce((sum, c) => sum + c.kpis.nbAzToCourtage, 0) : 0, color: '#10b981' },
  ].filter(item => item.value > 0);

  const comparisonData = filteredAndSorted.map(c => ({
    name: c.name.split(' ')[0], // Prénom seulement pour le graphique
    'CA Pondéré': c.kpis.caPondere,
    'Actes': c.acts.length,
    'Commissions': c.kpis.commissionsAcquises,
  }));

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

  // Vérifier si commercial est nouveau (première fois qu'on le voit)
  const isNewCommercial = (commercial: CommercialData) => {
    const prev = commerciauxPrevMonth.find(c => c.id === commercial.id);
    return !prev || prev.acts.length === 0;
  };

  // Vérifier si en retard (performance faible)
  const isUnderperforming = (commercial: CommercialData) => {
    return commercial.kpis.caPondere < 5000 && commercial.acts.length < 3;
  };

  // Vérifier si excellent (dépassement objectif)
  const isExcellent = (commercial: CommercialData) => {
    return commercial.kpis.seuilAtteint >= 3 || commercial.kpis.caPondere >= 18000;
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

        {/* Navigation mensuelle */}
        <MonthSelector 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
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

      {/* Graphiques */}
      {showGraphs && commerciaux.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Évolution 6 mois */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-pink-600" />
                Évolution sur 6 mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorCaPondere" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCommissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="CA Pondéré" stroke="#a855f7" fill="url(#colorCaPondere)" />
                  <Area type="monotone" dataKey="Commissions" stroke="#eab308" fill="url(#colorCommissions)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition types d'actes */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-pink-600" />
                Répartition des types d'actes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repartitionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={repartitionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {repartitionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparaison entre commerciaux */}
      {showGraphs && filteredAndSorted.length > 1 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-pink-600" />
              Comparaison entre commerciaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="CA Pondéré" fill="#a855f7" />
                <Bar dataKey="Commissions" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filtres et actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-pink-600" />
                Détail par commercial
              </CardTitle>
              <CardDescription>
                Performance individuelle des commerciaux santé individuelle
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGraphs(!showGraphs)}
              >
                {showGraphs ? 'Masquer' : 'Afficher'} graphiques
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche et filtres */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un commercial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterSeuil} onValueChange={setFilterSeuil}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par seuil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les seuils</SelectItem>
                <SelectItem value="1">Seuil 1</SelectItem>
                <SelectItem value="2">Seuil 2</SelectItem>
                <SelectItem value="3">Seuil 3</SelectItem>
                <SelectItem value="4">Seuil 4</SelectItem>
                <SelectItem value="5">Seuil 5</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="caPondere">CA Pondéré</SelectItem>
                <SelectItem value="acts">Nombre d'actes</SelectItem>
                <SelectItem value="caTotal">CA Total</SelectItem>
                <SelectItem value="commissions">Commissions</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
            </div>
          ) : commerciaux.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun commercial santé individuelle actif
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun commercial ne correspond aux critères de recherche
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSorted.map((commercial, index) => {
                const trendActs = getTrend(commercial, 'acts');
                const trendCa = getTrend(commercial, 'caPondere');
                const trendCommissions = getTrend(commercial, 'commissions');
                const progress = commercial.kpis.prochainSeuil > 0 
                  ? (commercial.kpis.caPondere / commercial.kpis.prochainSeuil) * 100 
                  : 100;
                
                return (
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{commercial.name}</h3>
                            {isNewCommercial(commercial) && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Nouveau
                              </Badge>
                            )}
                            {isExcellent(commercial) && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Excellent
                              </Badge>
                            )}
                            {isUnderperforming(commercial) && (
                              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                En retard
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{commercial.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && filteredAndSorted.length > 1 && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            🏆 Meilleur
                          </Badge>
                        )}
                        <Badge className={cn("font-bold", getSeuilCouleur(commercial.kpis.seuilAtteint))}>
                          Seuil {commercial.kpis.seuilAtteint}
                        </Badge>
                        {/* Actions rapides */}
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`mailto:${commercial.email}`, '_blank')}
                            title="Envoyer un email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`/sante-individuelle?commercial=${commercial.id}`, '_blank')}
                            title="Voir les actes"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression vers prochain seuil */}
                    {commercial.kpis.prochainSeuil > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Progression vers Seuil {commercial.kpis.seuilAtteint + 1}
                          </span>
                          <span className="text-xs font-bold">
                            {progress.toFixed(0)}% • {formatCurrency(commercial.kpis.objectifRestant)} restants
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-600 transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* KPIs du commercial avec tendances */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1 flex items-center justify-between">
                          <span>Actes</span>
                          {trendActs.value > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-[10px]",
                              trendActs.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {trendActs.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {trendActs.value.toFixed(0)}%
                            </div>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {commercial.acts.length}
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
                        <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1 flex items-center justify-between">
                          <span>CA Pondéré</span>
                          {trendCa.value > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-[10px]",
                              trendCa.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {trendCa.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {trendCa.value.toFixed(0)}%
                            </div>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {formatCurrency(commercial.kpis.caPondere)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            Commissions
                            <span className="text-[10px]">({(commercial.kpis.tauxCommission * 100).toFixed(0)}%)</span>
                          </span>
                          {trendCommissions.value > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 text-[10px]",
                              trendCommissions.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {trendCommissions.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {trendCommissions.value.toFixed(0)}%
                            </div>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                          {formatCurrency(commercial.kpis.commissionsAcquises)}
                        </div>
                      </div>
                    </div>

                    {/* Répartition des types d'actes */}
                    {commercial.acts.length > 0 && (
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique mensuel */}
      {historicalData.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-pink-600" />
              Historique des 6 derniers mois
            </CardTitle>
            <CardDescription>
              Évolution mensuelle de la performance globale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-bold text-sm">Mois</th>
                    <th className="text-right p-3 font-bold text-sm">Commerciaux</th>
                    <th className="text-right p-3 font-bold text-sm">Actes</th>
                    <th className="text-right p-3 font-bold text-sm">CA Pondéré</th>
                    <th className="text-right p-3 font-bold text-sm">Commissions</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.map((h) => {
                    const total = h.data.reduce((sum, c) => sum + c.kpis.caPondere, 0);
                    const acts = h.data.reduce((sum, c) => sum + c.acts.length, 0);
                    const commissions = h.data.reduce((sum, c) => sum + c.kpis.commissionsAcquises, 0);
                    return (
                      <tr key={h.monthKey} className="border-b hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-3 font-semibold">{h.month}</td>
                        <td className="p-3 text-right">{h.data.length}</td>
                        <td className="p-3 text-right font-bold">{acts}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(total)}</td>
                        <td className="p-3 text-right font-bold text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(commissions)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

