"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, BarChart3 } from "lucide-react";
import { getActsByMonth, type Act } from "@/lib/firebase/acts";
import { getAllCommercials } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

interface CommercialRankingByContract {
  id: string;
  email: string;
  nbContrats: number;
  caTotal: number;
  commissions: number;
  percentage: number;
}

interface ContractTypeRankingProps {
  monthKey: string;
}

const CONTRACT_TYPES = [
  { value: "AUTO_MOTO", label: "Auto / Moto" },
  { value: "IRD_PART", label: "IRD Particulier" },
  { value: "IRD_PRO", label: "IRD Professionnel" },
  { value: "PJ", label: "Protection Juridique" },
  { value: "GAV", label: "GAV (Garantie Accident Vie)" },
  { value: "NOP_50_EUR", label: "NOP 50 euros" },
  { value: "SANTE_PREV", label: "Santé / Prévoyance" },
  { value: "VIE_PP", label: "Vie PP (Epargne ou Retraite)" },
  { value: "VIE_PU", label: "Vie PU (Versement libre)" },
];

export function ContractTypeRanking({ monthKey }: ContractTypeRankingProps) {
  const [selectedContractType, setSelectedContractType] = useState<string>("AUTO_MOTO");
  const [rankings, setRankings] = useState<CommercialRankingByContract[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger et calculer les données des commerciaux par type de contrat
  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      try {
        // Récupérer tous les commerciaux
        const commercials = await getAllCommercials();
        
        // Récupérer les actes de tous les commerciaux pour le mois
        const allActs = await getActsByMonth(null, monthKey);
        
        // Calculer les données par commercial pour le type de contrat sélectionné
        const commercialData: CommercialRankingByContract[] = commercials.map((commercial) => {
          const commercialActs = allActs.filter(act => act.userId === commercial.id);
          
          // Filtrer uniquement les AN (Apport Nouveau) pour les contrats
          const actsAN = commercialActs.filter(act => act.kind === "AN");
          
          // Filtrer par type de contrat
          const contractsByType = actsAN.filter(
            act => act.contratType === selectedContractType
          );
          
          const nbContrats = contractsByType.length;
          
          const caTotal = contractsByType.reduce((sum, act) => {
            const ca = (act.primeAnnuelle || 0) + (act.montantVersement || 0);
            return sum + ca;
          }, 0);
          
          const commissions = contractsByType.reduce((sum, act) => {
            return sum + (act.commissionPotentielle || 0);
          }, 0);
          
          return {
            id: commercial.id,
            email: commercial.email,
            nbContrats,
            caTotal,
            commissions,
            percentage: 0, // Calculé plus bas
          };
        }).filter(commercial => commercial.nbContrats > 0); // Garder seulement ceux qui ont des contrats
        
        // Calculer les pourcentages
        const maxCa = commercialData.length > 0 
          ? Math.max(...commercialData.map(c => c.caTotal)) 
          : 1;
        
        const rankingsWithPercentage = commercialData.map(commercial => ({
          ...commercial,
          percentage: maxCa > 0 ? (commercial.caTotal / maxCa) * 100 : 0,
        }));
        
        // Trier par CA décroissant
        const sortedRankings = [...rankingsWithPercentage].sort((a, b) => b.caTotal - a.caTotal);
        
        setRankings(sortedRankings);
        
      } catch (error) {
        console.error("Erreur lors du chargement des classements par type:", error);
        toast.error("Impossible de charger les classements par type de contrat");
      } finally {
        setLoading(false);
      }
    };

    if (monthKey) {
      loadRankings();
    }
  }, [monthKey, selectedContractType]);

  const getBarColor = (index: number, total: number) => {
    const percentage = ((index + 1) / total) * 100;
    if (percentage <= 20) return "bg-green-600";
    if (percentage <= 40) return "bg-green-500";
    if (percentage <= 60) return "bg-yellow-500";
    if (percentage <= 80) return "bg-orange-500";
    return "bg-red-500";
  };

  const getContractTypeLabel = (value: string) => {
    return CONTRACT_TYPES.find(type => type.value === value)?.label || value;
  };

  return (
    <Card className="border-l-4 border-l-purple-500 relative">
      <div className="absolute -top-1 left-0 right-0 h-1 bg-purple-500 rounded-t-lg" />
      <div className="absolute -left-1 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg" />
      
      <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <BarChart3 className="h-5 w-5" />
              Section 3 : Classement par type de contrat
            </CardTitle>
            <CardDescription className="mt-1">
              Classement des commerciaux pour chaque type de contrat
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="contract-type-select">Type :</Label>
            <Select value={selectedContractType} onValueChange={setSelectedContractType}>
              <SelectTrigger id="contract-type-select" className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Chargement...</p>
        ) : rankings.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucune donnée pour ce type de contrat ce mois-ci
          </p>
        ) : (
          <div className="space-y-6">
            {/* Header avec effet wow */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/40 dark:via-pink-950/20 dark:to-purple-950/40 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                {/* Type de contrat */}
                <div className="text-center mb-6">
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Type de contrat sélectionné</p>
                  <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                    {getContractTypeLabel(selectedContractType)}
                  </h2>
                </div>
                
                {/* Statistiques en grand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Total contrats */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Total contrats</p>
                      <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {rankings.reduce((sum, r) => sum + r.nbContrats, 0)}
                      </p>
                      <div className="mt-3 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* CA total */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 shadow-xl">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">CA total</p>
                      <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {formatCurrency(rankings.reduce((sum, r) => sum + r.caTotal, 0))}
                      </p>
                      <div className="mt-3 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Classement des commerciaux */}
            <div className="space-y-4">
              {rankings.map((commercial, index) => {
                const isTop3 = index < 3;
                const medalColors = [
                  "from-yellow-400 to-amber-500", // Or
                  "from-gray-300 to-slate-400", // Argent
                  "from-orange-400 to-amber-600", // Bronze
                ];
                
                return (
                  <div 
                    key={commercial.id} 
                    className={`relative overflow-hidden rounded-xl border-2 p-5 transition-all hover:scale-102 hover:shadow-2xl ${
                      isTop3 
                        ? "border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50/50 via-white to-yellow-50/50 dark:from-yellow-950/20 dark:via-slate-900 dark:to-yellow-950/20 shadow-xl" 
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md hover:border-purple-300 dark:hover:border-purple-700"
                    }`}
                  >
                    {/* Effet de brillance pour le top 3 */}
                    {isTop3 && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-300/10 to-transparent rounded-full blur-2xl"></div>
                    )}
                    
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Badge de position */}
                        <div className={`flex items-center justify-center w-14 h-14 rounded-full font-black text-xl shadow-lg ${
                          isTop3 
                            ? `bg-gradient-to-br ${medalColors[index]} text-white border-2 border-white dark:border-slate-800` 
                            : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                        }`}>
                          #{index + 1}
                        </div>
                        
                        <div>
                          <p className="font-bold text-lg">{commercial.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              isTop3 
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md" 
                                : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                            }`}>
                              {commercial.nbContrats} contrat{commercial.nbContrats > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-black text-2xl ${
                          isTop3 
                            ? "bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" 
                            : "text-foreground"
                        }`}>
                          {formatCurrency(commercial.caTotal)}
                        </p>
                        <p className="text-sm font-semibold text-muted-foreground mt-1">
                          {formatCurrency(commercial.commissions)} commissions
                        </p>
                      </div>
                    </div>
                    
                    {/* Barre de progression améliorée */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                        <span>Progression</span>
                        <span className="text-purple-600 dark:text-purple-400">{commercial.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isTop3 
                              ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 shadow-lg" 
                              : getBarColor(index, rankings.length)
                          }`}
                          style={{ width: `${commercial.percentage}%` }}
                        />
                        {isTop3 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

