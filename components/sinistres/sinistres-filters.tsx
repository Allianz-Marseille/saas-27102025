/**
 * Composant de filtres avancés pour les sinistres
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Filter, X, RotateCcw, Search } from "lucide-react";
import { SinistreFilters, SinistreStatus, SinistreRoute } from "@/types/sinistre";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SinistresFiltersProps {
  filters: SinistreFilters;
  onFiltersChange: (filters: SinistreFilters) => void;
  resultCount?: number;
}

const STATUS_OPTIONS: { value: SinistreStatus; label: string }[] = [
  { value: SinistreStatus.A_QUALIFIER, label: "À qualifier" },
  { value: SinistreStatus.EN_ATTENTE_PIECES_ASSURE, label: "En attente pièces assuré" },
  { value: SinistreStatus.EN_ATTENTE_INFOS_TIERS, label: "En attente infos tiers" },
  { value: SinistreStatus.MISSION_EN_COURS, label: "Mission en cours" },
  { value: SinistreStatus.EN_ATTENTE_DEVIS, label: "En attente devis" },
  { value: SinistreStatus.EN_ATTENTE_RAPPORT, label: "En attente rapport" },
  { value: SinistreStatus.EN_ATTENTE_ACCORD_COMPAGNIE, label: "En attente accord compagnie" },
  { value: SinistreStatus.TRAVAUX_EN_COURS, label: "Travaux en cours" },
  { value: SinistreStatus.EN_ATTENTE_FACTURE, label: "En attente facture" },
  { value: SinistreStatus.REGLEMENT_EN_COURS, label: "Règlement en cours" },
  { value: SinistreStatus.CLOS, label: "Clos" },
  { value: SinistreStatus.LITIGE_CONTESTATION, label: "Litige / contestation" },
];

const ROUTE_OPTIONS: { value: SinistreRoute; label: string }[] = [
  { value: SinistreRoute.ROUTE_A, label: "Route A - Réparation pilotée" },
  { value: SinistreRoute.ROUTE_B, label: "Route B - Expertise dommages" },
  { value: SinistreRoute.ROUTE_C, label: "Route C - Auto matériel (IRSA)" },
  { value: SinistreRoute.ROUTE_D, label: "Route D - Auto corporel (IRCA)" },
  { value: SinistreRoute.ROUTE_E, label: "Route E - Immeuble (IRSI)" },
  { value: SinistreRoute.ROUTE_F, label: "Route F - Responsabilité / litige" },
];

export function SinistresFilters({
  filters,
  onFiltersChange,
  resultCount,
}: SinistresFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.dateRange?.start,
    to: filters.dateRange?.end,
  });
  const [searchText, setSearchText] = useState(filters.searchText || "");

  const updateFilter = useCallback((key: keyof SinistreFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  // Synchroniser searchText avec filters.searchText quand il change de l'extérieur
  useEffect(() => {
    setSearchText(filters.searchText || "");
  }, [filters.searchText]);

  // Debounce pour la recherche textuelle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== (filters.searchText || "")) {
        updateFilter("searchText", searchText || undefined);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, filters.searchText, updateFilter]);

  const resetFilters = () => {
    onFiltersChange({});
    setDateRange(undefined);
    setSearchText("");
  };

  const hasActiveFilters = () => {
    return !!(
      filters.year ||
      filters.month ||
      filters.week ||
      filters.dateRange ||
      filters.damagedCoverage ||
      filters.route ||
      (filters.status && filters.status.length > 0) ||
      filters.assignedTo ||
      filters.amountMin ||
      filters.amountMax ||
      filters.hasTiers !== undefined ||
      filters.hasRecourse !== undefined ||
      filters.searchText
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.year) count++;
    if (filters.month) count++;
    if (filters.week) count++;
    if (filters.dateRange) count++;
    if (filters.damagedCoverage) count++;
    if (filters.route) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.assignedTo) count++;
    if (filters.amountMin || filters.amountMax) count++;
    if (filters.hasTiers !== undefined) count++;
    if (filters.hasRecourse !== undefined) count++;
    if (filters.searchText) count++;
    return count;
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      updateFilter("dateRange", { start: range.from, end: range.to });
    } else {
      updateFilter("dateRange", undefined);
    }
  };

  // Générer les années (5 dernières années)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Générer les mois
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), "MMMM", { locale: undefined }),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
            {hasActiveFilters() && (
              <Badge variant="secondary">{getActiveFiltersCount()}</Badge>
            )}
          </CardTitle>
          {hasActiveFilters() && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
        {resultCount !== undefined && (
          <p className="text-sm text-muted-foreground">
            {resultCount} sinistre(s) trouvé(s)
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recherche textuelle */}
          <div className="space-y-2">
            <Label>Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom client, numéro police, sinistre..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Année */}
            <div className="space-y-2">
              <Label>Année</Label>
              <Select
                value={filters.year?.toString() || "all"}
                onValueChange={(value) =>
                  updateFilter("year", value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mois */}
            {filters.year && (
              <div className="space-y-2">
                <Label>Mois</Label>
                <Select
                  value={filters.month?.toString() || "all"}
                  onValueChange={(value) =>
                    updateFilter("month", value === "all" ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Plage de dates */}
            <div className="space-y-2">
              <Label>Date de survenance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    {dateRange?.from ? (
                      dateRange?.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Sélectionner une plage</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Garantie sinistrée */}
            <div className="space-y-2">
              <Label>Garantie sinistrée</Label>
              <Input
                placeholder="Ex: Dégâts des eaux"
                value={filters.damagedCoverage || ""}
                onChange={(e) =>
                  updateFilter("damagedCoverage", e.target.value || undefined)
                }
              />
            </div>

            {/* Route */}
            <div className="space-y-2">
              <Label>Route</Label>
              <Select
                value={filters.route || "all"}
                onValueChange={(value) =>
                  updateFilter("route", value === "all" ? undefined : (value as SinistreRoute))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les routes</SelectItem>
                  {ROUTE_OPTIONS.map((route) => (
                    <SelectItem key={route.value} value={route.value}>
                      {route.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={filters.status && filters.status.length > 0 ? filters.status[0] : "all"}
                onValueChange={(value) =>
                  updateFilter(
                    "status",
                    value === "all" ? undefined : [value as SinistreStatus]
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Montant min */}
            <div className="space-y-2">
              <Label>Montant minimum (€)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.amountMin || ""}
                onChange={(e) =>
                  updateFilter(
                    "amountMin",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </div>

            {/* Montant max */}
            <div className="space-y-2">
              <Label>Montant maximum (€)</Label>
              <Input
                type="number"
                placeholder="∞"
                value={filters.amountMax || ""}
                onChange={(e) =>
                  updateFilter(
                    "amountMax",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>

          {/* Filtres actifs (badges) */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.year && (
                <Badge variant="secondary" className="gap-1">
                  Année: {filters.year}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter("year", undefined)}
                  />
                </Badge>
              )}
              {filters.month && (
                <Badge variant="secondary" className="gap-1">
                  Mois: {months.find((m) => m.value === filters.month)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter("month", undefined)}
                  />
                </Badge>
              )}
              {filters.route && (
                <Badge variant="secondary" className="gap-1">
                  Route: {ROUTE_OPTIONS.find((r) => r.value === filters.route)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter("route", undefined)}
                  />
                </Badge>
              )}
              {filters.status && filters.status.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Statut: {STATUS_OPTIONS.find((s) => s.value === filters.status![0])?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter("status", undefined)}
                  />
                </Badge>
              )}
              {filters.searchText && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: {filters.searchText}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter("searchText", undefined)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

