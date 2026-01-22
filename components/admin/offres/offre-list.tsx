"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Edit, Trash2, FileJson, Filter, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/use-auth";
import { OffreCommerciale } from "@/types/offre";
import { OffreFormDialog } from "./offre-form-dialog";
import { ImportOffresDialog } from "./import-offres-dialog";
import { toast } from "sonner";

export function OffresList() {
  const { user } = useAuth();
  const [offres, setOffres] = useState<OffreCommerciale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterPeriode, setFilterPeriode] = useState<string>("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingOffre, setEditingOffre] = useState<OffreCommerciale | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      
      const response = await fetch(`/api/offres/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Offre supprimée avec succès");

      fetchOffres();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de supprimer l'offre");
    }
  };

  const handleEdit = (offre: OffreCommerciale) => {
    setEditingOffre(offre);
    setFormDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingOffre(null);
    fetchOffres();
  };

  const handleImportSuccess = () => {
    setImportDialogOpen(false);
    fetchOffres();
  };

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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Offres Commerciales
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des offres Allianz
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <FileJson className="h-4 w-4" />
            Import JSON
          </Button>
          <Button
            onClick={() => {
              setEditingOffre(null);
              setFormDialogOpen(true);
            }}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle offre
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <div className="text-2xl font-bold text-blue-600">
            {offres.length}
          </div>
          <div className="text-sm text-muted-foreground">Total offres</div>
        </div>
        <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <div className="text-2xl font-bold text-purple-600">
            {segments.length}
          </div>
          <div className="text-sm text-muted-foreground">Segments</div>
        </div>
        <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <div className="text-2xl font-bold text-green-600">
            {categories.length}
          </div>
          <div className="text-sm text-muted-foreground">Catégories</div>
        </div>
        <div className="p-4 rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <div className="text-2xl font-bold text-orange-600">
            {filteredOffres.length}
          </div>
          <div className="text-sm text-muted-foreground">Affichées</div>
        </div>
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

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <TableHead>Segment</TableHead>
              <TableHead>Sous-segment</TableHead>
              <TableHead>Offre</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Période</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffres.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {searchTerm || filterSegment !== "all" || filterCategorie !== "all" || filterPeriode !== "all"
                    ? "Aucune offre ne correspond aux filtres"
                    : "Aucune offre disponible"}
                </TableCell>
              </TableRow>
            ) : (
              filteredOffres.map((offre) => (
                <TableRow key={offre.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{offre.segment}</TableCell>
                  <TableCell>{offre.sous_segment}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="line-clamp-2">{offre.offre}</div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {offre.code || "-"}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="line-clamp-2 text-sm text-muted-foreground">
                      {offre.conditions || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getCategorieColor(offre.categorie_client)} text-white`}>
                      {offre.categorie_client}
                    </Badge>
                  </TableCell>
                  <TableCell>{offre.periode}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(offre)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(offre.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogues */}
      <OffreFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        offre={editingOffre}
      />
      <ImportOffresDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

