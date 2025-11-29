"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Edit2, Trash2, Save, Sparkles, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCompanies, createCompany, updateCompany, deleteCompany, type Company, isSystemCompany } from "@/lib/firebase/companies";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [newCompanyName, setNewCompanyName] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  // Charger les compagnies
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des compagnies");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Ajouter une compagnie
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Nom requis", {
        description: "Veuillez saisir un nom de compagnie",
      });
      return;
    }

    const trimmedName = newCompanyName.trim();
    
    // Vérifier si c'est une compagnie système
    if (isSystemCompany(trimmedName)) {
      toast.error("Nom réservé", {
        description: "Ce nom est réservé pour une compagnie système",
      });
      return;
    }
    
    if (companies.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Compagnie déjà existante", {
        description: "Une compagnie avec ce nom existe déjà",
      });
      return;
    }

    try {
      await createCompany(trimmedName);
      toast.success("Compagnie ajoutée", {
        description: `La compagnie "${trimmedName}" a été ajoutée avec succès`,
      });
      setIsAddDialogOpen(false);
      setNewCompanyName("");
      loadCompanies();
    } catch (error) {
      toast.error("Erreur lors de l'ajout", {
        description: (error as Error).message || "Une erreur est survenue. Veuillez réessayer.",
      });
      console.error(error);
    }
  };

  // Ouvrir le dialogue d'édition
  const handleOpenEditDialog = (company: Company) => {
    setEditingCompany(company);
    setEditingName(company.name);
    setIsEditDialogOpen(true);
  };

  // Modifier une compagnie
  const handleUpdateCompany = async () => {
    if (!editingCompany || !editingName.trim()) {
      toast.error("Nom requis", {
        description: "Veuillez saisir un nom de compagnie",
      });
      return;
    }

    // Vérifier si c'est une compagnie système
    if (isSystemCompany(editingCompany.name)) {
      toast.error("Compagnie système", {
        description: "Impossible de modifier une compagnie système",
      });
      return;
    }

    const trimmedName = editingName.trim();
    if (trimmedName === editingCompany.name) {
      setIsEditDialogOpen(false);
      setEditingCompany(null);
      setEditingName("");
      return;
    }

    if (companies.some(c => c.id !== editingCompany.id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Nom déjà utilisé", {
        description: "Une compagnie avec ce nom existe déjà",
      });
      return;
    }

    try {
      await updateCompany(editingCompany.id, {
        name: trimmedName,
      });
      toast.success("Compagnie modifiée", {
        description: `La compagnie "${trimmedName}" a été modifiée avec succès`,
      });
      setIsEditDialogOpen(false);
      setEditingCompany(null);
      setEditingName("");
      loadCompanies();
    } catch (error) {
      toast.error("Erreur lors de la modification", {
        description: (error as Error).message || "Une erreur est survenue. Veuillez réessayer.",
      });
      console.error(error);
    }
  };

  // Toggle le statut actif/inactif
  const handleToggleActive = async (company: Company) => {
    if (isSystemCompany(company.name)) {
      toast.error("Compagnie système", {
        description: "Impossible de modifier le statut d'une compagnie système",
      });
      return;
    }

    try {
      await updateCompany(company.id, {
        active: !company.active,
      });
      toast.success(
        `Compagnie ${!company.active ? "activée" : "désactivée"}`,
        {
          description: `La compagnie "${company.name}" est maintenant ${!company.active ? "active" : "inactive"}`,
        }
      );
      loadCompanies();
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible de modifier le statut. Veuillez réessayer.",
      });
      console.error(error);
    }
  };

  // Ouvrir le dialogue de suppression
  const handleOpenDeleteDialog = (companyId: string) => {
    setDeletingCompanyId(companyId);
    setIsDeleteDialogOpen(true);
  };

  // Supprimer une compagnie
  const handleDeleteCompany = async () => {
    if (!deletingCompanyId) return;

    const companyToDelete = companies.find((c) => c.id === deletingCompanyId);

    // Vérifier si c'est une compagnie système
    if (companyToDelete && isSystemCompany(companyToDelete.name)) {
      toast.error("Compagnie système", {
        description: "Impossible de supprimer une compagnie système",
      });
      setIsDeleteDialogOpen(false);
      setDeletingCompanyId(null);
      return;
    }

    try {
      await deleteCompany(deletingCompanyId);
      toast.success("Compagnie supprimée", {
        description: companyToDelete 
          ? `La compagnie "${companyToDelete.name}" a été supprimée et remplacée par "Courtage" dans les anciens actes`
          : "La compagnie a été supprimée avec succès",
      });
      setIsDeleteDialogOpen(false);
      setDeletingCompanyId(null);
      loadCompanies();
    } catch (error) {
      toast.error("Erreur lors de la suppression", {
        description: (error as Error).message || "Une erreur est survenue. Veuillez réessayer.",
      });
      console.error(error);
    }
  };

  const deletingCompany = companies.find((c) => c.id === deletingCompanyId);

  const activeCompanies = companies.filter(c => c.active).length;
  const totalCompanies = companies.length;
  const systemCompanies = companies.filter(c => isSystemCompany(c.name)).sort((a, b) => {
    if (a.name.toLowerCase() === 'allianz') return -1;
    if (b.name.toLowerCase() === 'allianz') return 1;
    return a.name.localeCompare(b.name);
  });
  const customCompanies = companies.filter(c => !isSystemCompany(c.name)).sort((a, b) => a.name.localeCompare(b.name));

  // Gradients pour les compagnies personnalisées
  const gradients = [
    "from-violet-50 to-violet-100 dark:from-violet-950/30 dark:to-violet-900/30 border-violet-200 dark:border-violet-800",
    "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800",
    "from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30 border-cyan-200 dark:border-cyan-800",
    "from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    "from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30 border-pink-200 dark:border-pink-800",
    "from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border-amber-200 dark:border-amber-800",
    "from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border-indigo-200 dark:border-indigo-800",
    "from-teal-50 to-teal-100 dark:from-teal-950/30 dark:to-teal-900/30 border-teal-200 dark:border-teal-800",
  ];

  const iconColors = [
    "text-violet-600 dark:text-violet-400",
    "text-orange-600 dark:text-orange-400",
    "text-cyan-600 dark:text-cyan-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-pink-600 dark:text-pink-400",
    "text-amber-600 dark:text-amber-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-teal-600 dark:text-teal-400",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Chargement des compagnies...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header animé avec statistiques */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
            
            <CardContent className="relative z-10 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm mb-2">
                    Gestion des compagnies
                  </h2>
                  <p className="text-muted-foreground">
                    Gérez les compagnies d'assurance pour la saisie des actes
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Stats cards */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-300/50 dark:border-blue-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalCompanies}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Total</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-300/50 dark:border-green-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activeCompanies}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Actives</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button 
                      onClick={() => setIsAddDialogOpen(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Ajouter une compagnie
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {companies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <Building2 className="h-20 w-20 mx-auto text-muted-foreground/50 mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Aucune compagnie enregistrée</h3>
                <p className="text-muted-foreground mb-6">
                  Commencez par ajouter votre première compagnie d'assurance
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Ajouter ma première compagnie
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Compagnies système */}
            {systemCompanies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Compagnies système
                  </h3>
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300">
                    {systemCompanies.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                    >
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-xl transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-200/50 dark:bg-blue-800/50">
                                <Building2 className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-blue-900 dark:text-blue-100">{company.name}</h4>
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:text-blue-300 mt-1">
                                  Système
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-600 hover:bg-blue-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                            <span className="text-xs text-blue-600 dark:text-blue-400 italic">
                              Protégée
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Compagnies personnalisées */}
            {customCompanies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold">
                    Compagnies personnalisées
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {customCompanies.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customCompanies.map((company, index) => {
                    const gradient = gradients[index % gradients.length];
                    const iconColor = iconColors[index % iconColors.length];
                    
                    return (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        <Card className={`bg-gradient-to-br ${gradient} shadow-md hover:shadow-xl transition-all`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
                                  <Building2 className={`h-6 w-6 ${iconColor}`} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{company.name}</h4>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-4">
                              <Badge variant={company.active ? "default" : "secondary"} className="capitalize">
                                {company.active ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={company.active ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => handleToggleActive(company)}
                                    className="flex-1"
                                  >
                                    {company.active ? "Désactiver" : "Activer"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{company.active ? "Désactiver la compagnie" : "Activer la compagnie"}</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenEditDialog(company)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Modifier le nom</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenDeleteDialog(company.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Supprimer la compagnie</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog d'ajout */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une compagnie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle compagnie d'assurance qui sera disponible lors de la saisie des actes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-company-name">Nom de la compagnie</Label>
              <Input
                id="new-company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Ex: Allianz, AXA, Groupama..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCompany();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddCompany}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la compagnie</DialogTitle>
            <DialogDescription>
              Modifiez le nom de la compagnie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Nom de la compagnie</Label>
              <Input
                id="edit-company-name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Ex: Allianz, AXA, Groupama..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateCompany();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateCompany}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la compagnie &quot;{deletingCompany?.name}&quot; ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleDeleteCompany}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
