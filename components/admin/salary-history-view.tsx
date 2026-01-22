"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown, ArrowRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { cleanOldSalaryHistory } from "@/lib/firebase/salaries";
import { toast } from "sonner";
import type { User, SalaryHistory } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SalaryHistoryViewProps {
  history: SalaryHistory[];
  users: User[];
  onRefresh: () => void;
}

export function SalaryHistoryView({ history, users, onRefresh }: SalaryHistoryViewProps) {
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Convertir Date | Timestamp en Date
  const toDate = (value: Date | Timestamp): Date => {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    return value;
  };

  // Obtenir les années disponibles
  const availableYears = useMemo(() => {
    const years = new Set(history.map(h => h.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  // Filtrer l'historique
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      if (filterUserId !== "all" && h.userId !== filterUserId) return false;
      if (filterYear !== "all" && h.year !== parseInt(filterYear)) return false;
      return true;
    });
  }, [history, filterUserId, filterYear]);

  // Trouver le nom d'un utilisateur
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return "Utilisateur inconnu";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split("@")[0];
  };

  // Nettoyer l'historique ancien
  const handleCleanOldHistory = async () => {
    try {
      setLoading(true);
      const deletedCount = await cleanOldSalaryHistory();
      toast.success(`${deletedCount} entrée(s) supprimée(s)`);
      onRefresh();
    } catch (error) {
      console.error("Erreur lors du nettoyage:", error);
      toast.error("Erreur lors du nettoyage de l'historique");
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le badge de type de changement
  const getChangeTypeBadge = (changeType: "initial" | "increase" | "decrease") => {
    switch (changeType) {
      case "initial":
        return <Badge variant="secondary">Initial</Badge>;
      case "increase":
        return <Badge className="bg-green-600">Augmentation</Badge>;
      case "decrease":
        return <Badge variant="destructive">Diminution</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              Historique des rémunérations
            </CardTitle>
            <CardDescription>
              Historique des 3 dernières années • {filteredHistory.length} entrée(s)
            </CardDescription>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
                Nettoyer anciennes données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Nettoyer l'historique</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action va supprimer toutes les entrées de plus de 3 ans.
                  Cette opération ne peut pas être annulée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCleanOldHistory}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? "Suppression..." : "Confirmer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterUserId} onValueChange={setFilterUserId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous les collaborateurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les collaborateurs</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {getUserName(user.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Toutes les années" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Collaborateur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Ancien salaire</TableHead>
                <TableHead className="text-center">
                  <ArrowRight className="h-4 w-4 mx-auto" />
                </TableHead>
                <TableHead className="text-right">Nouveau salaire</TableHead>
                <TableHead className="text-right">Variation</TableHead>
                <TableHead>Validé par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Aucun historique trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((entry) => {
                  const validatedBy = users.find(u => u.id === entry.validatedBy);
                  const validatedByName = validatedBy
                    ? (validatedBy.firstName && validatedBy.lastName
                        ? `${validatedBy.firstName} ${validatedBy.lastName}`
                        : validatedBy.email.split("@")[0])
                    : "Inconnu";

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(toDate(entry.validatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.year}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getUserName(entry.userId)}
                      </TableCell>
                      <TableCell>
                        {getChangeTypeBadge(entry.changeType)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.previousMonthlySalary
                          ? formatCurrency(entry.previousMonthlySalary)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.changeType === "increase" ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                        ) : entry.changeType === "decrease" ? (
                          <TrendingDown className="h-4 w-4 text-red-600 mx-auto" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(entry.monthlySalary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.changeAmount !== undefined && entry.changeAmount !== 0 ? (
                          <div className="flex flex-col items-end">
                            <span className={entry.changeAmount > 0 ? "text-green-600" : "text-red-600"}>
                              {entry.changeAmount > 0 ? "+" : ""}
                              {formatCurrency(entry.changeAmount)}
                            </span>
                            {entry.changePercentage !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                ({entry.changePercentage > 0 ? "+" : ""}
                                {entry.changePercentage.toFixed(2)}%)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {validatedByName}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
