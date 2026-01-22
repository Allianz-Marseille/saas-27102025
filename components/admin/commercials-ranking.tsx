"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { getActsByMonth, type Act } from "@/lib/firebase/acts";
import { getAllCommercials, type UserData } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface CommercialRanking {
  id: string;
  email: string;
  value: number;
  percentage: number;
}

interface CommercialsRankingProps {
  monthKey: string;
}

interface CommercialData {
  userId: string;
  email: string;
  acts: Act[];
  commissionReelle: number;
  caTotal: number;
  caNonAuto: number;
  nbActes: number;
  commissionPotentielle: number;
  nbContratsAuto: number;
  nbContratsAutres: number;
  ratio: number;
  nbProcess: number;
}

// Fonction pour calculer les données d'un commercial
function calculateCommercialData(commercial: UserData, allActs: Act[]): CommercialData {
  const commercialActs = allActs.filter(act => act.userId === commercial.id);
  
  const caTotal = commercialActs.reduce((sum, act) => {
    const ca = (act.primeAnnuelle || 0) + (act.montantVersement || 0);
    return sum + ca;
  }, 0);
  
  const nbActes = commercialActs.length;
  
  const commissionPotentielle = commercialActs.reduce((sum, act) => {
    return sum + (act.commissionPotentielle || 0);
  }, 0);
  
  // Filtrer uniquement les AN pour les contrats et les CA
  const actsAN = commercialActs.filter(act => act.kind === "AN");
  
  const nbContratsAuto = actsAN.filter(
    act => act.contratType === "AUTO_MOTO"
  ).length;
  
  const nbContratsAutres = actsAN.filter(
    act => act.contratType !== "AUTO_MOTO"
  ).length;
  
  // CA Auto : uniquement les AN avec contratType === "AUTO_MOTO"
  const caAuto = actsAN
    .filter(act => act.contratType === "AUTO_MOTO")
    .reduce((sum, act) => {
      const ca = (act.primeAnnuelle || 0) + (act.montantVersement || 0);
      return sum + ca;
    }, 0);
  
  // CA Non Auto : uniquement les AN avec contratType !== "AUTO_MOTO"
  const caNonAuto = actsAN
    .filter(act => act.contratType !== "AUTO_MOTO")
    .reduce((sum, act) => {
      const ca = (act.primeAnnuelle || 0) + (act.montantVersement || 0);
      return sum + ca;
    }, 0);
  
  // Ratio basé sur les nombres de contrats (comme dans kpi.ts)
  const ratio = nbContratsAuto === 0 ? 100 : (nbContratsAutres / nbContratsAuto) * 100;
  
  const nbProcess = commercialActs.filter(
    act => act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD"
  ).length;
  
  // Commissions réelles : commissions potentielles SI validées
  // Validation : ≥200€ ET ≥15 process ET ratio ≥100%
  const commissionValidee = 
    commissionPotentielle >= 200 && 
    nbProcess >= 15 && 
    ratio >= 100;
  
  const commissionReelle = commissionValidee ? commissionPotentielle : 0;
  
  return {
    userId: commercial.id,
    email: commercial.email,
    acts: commercialActs,
    commissionReelle,
    caTotal,
    caNonAuto,
    nbActes,
    commissionPotentielle,
    nbContratsAuto,
    nbContratsAutres,
    ratio,
    nbProcess,
  };
}

