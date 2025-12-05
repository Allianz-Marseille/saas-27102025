"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Tag as TagIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/firebase/use-auth";
import { OffreCommerciale } from "@/types/offre";
import { toast } from "sonner";

export function OffresViewer() {
  const { user } = useAuth();
  const [offres, setOffres] = useState<OffreCommerciale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterPeriode, setFilterPeriode] = useState<string>("all");

  const fetchOffres = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();

      const response = await fetch("/api/offres", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des offres");
      }

      const data = await response.json();
      setOffres(data.data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les offres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffres();
  }, [user]);

  // Filtres
  const segments = useMemo(() => {
    const unique = new Set(offres.map((o) => o.segment));
    return Array.from(unique).sort();
  }, [offres]);

  const categories = useMemo(() => {
    const unique = new Set(offres.map((o) => o.categorie_client));
    return Array.from(unique).sort();
  }, [offres]);

  const periodes = useMemo(() => {
    const unique = new Set(offres.map((o) => o.periode));
    return Array.from(unique).sort();
  }, [offres]);

  const filteredOffres = useMemo(() => {
    return offres.filter((offre) => {
      const matchSearch =
        searchTerm === "" ||
        offre.offre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offre.segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offre.sous_segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offre.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offre.conditions.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSegment =
        filterSegment === "all" || offre.segment === filterSegment;

      const matchCategorie =
        filterCategorie === "all" || offre.categorie_client === filterCategorie;

      const matchPeriode =
        filterPeriode === "all" || offre.periode === filterPeriode;

      return matchSearch && matchSegment && matchCategorie && matchPeriode;
    });
  }, [offres, searchTerm, filterSegment, filterCategorie, filterPeriode]);

  const getCategorieColor = (categorie: string) => {
    const colors: Record<string, string> = {
      particulier: "bg-blue-500",
      professionnel: "bg-purple-500",
      entreprise: "bg-green-500",
      TNS: "bg-orange-500",
      agriculteur: "bg-yellow-500",
      viticulteur: "bg-red-500",
    };
    return colors[categorie] || "bg-gray-500";
  };

  const exportCSV = () => {
    const headers = [
      "Segment",
      "Sous-segment",
      "Offre",
      "Code",
      "Conditions",
      "Catégorie",
      "Période",
    ];

    const rows = filteredOffres.map((offre) => [
      offre.segment,
      offre.sous_segment,
      offre.offre,
      offre.code,
      offre.conditions,
      offre.categorie_client,
      offre.periode,
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `offres-commerciales-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Offres Commerciales
          </h1>
          <p className="text-muted-foreground mt-1">
            Consultez les offres et réductions Allianz
          </p>
        </div>
        <Button
          onClick={exportCSV}
          variant="outline"
          className="gap-2"
          disabled={filteredOffres.length === 0}
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredOffres.length}
            </div>
            <div className="text-sm text-muted-foreground">Offres disponibles</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {segments.length}
            </div>
            <div className="text-sm text-muted-foreground">Segments</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {categories.length}
            </div>
            <div className="text-sm text-muted-foreground">Catégories</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {periodes.length}
            </div>
            <div className="text-sm text-muted-foreground">Périodes</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une offre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSegment} onValueChange={setFilterSegment}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les segments</SelectItem>
            {segments.map((segment) => (
              <SelectItem key={segment} value={segment}>
                {segment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategorie} onValueChange={setFilterCategorie}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriode} onValueChange={setFilterPeriode}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes périodes</SelectItem>
            {periodes.map((periode) => (
              <SelectItem key={periode} value={periode}>
                {periode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Offres Cards */}
      {filteredOffres.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            {searchTerm ||
            filterSegment !== "all" ||
            filterCategorie !== "all" ||
            filterPeriode !== "all"
              ? "Aucune offre ne correspond aux filtres"
              : "Aucune offre disponible"}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffres.map((offre) => (
            <Card
              key={offre.id}
              className="hover:shadow-lg transition-all hover:border-blue-300 dark:hover:border-blue-700"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      {offre.segment}
                    </div>
                    <CardTitle className="text-lg mt-1">
                      {offre.sous_segment}
                    </CardTitle>
                  </div>
                  <Badge
                    className={`${getCategorieColor(offre.categorie_client)} text-white`}
                  >
                    {offre.categorie_client}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg">
                  <div className="font-semibold text-blue-700 dark:text-blue-300">
                    {offre.offre}
                  </div>
                </div>

                {offre.code && (
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {offre.code}
                    </code>
                  </div>
                )}

                {offre.conditions && (
                  <div className="text-sm text-muted-foreground border-l-2 border-blue-200 pl-3">
                    {offre.conditions}
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Période : {offre.periode}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

