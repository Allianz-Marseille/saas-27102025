"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Table as TableIcon, LayoutGrid } from "lucide-react";
import { RouteGuard } from "@/components/auth/route-guard";
import { useAuth } from "@/lib/firebase/use-auth";
import { getSinistresKPIs, getLastImportInfo, getSinistres } from "@/lib/firebase/sinistres";
import { SinistresKPICards } from "@/components/sinistres/kpi-cards";
import { SinistresFilters } from "@/components/sinistres/sinistres-filters";
import { SinistresTable } from "@/components/sinistres/sinistres-table";
import { SinistresKanban } from "@/components/sinistres/sinistres-kanban";
import { SinistreKPI, SinistreFilters, Sinistre } from "@/types/sinistre";
import { toast } from "sonner";
import { ExcelUpload } from "@/components/sinistres/excel-upload";
import { SinistreDetailsDialog } from "@/components/sinistres/sinistre-details-dialog";
import { RoutesInfoDialog } from "@/components/sinistres/routes-info-dialog";

export default function SinistrePage() {
  const { userData } = useAuth();
  const [kpi, setKPI] = useState<SinistreKPI | null>(null);
  const [sinistres, setSinistres] = useState<Sinistre[]>([]);
  const [filters, setFilters] = useState<SinistreFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSinistres, setIsLoadingSinistres] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const loadKPIs = useCallback(async () => {
    setIsLoading(true);
    try {
      const kpiData = await getSinistresKPIs(filters);
      const lastImport = await getLastImportInfo();
      
      setKPI({
        ...kpiData,
        lastImport: lastImport || undefined,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des KPIs:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadSinistres = useCallback(async () => {
    setIsLoadingSinistres(true);
    try {
      const data = await getSinistres(filters);
      setSinistres(data);
    } catch (error) {
      console.error("Erreur lors du chargement des sinistres:", error);
      toast.error("Erreur lors du chargement des sinistres");
    } finally {
      setIsLoadingSinistres(false);
    }
  }, [filters]);

  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  useEffect(() => {
    loadSinistres();
  }, [loadSinistres]);

  const handleImportSuccess = () => {
    toast.success("Import terminé avec succès");
    loadKPIs();
    loadSinistres();
  };

  const [selectedSinistre, setSelectedSinistre] = useState<Sinistre | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleView = (sinistre: Sinistre) => {
    setSelectedSinistre(sinistre);
    setIsDetailsOpen(true);
  };

  const handleEdit = (sinistre: Sinistre) => {
    setSelectedSinistre(sinistre);
    setIsDetailsOpen(true);
  };

  const handleAssign = (sinistre: Sinistre) => {
    setSelectedSinistre(sinistre);
    setIsDetailsOpen(true);
  };

  const handleUpdate = () => {
    loadKPIs();
    loadSinistres();
  };

  const isAdmin = userData?.role === "ADMINISTRATEUR";

  return (
    <RouteGuard
      allowedRoles={["ADMINISTRATEUR", "GESTIONNAIRE_SINISTRE", "CDC_COMMERCIAL"]}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <header className="border-b bg-white dark:bg-slate-950 sticky top-16 lg:top-0 z-10 shadow-md">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                    <AlertTriangle className="h-7 w-7 text-orange-600" />
                    Gestion des Sinistres
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pilotage et suivi des sinistres
                  </p>
                </div>
                <RoutesInfoDialog />
              </div>
              {isAdmin && (
                <ExcelUpload
                  onSuccess={handleImportSuccess}
                  onError={(error) => toast.error(error)}
                />
              )}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <p className="text-muted-foreground">Chargement des données...</p>
              </div>
            </div>
          ) : kpi ? (
            <>
              {/* Section KPIs */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Indicateurs de performance</h2>
                <SinistresKPICards kpi={kpi} />
              </div>

              {/* Section filtres */}
              <div className="mb-6">
                <SinistresFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  resultCount={sinistres.length}
                />
              </div>

              {/* Section tableau */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Liste des sinistres</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                      >
                        <TableIcon className="h-4 w-4 mr-2" />
                        Tableau
                      </Button>
                      <Button
                        variant={viewMode === "kanban" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("kanban")}
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Kanban
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSinistres ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                    </div>
                  ) : viewMode === "table" ? (
                    <SinistresTable
                      sinistres={sinistres}
                      onView={handleView}
                      onEdit={handleEdit}
                      onAssign={handleAssign}
                    />
                  ) : (
                    <SinistresKanban
                      sinistres={sinistres}
                      onSinistreClick={handleView}
                      onStatusChange={handleUpdate}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Aucune donnée disponible. Importez un fichier Excel pour commencer.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modale de détails */}
        <SinistreDetailsDialog
          sinistre={selectedSinistre}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onUpdate={handleUpdate}
        />
      </div>
    </RouteGuard>
  );
}