export function CommercialsRanking({ monthKey }: CommercialsRankingProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>("commissionReelle");
  const [rankings, setRankings] = useState<CommercialRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const criterionOptions = [
    { value: "commissionReelle", label: "Commissions réelles" },
    { value: "caTotal", label: "CA total" },
    { value: "caNonAuto", label: "CA non auto" },
    { value: "nbActes", label: "Nombre total d'actes" },
    { value: "commissionPotentielle", label: "Commissions potentielles" },
    { value: "nbContratsAuto", label: "Nombre contrats auto" },
    { value: "nbContratsAutres", label: "Nombre contrats autres" },
    { value: "ratio", label: "Ratio CA auto / CA autres" },
    { value: "nbProcess", label: "Nombre de process" },
  ];

  // Charger et calculer les données des commerciaux
  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      try {
        // Récupérer tous les commerciaux
        const commercials = await getAllCommercials();
        
        // Récupérer les actes de tous les commerciaux pour le mois
        const allActs = await getActsByMonth(null, monthKey);
        
        // Calculer les données par commercial
        const commercialData: CommercialData[] = await Promise.all(
          commercials.map(async (commercial) => calculateCommercialData(commercial, allActs))
        );
        
        // Calculer le ranking basé sur le critère sélectionné
        calculateRanking(commercialData);
        
      } catch (error) {
        console.error("Erreur lors du chargement des classements:", error);
        toast.error("Impossible de charger les classements");
      } finally {
        setLoading(false);
      }
    };

    if (monthKey) {
      loadRankings();
    }
  }, [monthKey]);

  // Recalculer le ranking quand le critère change
  useEffect(() => {
    const loadAndCalculate = async () => {
      try {
        const commercials = await getAllCommercials();
        const allActs = await getActsByMonth(null, monthKey);
        
        const commercialData: CommercialData[] = await Promise.all(
          commercials.map(async (commercial) => calculateCommercialData(commercial, allActs))
        );
        
        calculateRanking(commercialData);
      } catch (error) {
        console.error("Erreur lors du calcul du classement:", error);
      }
    };

    if (monthKey) {
      loadAndCalculate();
    }
  }, [selectedCriterion, monthKey]);

  const calculateRanking = (data: CommercialData[]) => {
    // Trier par le critère sélectionné
    const sorted = [...data].sort((a, b) => {
      const aValue = a[selectedCriterion as keyof CommercialData] as number;
      const bValue = b[selectedCriterion as keyof CommercialData] as number;
      return bValue - aValue;
    });
    
    // Calculer les pourcentages
    const maxValue = sorted[0]?.[selectedCriterion as keyof CommercialData] as number || 1;
    const rankings: CommercialRanking[] = sorted.map((commercial, index) => {
      const value = commercial[selectedCriterion as keyof CommercialData] as number;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      
      return {
        id: commercial.userId,
        email: commercial.email,
        value,
        percentage,
      };
    });
    
    setRankings(rankings);
  };

  const getBarColor = (index: number, total: number) => {
    const percentage = ((index + 1) / total) * 100;
    if (percentage <= 20) return "bg-green-600";
    if (percentage <= 40) return "bg-green-500";
    if (percentage <= 60) return "bg-yellow-500";
    if (percentage <= 80) return "bg-orange-500";
    return "bg-red-500";
  };

  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <Card className="border-l-4 border-l-green-500 relative">
      <div className="absolute -top-1 left-0 right-0 h-1 bg-green-500 rounded-t-lg" />
      <div className="absolute -left-1 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg" />
      
      <CardHeader className="bg-green-50/50 dark:bg-green-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
              Section 2 : Classement des commerciaux
            </CardTitle>
            <CardDescription className="mt-1">
              Classement par critères pour le mois sélectionné
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="criterion-select">Critère :</Label>
            <Select value={selectedCriterion} onValueChange={setSelectedCriterion}>
              <SelectTrigger id="criterion-select" className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {criterionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
            Aucune donnée disponible pour ce mois
          </p>
        ) : (
          <div className="space-y-3">
            {rankings.map((commercial, index) => {
              const isPercentage = selectedCriterion === "ratio";
              const displayValue = isPercentage 
                ? commercial.value.toFixed(2)
                : commercial.value.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  });
              
              return (
                <div key={commercial.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 w-32">
                    {getMedal(index)}
                    <span className="text-sm font-medium truncate">
                      {commercial.email}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div 
                      className={`h-8 rounded transition-all ${getBarColor(index, rankings.length)}`}
                      style={{ width: `${commercial.percentage}%` }}
                    />
                  </div>
                  <div className="text-right w-32">
                    <span className="font-semibold">{displayValue}</span>
                    <span className="text-sm text-muted-foreground">
                      {" "}{isPercentage ? "%" : selectedCriterion.includes("nb") || selectedCriterion.includes("Nombre") ? "" : "€"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
