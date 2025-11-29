"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Coins, Plus, TrendingUp, TrendingDown, Trophy, AlertTriangle, Shield, Gem, Handshake, Star, DollarSign, Package, CheckCircle, User, Sparkles } from "lucide-react";
import { getAvailableYears, getYearCommissions } from "@/lib/firebase/agency-commissions";
import { AgencyCommission } from "@/types";
import { formatCurrencyInteger, formatThousands, getMonthShortName, extrapolateYear } from "@/lib/utils/commission-calculator";
import { MonthDataDialog } from "@/components/admin/commissions/month-data-dialog";
import { CreateYearDialog } from "@/components/admin/commissions/create-year-dialog";
import { cn } from "@/lib/utils";

export default function CommissionsAgencePage() {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearData, setYearData] = useState<AgencyCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les modals
  const [monthDialog, setMonthDialog] = useState<{
    open: boolean;
    month: number;
    data: AgencyCommission | null;
  }>({ open: false, month: 1, data: null });
  
  const [createYearDialog, setCreateYearDialog] = useState(false);

  // Charger les années disponibles
  const loadYears = async () => {
    const years = await getAvailableYears();
    setAvailableYears(years);
    
    if (years.length > 0) {
      // Par défaut: année la plus récente
      const latestYear = Math.max(...years);
      setSelectedYear(latestYear);
    }
  };

  // Charger les données de l'année sélectionnée
  const loadYearData = async () => {
    setIsLoading(true);
    const data = await getYearCommissions(selectedYear);
    setYearData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadYearData();
    }
  }, [selectedYear]);

  const handleMonthClick = (month: number) => {
    const existingData = yearData.find((d) => d.month === month) || null;
    setMonthDialog({ open: true, month, data: existingData });
  };

  const handleDialogSuccess = () => {
    loadYearData();
  };

  const handleCreateYearSuccess = () => {
    loadYears();
  };

  // Calculer les KPIs
  const totals = yearData.reduce(
    (acc, month) => ({
      totalCommissions: acc.totalCommissions + month.totalCommissions,
      chargesAgence: acc.chargesAgence + month.chargesAgence,
      resultat: acc.resultat + month.resultat,
      commissionsIARD: acc.commissionsIARD + month.commissionsIARD,
      commissionsVie: acc.commissionsVie + month.commissionsVie,
      commissionsCourtage: acc.commissionsCourtage + month.commissionsCourtage,
      profitsExceptionnels: acc.profitsExceptionnels + month.profitsExceptionnels,
    }),
    {
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
    }
  );

  const monthsWithData = yearData.filter((d) => d.totalCommissions > 0 || d.chargesAgence > 0).length;
  const averageMonthly = monthsWithData > 0 ? Math.round(totals.resultat / monthsWithData) : 0;
  
  const extrapolated = extrapolateYear(yearData);
  const isIncomplete = monthsWithData < 12;

  // Meilleur et pire mois
  const monthsWithResults = yearData.filter((d) => d.totalCommissions > 0);
  const bestMonth = monthsWithResults.length > 0 
    ? monthsWithResults.reduce((max, m) => m.resultat > max.resultat ? m : max)
    : null;
  const worstMonth = monthsWithResults.length > 0
    ? monthsWithResults.reduce((min, m) => m.resultat < min.resultat ? m : min)
    : null;

  const rows = [
    { icon: Shield, label: "🛡️ IARD", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30", getValue: (m: AgencyCommission) => m.commissionsIARD },
    { icon: Gem, label: "💎 Vie", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30", getValue: (m: AgencyCommission) => m.commissionsVie },
    { icon: Handshake, label: "🤝 Courtage", color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/30", getValue: (m: AgencyCommission) => m.commissionsCourtage },
    { icon: Star, label: "⭐ Profits except.", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30", getValue: (m: AgencyCommission) => m.profitsExceptionnels },
    { icon: DollarSign, label: "💰 Total", color: "text-yellow-600", bgColor: "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30", getValue: (m: AgencyCommission) => m.totalCommissions, isTotal: true },
    { icon: Package, label: "📦 Charges", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30", getValue: (m: AgencyCommission) => m.chargesAgence },
    { icon: CheckCircle, label: "✅ Résultat", color: "text-green-600", bgColor: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30", getValue: (m: AgencyCommission) => m.resultat, isResult: true },
    { icon: User, label: "👤 Prélèv. Julien", color: "text-blue-600", bgColor: "bg-blue-50/50 dark:bg-blue-950/20", getValue: (m: AgencyCommission) => m.prelevementsJulien, isInfo: true },
    { icon: User, label: "👤 Prélèv. J-M", color: "text-blue-600", bgColor: "bg-blue-50/50 dark:bg-blue-950/20", getValue: (m: AgencyCommission) => m.prelevementsJeanMichel, isInfo: true },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-xl animate-pulse">
            <Coins className="h-8 w-8 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              COMMISSIONS AGENCE
            </h1>
            <p className="text-sm text-muted-foreground font-semibold">Suivi mensuel et annuel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sélecteur d'année */}
          {availableYears.length > 0 ? (
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v, 10))}>
              <SelectTrigger className="w-40 font-bold text-lg border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="font-bold">
                    {year}
                    {year === new Date().getFullYear() && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Actuelle
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="px-4 py-2">
              Aucune année
            </Badge>
          )}

          <Button
            onClick={() => setCreateYearDialog(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl gap-2 font-bold"
          >
            <Plus className="h-4 w-4" />
            Créer une année
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {monthsWithData > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                {isIncomplete ? "Total Extrapolé" : "Total Année"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {formatCurrencyInteger(isIncomplete ? extrapolated.resultat : totals.resultat)}
              </div>
              {isIncomplete && (
                <p className="text-xs text-muted-foreground mt-1 font-semibold">
                  Basé sur {monthsWithData} mois
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-600" />
                Meilleur Mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bestMonth ? (
                <>
                  <div className="text-2xl font-black text-green-600">
                    {formatCurrencyInteger(bestMonth.resultat)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">
                    🏆 {getMonthShortName(bestMonth.month)} {selectedYear}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Pire Mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              {worstMonth ? (
                <>
                  <div className="text-2xl font-black text-orange-600">
                    {formatCurrencyInteger(worstMonth.resultat)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">
                    ⚠️ {getMonthShortName(worstMonth.month)} {selectedYear}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Moyenne Mensuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-purple-600">
                {formatCurrencyInteger(averageMonthly)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">
                Sur {monthsWithData} mois
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau principal */}
      <Card className="border-2 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-b-2">
          <CardTitle className="flex items-center gap-2 font-black">
            <Coins className="h-5 w-5 text-yellow-600" />
            Tableau mensuel {selectedYear}
            {isIncomplete && (
              <Badge variant="secondary" className="ml-2">
                {monthsWithData} / 12 mois
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Chargement...</div>
          ) : yearData.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-muted-foreground font-semibold">Aucune donnée pour {selectedYear}</p>
              <Button
                onClick={() => setCreateYearDialog(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2 font-bold"
              >
                <Plus className="h-4 w-4" />
                Créer cette année
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left font-black text-sm">Métrique</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <th key={month} className="px-3 py-3 text-center font-black text-sm">
                        {getMonthShortName(month)}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-black text-sm bg-muted">
                      {isIncomplete ? "Extrapolé" : "Total"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const rowTotal = yearData.reduce((sum, m) => sum + row.getValue(m), 0);
                    const extrapolatedValue = isIncomplete && !row.isInfo
                      ? Math.round((rowTotal / monthsWithData) * 12)
                      : rowTotal;

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          "border-b hover:bg-muted/30 transition-colors",
                          row.bgColor
                        )}
                      >
                        <td className={cn("px-4 py-3 font-bold text-sm", row.color)}>
                          {row.label}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                          const monthData = yearData.find((d) => d.month === month);
                          const value = monthData ? row.getValue(monthData) : 0;
                          const hasData = monthData && (monthData.totalCommissions > 0 || monthData.chargesAgence > 0);

                          return (
                            <td
                              key={month}
                              onClick={() => handleMonthClick(month)}
                              className={cn(
                                "px-3 py-3 text-center font-mono cursor-pointer",
                                "hover:bg-yellow-100 dark:hover:bg-yellow-950/40 hover:scale-105 transition-all",
                                "border-l border-border/50",
                                row.isTotal && "font-black text-yellow-700 dark:text-yellow-400",
                                row.isResult && "font-black text-green-700 dark:text-green-400",
                                !hasData && "text-muted-foreground/50"
                              )}
                            >
                              {hasData ? formatThousands(value) : "—"}
                            </td>
                          );
                        })}
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono font-black text-lg border-l-2 bg-muted/50",
                            row.isTotal && "text-yellow-700 dark:text-yellow-400",
                            row.isResult && (isIncomplete && !row.isInfo ? extrapolatedValue : rowTotal) >= 0 
                              ? "text-green-700 dark:text-green-400" 
                              : row.isResult && "text-red-700 dark:text-red-400"
                          )}
                        >
                          {formatThousands(isIncomplete && !row.isInfo ? extrapolatedValue : rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
          💡 <span className="font-black">Astuce:</span> Cliquez sur n'importe quel mois pour saisir ou modifier les données
        </p>
      </div>

      {/* Dialogs */}
      <MonthDataDialog
        open={monthDialog.open}
        onOpenChange={(open) => setMonthDialog({ ...monthDialog, open })}
        year={selectedYear}
        month={monthDialog.month}
        existingData={monthDialog.data}
        onSuccess={handleDialogSuccess}
      />

      <CreateYearDialog
        open={createYearDialog}
        onOpenChange={setCreateYearDialog}
        onSuccess={handleCreateYearSuccess}
        existingYears={availableYears}
      />
    </div>
  );
}
