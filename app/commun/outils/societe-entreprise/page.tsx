"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Loader2,
  Building2,
  MapPin,
  Users,
  AlertCircle,
  FileText,
  TrendingUp,
  Briefcase,
  Award,
  Phone,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  BarChart3,
  Copy,
  Check,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchResult {
  nomcommercial: string;
  siren: string;
  nafcode?: string;
  naflib?: string;
  cpville?: string;
  dep?: string;
  longitude?: string;
  latitude?: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    existence: any;
    infosLegales: any;
    dirigeants: any;
    bilans: any;
    beneficiaires: any;
    etablissements: any;
    procedures: any;
    evenements: any;
    scoring: any;
    contact: any;
    marques: any;
    documents: any;
  };
  searchResults?: SearchResult[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
  details?: string;
  suggestion?: string;
  rawResult?: any;
}

export default function SocieteEntreprisePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sirenInput, setSirenInput] = useState("");
  const [nomInput, setNomInput] = useState("");
  const [tvaInput, setTvaInput] = useState("");
  const [searchType, setSearchType] = useState<"siren" | "nom" | "tva">("siren");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse["data"] | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Validation et conversion SIRET → SIREN
  const validateAndExtractSiren = (input: string): string | null => {
    const cleaned = input.replace(/\s+/g, "").replace(/\D/g, "");

    if (cleaned.length === 9) {
      return cleaned;
    } else if (cleaned.length === 14) {
      return cleaned.substring(0, 9);
    } else {
      return null;
    }
  };

  // Validation TVA intracommunautaire (FR + 9 chiffres)
  const validateTva = (input: string): boolean => {
    const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
    return /^FR\d{9}$/.test(cleaned) || (cleaned.startsWith("FR") && /^\d{9}$/.test(cleaned.replace(/^FR/i, "")));
  };

  const handleSearch = async () => {
    setError(null);
    setResults(null);
    setSearchResults(null);

    if (!user) {
      setError("Vous devez être connecté pour effectuer une recherche");
      return;
    }

    // Validation selon le type de recherche
    if (searchType === "siren") {
      const siren = validateAndExtractSiren(sirenInput);
      if (!siren) {
        setError("Veuillez saisir un SIREN (9 chiffres) ou un SIRET (14 chiffres) valide");
        return;
      }
    } else if (searchType === "tva") {
      const tva = tvaInput.trim().toUpperCase().replace(/\s+/g, "");
      if (!tva || !validateTva(tvaInput)) {
        setError("Veuillez saisir un numéro de TVA valide (FR + 9 chiffres, ex. FR56428723266)");
        return;
      }
    } else {
      if (!nomInput.trim()) {
        setError("Veuillez saisir un nom d'entreprise");
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = await user.getIdToken();

      let requestBody: { siren?: string; nom?: string; tva?: string };
      if (searchType === "siren") {
        requestBody = { siren: validateAndExtractSiren(sirenInput) ?? undefined };
      } else if (searchType === "tva") {
        const tva = tvaInput.trim().toUpperCase().replace(/\s+/g, "");
        requestBody = { tva: tva.startsWith("FR") ? tva : `FR${tva}` };
      } else {
        requestBody = { nom: nomInput.trim() };
      }

      const response = await fetch("/api/societe/entreprise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        // Construire un message d'erreur détaillé
        let errorMessage = data.error || "Erreur lors de la recherche";
        
        if (data.details) {
          errorMessage += `\n\n${data.details}`;
        }
        
        if (data.suggestion) {
          errorMessage += `\n\n💡 ${data.suggestion}`;
        }
        
        // Si erreur 401, c'est probablement un problème d'abonnement
        if (response.status === 401) {
          errorMessage = `🔒 ${errorMessage}\n\nLa recherche par nom peut nécessiter un abonnement payant à l'API Societe.com. Vérifiez votre abonnement ou contactez le support.`;
        }
        
        throw new Error(errorMessage);
      }

      // Si recherche par nom, on a des résultats de recherche à afficher
      if (searchType === "nom" && data.searchResults) {
        setSearchResults(data.searchResults);
        toast.success(`${data.searchResults.length} entreprise(s) trouvée(s)`);
      } else if (data.data) {
        setResults(data.data);
        toast.success("Informations récupérées avec succès");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = async (siren: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/societe/entreprise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selectedSiren: siren }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la récupération des informations");
      }

      if (data.data) {
        setResults(data.data);
        toast.success("Informations récupérées avec succès");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr.length !== 8) return dateStr || "Non disponible";
    return `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`;
  };

  const copyToClipboard = async (text: string, sectionId: string) => {
    if (!text.trim()) {
      toast.error("Aucune donnée à copier");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      toast.success("Données copiées dans le presse-papier");
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const formatInfosForCopy = (): string => {
    if (!results?.infosLegales) return "";
    const L = results.infosLegales;
    let text = "INFORMATIONS ENTREPRISE (Societe.com)\n";
    text += "=".repeat(50) + "\n\n";
    text += `Dénomination: ${L.denoinsee || L.denorcs || "Non disponible"}\n`;
    text += `Forme juridique: ${L.catjurlibinsee || L.catjurlibrcs || "Non disponible"}\n`;
    text += `Adresse: ${L.voieadressageinsee || L.voieadressagercs || ""} ${L.codepostalinsee || L.codepostalrcs || ""} ${L.villeinsee || L.villercs || ""}\n`;
    text += `SIREN: ${L.siren || "Non disponible"}\n`;
    if (L.siretsiege) text += `SIRET siège: ${L.siretsiege}\n`;
    if (L.numtva) text += `TVA: ${L.numtva}\n`;
    if (L.rcs) text += `RCS: ${L.rcs}\n`;
    if (L.capital) text += `Capital: ${L.capital_formate || L.capital + " " + (L.libdevise || "EUR")}\n`;
    if (L.nafinsee) text += `Code NAF/APE: ${L.nafinsee} - ${L.naflibinsee || ""}\n`;
    if (L.idcc || L.libidcc) text += `Convention collective: ${L.idcc || ""} - ${L.libidcc || L.libelle_idcc || ""}\n`;
    return text;
  };

  const formatBeneficiairesForCopy = (): string => {
    const list = results?.beneficiaires?.beneficiaires_effectifs ?? (Array.isArray(results?.beneficiaires) ? results.beneficiaires : []);
    if (!list || list.length === 0) return "";
    let text = "BÉNÉFICIAIRES EFFECTIFS\n";
    text += "=".repeat(50) + "\n\n";
    list.forEach((b: any, i: number) => {
      text += `Bénéficiaire ${i + 1}: ${b.prenompp || b.prenom || ""} ${b.nompp || b.nom || b.denopm || "Non disponible"}\n`;
      if (b.datenaisspp || b.date_naissance) text += `  Date naissance: ${b.datenaisspp || b.date_naissance}\n`;
      if (b.pourcentage_parts != null) text += `  Parts: ${Number(b.pourcentage_parts).toFixed(2)}%\n`;
      if (b.pourcentage_votes != null) text += `  Votes: ${Number(b.pourcentage_votes).toFixed(2)}%\n`;
      text += "\n";
    });
    return text;
  };

  const formatDirigeantsForCopy = (): string => {
    const list = results?.dirigeants?.dirigeants;
    if (!list || list.length === 0) return "";
    let text = "DIRIGEANTS\n";
    text += "=".repeat(50) + "\n\n";
    list.forEach((d: any, i: number) => {
      text += `Dirigeant ${i + 1}: ${d.prenompp || ""} ${d.nompp || d.denopm || "Non disponible"}\n`;
      text += `  Fonction: ${d.titre || "Non disponible"}\n`;
      if (d.datedebut) text += `  Début: ${formatDate(d.datedebut)}\n`;
      if (d.datefin) text += `  Fin: ${formatDate(d.datefin)}\n`;
      text += "\n";
    });
    return text;
  };

  const formatFinancierForCopy = (): string => {
    const list = results?.bilans?.bilans;
    if (!list || list.length === 0) return "";
    let text = "BILANS\n";
    text += "=".repeat(50) + "\n\n";
    list.slice(0, 10).forEach((b: any, i: number) => {
      text += `Bilan ${i + 1}: ${b.annee || b.datecloture || ""}\n`;
      if (b.chiffreaffaires != null) text += `  CA: ${b.chiffreaffaires}\n`;
      if (b.resultatnet != null) text += `  Résultat net: ${b.resultatnet}\n`;
      if (b.actiftotal != null) text += `  Actif total: ${b.actiftotal}\n`;
      text += "\n";
    });
    return text;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Informations entreprise
        </h1>
        <p className="text-muted-foreground">
          Consultez toutes les informations disponibles sur une entreprise (légales, dirigeants, bilans, établissements, etc.)
        </p>
      </motion.div>

      {/* Formulaire de recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recherche</CardTitle>
            <CardDescription>
              Recherchez une entreprise par SIREN/SIRET ou par nom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sélecteur de type de recherche */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={searchType === "siren" ? "default" : "outline"}
                  onClick={() => {
                    setSearchType("siren");
                    setNomInput("");
                    setTvaInput("");
                  }}
                  className="flex-1"
                >
                  Par SIREN/SIRET
                </Button>
                <Button
                  type="button"
                  variant={searchType === "nom" ? "default" : "outline"}
                  onClick={() => {
                    setSearchType("nom");
                    setSirenInput("");
                    setTvaInput("");
                  }}
                  className="flex-1"
                >
                  Par nom
                </Button>
                <Button
                  type="button"
                  variant={searchType === "tva" ? "default" : "outline"}
                  onClick={() => {
                    setSearchType("tva");
                    setSirenInput("");
                    setNomInput("");
                  }}
                  className="flex-1"
                >
                  Par TVA
                </Button>
              </div>

              {/* Champ de recherche */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  {searchType === "siren" ? (
                    <Input
                      type="text"
                      placeholder="Ex: 123456789 ou 12345678901234"
                      value={sirenInput}
                      onChange={(e) => setSirenInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="w-full"
                    />
                  ) : searchType === "tva" ? (
                    <Input
                      type="text"
                      placeholder="Ex: FR56428723266"
                      value={tvaInput}
                      onChange={(e) => setTvaInput(e.target.value.toUpperCase())}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      type="text"
                      placeholder="Ex: Société Générale"
                      value={nomInput}
                      onChange={(e) => setNomInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="w-full"
                    />
                  )}
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={
                    isLoading ||
                    (searchType === "siren" && !sirenInput.trim()) ||
                    (searchType === "nom" && !nomInput.trim()) ||
                    (searchType === "tva" && !tvaInput.trim())
                  }
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Message d'erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="border-destructive bg-destructive/10 text-destructive rounded-xl border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium whitespace-pre-line">{error}</p>
                  {error.includes("abonnement") && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        💡 <strong>Astuce :</strong> Essayez de rechercher par SIREN/SIRET si vous connaissez le numéro. Cette fonctionnalité est généralement disponible sans abonnement supplémentaire.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Résultats de recherche par nom */}
      {searchResults && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                Résultats de recherche ({searchResults.length})
              </CardTitle>
              <CardDescription>
                Sélectionnez l'entreprise pour voir ses informations complètes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.siren}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 border bg-muted/30"
                      onClick={() => handleSelectCompany(result.siren)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-1 truncate">
                              {result.nomcommercial || "Nom non disponible"}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">SIREN:</span>{" "}
                                <span className="font-mono">{result.siren}</span>
                              </div>
                              {result.cpville && (
                                <div>
                                  <span className="font-medium">Localisation:</span>{" "}
                                  {result.cpville}
                                </div>
                              )}
                              {result.naflib && (
                                <div className="w-full">
                                  <span className="font-medium">Activité:</span>{" "}
                                  {result.nafcode} - {result.naflib}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCompany(result.siren);
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Voir détails"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Résultats */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <Tabs defaultValue="infos" className="w-full">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 flex-1">
                <TabsTrigger value="infos">Informations</TabsTrigger>
                <TabsTrigger value="beneficiaires">Bénéficiaires</TabsTrigger>
                <TabsTrigger value="dirigeants">Dirigeants</TabsTrigger>
                <TabsTrigger value="financier">Financier</TabsTrigger>
                <TabsTrigger value="autres">Autres</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allData = [
                    formatInfosForCopy(),
                    formatBeneficiairesForCopy(),
                    formatDirigeantsForCopy(),
                    formatFinancierForCopy(),
                  ].filter(Boolean).join("\n\n");
                  copyToClipboard(allData, "all");
                }}
                className="gap-2"
              >
                {copiedSection === "all" ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier tout
                  </>
                )}
              </Button>
            </div>

            {/* Onglet Informations */}
            <TabsContent value="infos" className="space-y-6">
              {/* Informations de base */}
              {results.infosLegales && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Building2 className="h-5 w-5" />
                        Informations légales
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatInfosForCopy(), "infos")}
                        className="gap-2"
                      >
                        {copiedSection === "infos" ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Dénomination
                        </p>
                        <p className="text-base font-semibold">
                          {results.infosLegales.denoinsee || results.infosLegales.denorcs || "Non disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Forme juridique
                        </p>
                        <p className="text-base">
                          {results.infosLegales.catjurlibinsee || results.infosLegales.catjurlibrcs || "Non disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Adresse
                        </p>
                        <p className="text-base">
                          {results.infosLegales.voieadressageinsee || results.infosLegales.voieadressagercs || "Non disponible"}
                          {results.infosLegales.codepostalinsee || results.infosLegales.codepostalrcs ? `, ${results.infosLegales.codepostalinsee || results.infosLegales.codepostalrcs}` : ""}
                          {results.infosLegales.villeinsee || results.infosLegales.villercs ? ` ${results.infosLegales.villeinsee || results.infosLegales.villercs}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          SIREN
                        </p>
                        <p className="text-base font-mono">
                          {results.infosLegales.siren || "Non disponible"}
                        </p>
                      </div>
                      {results.infosLegales.siretsiege && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            SIRET siège
                          </p>
                          <p className="text-base font-mono">
                            {results.infosLegales.siretsiege}
                          </p>
                        </div>
                      )}
                      {results.infosLegales.numtva && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            TVA intracommunautaire
                          </p>
                          <p className="text-base font-mono">
                            {results.infosLegales.numtva}
                          </p>
                        </div>
                      )}
                      {results.infosLegales.rcs && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            RCS
                          </p>
                          <p className="text-base">
                            {results.infosLegales.rcs}
                          </p>
                        </div>
                      )}
                      {results.infosLegales.capital && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Capital
                          </p>
                          <p className="text-base font-semibold">
                            {results.infosLegales.capital_formate || `${results.infosLegales.capital} ${results.infosLegales.libdevise || "EUR"}`}
                          </p>
                        </div>
                      )}
                      {results.infosLegales.nafinsee && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Code NAF/APE
                          </p>
                          <p className="text-base">
                            {results.infosLegales.nafinsee} - {results.infosLegales.naflibinsee || "Non disponible"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Convention collective (CCN) */}
              {results.infosLegales && (results.infosLegales.idcc || results.infosLegales.libidcc || results.infosLegales.libelle_idcc) && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Scale className="h-5 w-5" />
                      Convention collective
                    </CardTitle>
                    <CardDescription>
                      IDCC et libellé applicables à l&apos;entreprise (source Societe.com)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.infosLegales.idcc && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">IDCC</p>
                          <p className="text-base font-mono font-semibold">{results.infosLegales.idcc}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Libellé</p>
                        <p className="text-base">
                          {results.infosLegales.libidcc || results.infosLegales.libelle_idcc || "Non disponible"}
                        </p>
                      </div>
                    </div>
                    {results.infosLegales.idcc && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        <a
                          href={`https://code.travail.gouv.fr/outils/convention-collective#idcc-${results.infosLegales.idcc}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Voir le texte de la convention sur le Code du travail numérique →
                        </a>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact */}
              {results.contact && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Phone className="h-5 w-5" />
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.contact.tel && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-base">{results.contact.tel}</span>
                        </div>
                      )}
                      {results.contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-base">{results.contact.email}</span>
                        </div>
                      )}
                      {results.contact.siteweb && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={results.contact.siteweb.startsWith("http") ? results.contact.siteweb : `https://${results.contact.siteweb}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-primary hover:underline"
                          >
                            {results.contact.siteweb}
                          </a>
                        </div>
                      )}
                      {results.contact.voieadr && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-base">
                            {results.contact.voieadr}, {results.contact.codepostal} {results.contact.ville}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scoring */}
              {results.scoring && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="h-5 w-5" />
                      Scoring
                    </CardTitle>
                    <CardDescription>
                      Indicateurs de risque et performance (Societe.com). Plus le score financier est élevé, plus la situation est favorable.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.scoring.financier && (
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Score financier
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary">
                              {results.scoring.financier.score?.financier != null
                                ? Number(results.scoring.financier.score.financier).toFixed(2)
                                : "Non disponible"}
                            </span>
                            {results.scoring.financier.score?.financier != null && (
                              <span className="text-xs text-muted-foreground">/ 20</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Période {results.scoring.financier.periode || ""}
                          </p>
                        </div>
                      )}
                      {results.scoring["extra-financier"] && (
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Score extra-financier
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Général</span>
                              <span className="font-semibold">{results.scoring["extra-financier"].score?.general ?? "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Social</span>
                              <span className="font-semibold">{results.scoring["extra-financier"].score?.social ?? "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Fiscal</span>
                              <span className="font-semibold">{results.scoring["extra-financier"].score?.fiscal ?? "N/A"}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Période {results.scoring["extra-financier"].periode || ""}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      <a
                        href="https://www.societe.com/solutions/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        En savoir plus sur les scores Societe.com →
                      </a>
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Bénéficiaires effectifs */}
            <TabsContent value="beneficiaires" className="space-y-6">
              {(() => {
                const list = results?.beneficiaires?.beneficiaires_effectifs ?? (Array.isArray(results?.beneficiaires) ? results.beneficiaires : []);
                const hasBeneficiaires = list && list.length > 0;
                return hasBeneficiaires ? (
                  <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Users className="h-5 w-5" />
                          Bénéficiaires effectifs ({list.length})
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formatBeneficiairesForCopy(), "beneficiaires")}
                          className="gap-2"
                        >
                          {copiedSection === "beneficiaires" ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copier
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {list.map((beneficiaire: any, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="p-4 rounded-lg border bg-muted/30"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Nom complet</p>
                                <p className="text-base font-semibold">
                                  {(beneficiaire.prenompp || beneficiaire.prenom || "") + " " + (beneficiaire.nompp || beneficiaire.nom || beneficiaire.denopm || "Non disponible")}
                                </p>
                              </div>
                              {(beneficiaire.datenaisspp || beneficiaire.date_naissance) && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Date de naissance</p>
                                  <p className="text-base">{beneficiaire.datenaisspp || beneficiaire.date_naissance}</p>
                                </div>
                              )}
                              {beneficiaire.pourcentage_parts != null && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Parts</p>
                                  <p className="text-base">{Number(beneficiaire.pourcentage_parts).toFixed(2)} %</p>
                                </div>
                              )}
                              {beneficiaire.pourcentage_votes != null && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Votes</p>
                                  <p className="text-base">{Number(beneficiaire.pourcentage_votes).toFixed(2)} %</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                    <CardContent className="pt-6">
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun bénéficiaire effectif disponible</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </TabsContent>

            {/* Onglet Dirigeants */}
            <TabsContent value="dirigeants" className="space-y-6">
              {results.dirigeants?.dirigeants && results.dirigeants.dirigeants.length > 0 ? (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5" />
                        Dirigeants ({results.dirigeants.nbdirigeants || results.dirigeants.dirigeants.length})
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatDirigeantsForCopy(), "dirigeants")}
                        className="gap-2"
                      >
                        {copiedSection === "dirigeants" ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.dirigeants.dirigeants.map((dirigeant: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Nom complet
                              </p>
                              <p className="text-base font-semibold">
                                {dirigeant.prenompp || ""} {dirigeant.nompp || dirigeant.denopm || "Non disponible"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Fonction
                              </p>
                              <p className="text-base">{dirigeant.titre || "Non disponible"}</p>
                            </div>
                            {dirigeant.datenaisspp && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Date de naissance
                                </p>
                                <p className="text-base">{formatDate(dirigeant.datenaisspp)}</p>
                              </div>
                            )}
                            {dirigeant.agepp && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Âge
                                </p>
                                <p className="text-base">{dirigeant.agepp} ans</p>
                              </div>
                            )}
                            {dirigeant.datedebut && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Début de mandat
                                </p>
                                <p className="text-base">{formatDate(dirigeant.datedebut)}</p>
                              </div>
                            )}
                            {dirigeant.datefin && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Fin de mandat
                                </p>
                                <p className="text-base">{formatDate(dirigeant.datefin)}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun dirigeant trouvé</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Financier */}
            <TabsContent value="financier" className="space-y-6">
              {/* Bilans */}
              {results.bilans?.bilans && results.bilans.bilans.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <BarChart3 className="h-5 w-5" />
                        Bilans ({results.bilans.nbbilans || results.bilans.bilans.length})
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatFinancierForCopy(), "financier")}
                        className="gap-2"
                      >
                        {copiedSection === "financier" ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.bilans.bilans.slice(0, 5).map((bilan: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">
                              Bilan {bilan.anneebilan || bilan.datebilan ? formatDate(bilan.datebilan) : "N/A"}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {bilan.typebilan || "Non spécifié"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {bilan.actiftotal && (
                              <div>
                                <p className="text-muted-foreground">Actif total</p>
                                <p className="font-semibold">
                                  {parseFloat(bilan.actiftotal).toLocaleString("fr-FR")} {bilan.devisebilan || "EUR"}
                                </p>
                              </div>
                            )}
                            {bilan.rescatotal && (
                              <div>
                                <p className="text-muted-foreground">Chiffre d'affaires</p>
                                <p className="font-semibold">
                                  {parseFloat(bilan.rescatotal).toLocaleString("fr-FR")} {bilan.devisebilan || "EUR"}
                                </p>
                              </div>
                            )}
                            {bilan.resresnet && (
                              <div>
                                <p className="text-muted-foreground">Résultat net</p>
                                <p className={`font-semibold ${parseFloat(bilan.resresnet) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {parseFloat(bilan.resresnet).toLocaleString("fr-FR")} {bilan.devisebilan || "EUR"}
                                </p>
                              </div>
                            )}
                            {bilan.reseff && (
                              <div>
                                <p className="text-muted-foreground">Effectif</p>
                                <p className="font-semibold">{bilan.reseff} personnes</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Autres */}
            <TabsContent value="autres" className="space-y-6">
              {/* Établissements */}
              {results.etablissements?.etablissements && results.etablissements.etablissements.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5" />
                      Établissements ({results.etablissements.nbetablissements || results.etablissements.etablissements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.etablissements.etablissements.map((etab: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{etab.deno || "Non disponible"}</p>
                                {etab.typeetab === "siege" && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    Siège
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {etab.voieadr || "Non disponible"}
                                {etab.codepostal ? `, ${etab.codepostal}` : ""}
                                {etab.ville ? ` ${etab.ville}` : ""}
                              </p>
                              {etab.naf && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {etab.naf} - {etab.naflib}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">SIRET</p>
                              <p className="text-sm font-mono">{etab.siret}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Procédures collectives */}
              {results.procedures?.procedures && results.procedures.procedures.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <AlertCircle className="h-5 w-5" />
                      Procédures collectives ({results.procedures.nbprocedures || results.procedures.procedures.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.procedures.procedures.map((proc: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{proc.typeproc || "Non spécifié"}</p>
                              <p className="text-sm text-muted-foreground">
                                Du {formatDate(proc.dateproc)} au {proc.datefinproc ? formatDate(proc.datefinproc) : "en cours"}
                              </p>
                              {proc.adminnom1 && (
                                <p className="text-sm mt-1">
                                  {proc.admintype1}: {proc.adminnom1}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evènements */}
              {results.evenements?.evenements && results.evenements.evenements.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-5 w-5" />
                      Évènements ({results.evenements.nbevenements || results.evenements.evenements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.evenements.evenements.slice(0, 20).map((evt: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded border bg-muted/30">
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDate(evt.dateevenement)}
                          </span>
                          <span className="text-sm">{evt.labelevenement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents officiels */}
              {(() => {
                const docList = Array.isArray(results?.documents)
                  ? results.documents
                  : results?.documents?.doc_officiel ?? results?.documents?.documents ?? [];
                const hasDocs = docList.length > 0;
                return hasDocs ? (
                  <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5" />
                        Documents officiels ({docList.length})
                      </CardTitle>
                      <CardDescription>
                        Kbis, statuts et autres documents (source Societe.com)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {docList.map((doc: any, index: number) => (
                          <div key={index} className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-4 flex-wrap">
                            <div>
                              <p className="font-medium">{doc.libelle || doc.type || doc.nom || "Document officiel"}</p>
                              {doc.date && (
                                <p className="text-xs text-muted-foreground mt-1">{doc.date}</p>
                              )}
                            </div>
                            {(doc.url || doc.lien || doc.lien_telechargement) && (
                              <a
                                href={doc.url || doc.lien || doc.lien_telechargement}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline shrink-0"
                              >
                                Télécharger
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Marques */}
              {results.marques?.marques && results.marques.marques.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Award className="h-5 w-5" />
                      Marques ({results.marques.nbmarques || results.marques.marques.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.marques.marques.map((marque: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{marque.nom || "Non disponible"}</p>
                              <p className="text-sm text-muted-foreground">
                                N° {marque.numero} - {marque.status || "Statut inconnu"}
                              </p>
                              {marque.datedepot && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Dépôt: {marque.datedepot}
                                  {marque.dateexp ? ` - Expiration: ${marque.dateexp}` : ""}
                                </p>
                              )}
                            </div>
                            {marque.isvigueur && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">
                                En vigueur
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
