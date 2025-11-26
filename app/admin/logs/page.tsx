"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Sparkles,
} from "lucide-react";
import { getLogs, type LogEntry, type LogLevel, type LogAction } from "@/lib/firebase/logs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [actionFilter, setActionFilter] = useState<LogAction | "all">("all");

  // Charger les logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs({
        limitCount: 200,
        ...(levelFilter !== "all" && { level: levelFilter }),
        ...(actionFilter !== "all" && { action: actionFilter }),
      });
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, actionFilter]);

  // Filtrer les logs par recherche
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.description.toLowerCase().includes(searchLower) ||
        log.userEmail.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower)
      );
    });
  }, [logs, searchTerm]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: logs.length,
      info: logs.filter((l) => l.level === "info").length,
      success: logs.filter((l) => l.level === "success").length,
      warning: logs.filter((l) => l.level === "warning").length,
      error: logs.filter((l) => l.level === "error").length,
    };
  }, [logs]);

  // Helper pour obtenir l'icône et la couleur du niveau
  const getLevelConfig = (level: LogLevel) => {
    switch (level) {
      case "info":
        return {
          icon: Info,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-950/50",
          border: "border-l-blue-500",
        };
      case "success":
        return {
          icon: CheckCircle2,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-950/50",
          border: "border-l-green-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-100 dark:bg-orange-950/50",
          border: "border-l-orange-500",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-950/50",
          border: "border-l-red-500",
        };
    }
  };

  // Helper pour obtenir le label de l'action
  const getActionLabel = (action: LogAction) => {
    const labels: Record<LogAction, string> = {
      user_login: "Connexion",
      user_logout: "Déconnexion",
      act_created: "Acte créé",
      act_updated: "Acte modifié",
      act_deleted: "Acte supprimé",
      user_created: "Utilisateur créé",
      user_updated: "Utilisateur modifié",
      user_deleted: "Utilisateur supprimé",
      company_updated: "Compagnie modifiée",
      commission_validated: "Commission validée",
      system_error: "Erreur système",
      data_export: "Export de données",
    };
    return labels[action] || action;
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Date/Heure", "Niveau", "Action", "Utilisateur", "Description"];
    const rows = filteredLogs.map((log) => [
      format(log.timestamp instanceof Date ? log.timestamp : new Date(), "dd/MM/yyyy HH:mm:ss"),
      log.level,
      getActionLabel(log.action),
      log.userEmail,
      log.description,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    link.click();
    toast.success("Export CSV réussi");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-purple-950/20 border-2 border-blue-100/50 dark:border-blue-900/30 shadow-xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                  Journal des logs
                </h1>
                <p className="text-muted-foreground">
                  Historique complet des actions et événements système
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchLogs}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Actualiser
              </Button>
              <Button
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Info</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.info}</p>
              </div>
              <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Succès</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Attention</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Erreurs</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtres</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | "all")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as LogAction | "all")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="user_login">Connexion</SelectItem>
                <SelectItem value="user_logout">Déconnexion</SelectItem>
                <SelectItem value="act_created">Acte créé</SelectItem>
                <SelectItem value="act_updated">Acte modifié</SelectItem>
                <SelectItem value="act_deleted">Acte supprimé</SelectItem>
                <SelectItem value="system_error">Erreur système</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Entrées récentes</CardTitle>
              <CardDescription>
                {filteredLogs.length} log{filteredLogs.length > 1 ? "s" : ""} affiché{filteredLogs.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                Recherche active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-muted-foreground">Chargement des logs...</p>
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucun log trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Essayez de modifier vos filtres de recherche
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredLogs.map((log) => {
                  const config = getLevelConfig(log.level);
                  const Icon = config.icon;

                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "p-4 hover:bg-muted/30 transition-all border-l-4 group",
                        config.border
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icône */}
                        <div className={cn("rounded-lg p-2", config.bg)}>
                          <Icon className={cn("h-5 w-5", config.color)} />
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs">
                                {getActionLabel(log.action)}
                              </Badge>
                              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bg, config.color)}>
                                {log.level}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(
                                log.timestamp instanceof Date ? log.timestamp : new Date(),
                                "dd/MM/yyyy HH:mm:ss",
                                { locale: fr }
                              )}
                            </div>
                          </div>

                          <p className="font-medium text-sm mb-2">{log.description}</p>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate">{log.userEmail}</span>
                          </div>

                          {/* Métadonnées */}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2 group/details">
                              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Détails supplémentaires
                              </summary>
                              <pre className="mt-2 text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

