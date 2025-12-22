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
  Target,
  Network,
  Scale,
  Copy,
  Check,
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
  siren: string;
  denomination: string;
  forme_juridique?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  code_naf?: string;
  libelle_code_naf?: string;
  date_creation?: string;
  statut?: string;
}

interface EntrepriseData {
  denomination: string;
  sigle?: string;
  forme_juridique: string;
  adresse: string;
  siren: string;
  siret_siege?: string;
  rcs?: string;
  num_tva_intracommunautaire?: string;
  code_naf?: string;
  libelle_code_naf?: string;
  date_creation?: string;
  date_creation_formatee?: string;
  duree_personne_morale?: string;
  date_cloture?: string;
  date_cloture_formatee?: string;
  statut?: string;
  capital?: number;
  capital_formate?: string;
  devise_capital?: string;
  tranche_effectif?: string;
  effectif?: number;
  effectif_min?: number;
  effectif_max?: number;
  annee_effectif?: number;
  latitude?: number;
  longitude?: number;
}

interface BeneficiaireData {
  nom: string;
  prenom: string;
  nom_complet: string;
  date_naissance: string;
  nationalite: string;
  pourcentage_parts: number;
  pourcentage_parts_directes: number;
  pourcentage_parts_indirectes: number;
  pourcentage_votes: number;
}

interface DirigeantData {
  nom: string;
  prenom: string;
  nom_complet: string;
  date_naissance?: string;
  nationalite?: string;
  fonction: string;
  date_debut?: string;
  date_debut_formatee?: string;
  date_fin?: string;
  date_fin_formatee?: string;
  pourcentage_parts?: number;
}

interface BilanData {
  annee?: number;
  date_cloture?: string;
  date_cloture_formatee?: string;
  type_bilan?: string;
  chiffre_affaires?: number;
  resultat_net?: number;
  actif_total?: number;
  passif_total?: number;
  effectif?: number;
  devise?: string;
}

interface EtablissementData {
  siret: string;
  denomination: string;
  adresse?: string;
  adresse_ligne_1?: string;
  adresse_ligne_2?: string;
  code_postal?: string;
  ville?: string;
  code_naf?: string;
  libelle_code_naf?: string;
  type?: string;
  date_creation?: string;
  date_creation_formatee?: string;
  statut?: string;
}

interface ProcedureData {
  type: string;
  date_ouverture?: string;
  date_ouverture_formatee?: string;
  date_cloture?: string;
  date_cloture_formatee?: string;
  tribunal?: string;
  administrateur?: string;
  statut?: string;
}

interface EvenementData {
  date?: string;
  date_formatee?: string;
  libelle: string;
  type?: string;
}

interface FilialeData {
  siren: string;
  denomination: string;
  pourcentage?: number;
  type?: string;
}

interface MarqueData {
  nom: string;
  numero?: string;
  date_depot?: string;
  date_depot_formatee?: string;
  date_expiration?: string;
  date_expiration_formatee?: string;
  statut?: string;
  en_vigueur?: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    entreprise: EntrepriseData;
    beneficiaires_effectifs: BeneficiaireData[];
    dirigeants: DirigeantData[];
    bilans: BilanData[];
    etablissements: EtablissementData[];
    procedures_collectives: ProcedureData[];
    evenements: EvenementData[];
    filiales: FilialeData[];
    participations: FilialeData[];
    marques: MarqueData[];
    documents: any[];
  };
  searchResults?: SearchResult[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
  details?: string;
  suggestion?: string;
}

export default function BeneficiairesEffectifsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sirenInput, setSirenInput] = useState("");
  const [nomInput, setNomInput] = useState("");
  const [searchType, setSearchType] = useState<"siren" | "nom">("siren");
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
    } else {
      if (!nomInput.trim()) {
        setError("Veuillez saisir un nom d'entreprise");
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = await user.getIdToken();

      // Si recherche par nom, appeler l'API de recherche
      if (searchType === "nom") {
        const response = await fetch("/api/pappers/recherche", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ q: nomInput.trim() }),
        });

        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erreur lors de la recherche");
        }

        if (data.searchResults) {
          setSearchResults(data.searchResults);
          toast.success(`${data.searchResults.length} entreprise(s) trouvée(s)`);
        }
      } 
      // Sinon, recherche par SIREN
      else {
        const response = await fetch("/api/pappers/entreprise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ siren: validateAndExtractSiren(sirenInput) }),
        });

        const data: ApiResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Erreur lors de la recherche");
        }

        if (data.data) {
          setResults(data.data);
          toast.success("Recherche effectuée avec succès");
        }
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

      const response = await fetch("/api/pappers/entreprise", {
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

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "Non disponible";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "Non disponible";
    // Si format YYYYMMDD
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
      return `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`;
    }
    return dateStr;
  };

  const copyToClipboard = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      toast.success("Données copiées dans le presse-papier");
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  const formatInformationsForCopy = (): string => {
    if (!results) return "";
    const entreprise = results.entreprise;
    let text = `INFORMATIONS ENTREPRISE\n`;
    text += `${"=".repeat(50)}\n\n`;
    text += `Dénomination: ${entreprise.denomination}\n`;
    if (entreprise.sigle) text += `Sigle: ${entreprise.sigle}\n`;
    text += `Forme juridique: ${entreprise.forme_juridique}\n`;
    text += `Adresse: ${entreprise.adresse}\n`;
    text += `SIREN: ${entreprise.siren}\n`;
    if (entreprise.siret_siege) text += `SIRET siège: ${entreprise.siret_siege}\n`;
    if (entreprise.num_tva_intracommunautaire) text += `TVA intracommunautaire: ${entreprise.num_tva_intracommunautaire}\n`;
    if (entreprise.rcs) text += `RCS: ${entreprise.rcs}\n`;
    if (entreprise.capital !== null && entreprise.capital !== undefined) {
      text += `Capital: ${entreprise.capital_formate || formatCurrency(entreprise.capital)}`;
      if (entreprise.devise_capital) text += ` ${entreprise.devise_capital}`;
      text += `\n`;
    }
    if (entreprise.code_naf) {
      text += `Code NAF/APE: ${entreprise.code_naf} - ${entreprise.libelle_code_naf || "Non disponible"}\n`;
    }
    if (entreprise.date_creation_formatee) text += `Date de création: ${entreprise.date_creation_formatee}\n`;
    if (entreprise.statut) text += `Statut: ${entreprise.statut}\n`;
    if (entreprise.effectif !== null && entreprise.effectif !== undefined) {
      text += `Effectif: ${entreprise.effectif} personnes`;
      if (entreprise.annee_effectif) text += ` (${entreprise.annee_effectif})`;
      text += `\n`;
    }
    return text;
  };

  const formatBeneficiairesForCopy = (): string => {
    if (!results || !results.beneficiaires_effectifs || results.beneficiaires_effectifs.length === 0) return "";
    let text = `BÉNÉFICIAIRES EFFECTIFS\n`;
    text += `${"=".repeat(50)}\n\n`;
    results.beneficiaires_effectifs.forEach((beneficiaire, index) => {
      text += `Bénéficiaire ${index + 1}:\n`;
      text += `  Nom complet: ${beneficiaire.nom_complet}\n`;
      text += `  Date de naissance: ${beneficiaire.date_naissance}\n`;
      text += `  Nationalité: ${beneficiaire.nationalite}\n`;
      if (beneficiaire.pourcentage_parts > 0) {
        text += `  Pourcentage de parts (total): ${beneficiaire.pourcentage_parts.toFixed(2)}%\n`;
      }
      if (beneficiaire.pourcentage_parts_directes > 0) {
        text += `  Parts directes: ${beneficiaire.pourcentage_parts_directes.toFixed(2)}%\n`;
      }
      if (beneficiaire.pourcentage_parts_indirectes > 0) {
        text += `  Parts indirectes: ${beneficiaire.pourcentage_parts_indirectes.toFixed(2)}%\n`;
      }
      if (beneficiaire.pourcentage_votes > 0) {
        text += `  Pourcentage de votes: ${beneficiaire.pourcentage_votes.toFixed(2)}%\n`;
      }
      text += `\n`;
    });
    return text;
  };

  const formatDirigeantsForCopy = (): string => {
    if (!results || !results.dirigeants || results.dirigeants.length === 0) return "";
    let text = `DIRIGEANTS\n`;
    text += `${"=".repeat(50)}\n\n`;
    results.dirigeants.forEach((dirigeant, index) => {
      text += `Dirigeant ${index + 1}:\n`;
      text += `  Nom complet: ${dirigeant.nom_complet}\n`;
      text += `  Fonction: ${dirigeant.fonction}\n`;
      if (dirigeant.date_naissance) text += `  Date de naissance: ${dirigeant.date_naissance}\n`;
      if (dirigeant.nationalite) text += `  Nationalité: ${dirigeant.nationalite}\n`;
      if (dirigeant.date_debut_formatee) text += `  Début de mandat: ${dirigeant.date_debut_formatee}\n`;
      if (dirigeant.date_fin_formatee) text += `  Fin de mandat: ${dirigeant.date_fin_formatee}\n`;
      if (dirigeant.pourcentage_parts !== null && dirigeant.pourcentage_parts !== undefined) {
        text += `  Pourcentage de détention: ${dirigeant.pourcentage_parts.toFixed(2)}%\n`;
      }
      text += `\n`;
    });
    return text;
  };

  const formatFinancierForCopy = (): string => {
    if (!results) return "";
    let text = `INFORMATIONS FINANCIÈRES\n`;
    text += `${"=".repeat(50)}\n\n`;
    
    if (results.bilans && results.bilans.length > 0) {
      text += `BILANS\n`;
      text += `${"-".repeat(30)}\n`;
      results.bilans.slice(0, 5).forEach((bilan, index) => {
        text += `Bilan ${index + 1}:\n`;
        text += `  Année: ${bilan.annee || (bilan.date_cloture_formatee ? formatDate(bilan.date_cloture_formatee) : "N/A")}\n`;
        text += `  Type: ${bilan.type_bilan || "Non spécifié"}\n`;
        if (bilan.actif_total !== null && bilan.actif_total !== undefined) {
          text += `  Actif total: ${formatCurrency(bilan.actif_total)} ${bilan.devise || "EUR"}\n`;
        }
        if (bilan.chiffre_affaires !== null && bilan.chiffre_affaires !== undefined) {
          text += `  Chiffre d'affaires: ${formatCurrency(bilan.chiffre_affaires)} ${bilan.devise || "EUR"}\n`;
        }
        if (bilan.resultat_net !== null && bilan.resultat_net !== undefined) {
          text += `  Résultat net: ${formatCurrency(bilan.resultat_net)} ${bilan.devise || "EUR"}\n`;
        }
        if (bilan.effectif !== null && bilan.effectif !== undefined) {
          text += `  Effectif: ${bilan.effectif} personnes\n`;
        }
        text += `\n`;
      });
    }

    if (results.procedures_collectives && results.procedures_collectives.length > 0) {
      text += `PROCÉDURES COLLECTIVES\n`;
      text += `${"-".repeat(30)}\n`;
      results.procedures_collectives.forEach((proc, index) => {
        text += `Procédure ${index + 1}:\n`;
        text += `  Type: ${proc.type}\n`;
        text += `  Période: ${proc.date_ouverture_formatee ? `Du ${proc.date_ouverture_formatee}` : "Date inconnue"}`;
        text += `${proc.date_cloture_formatee ? ` au ${proc.date_cloture_formatee}` : " (en cours)"}\n`;
        if (proc.administrateur) text += `  Administrateur: ${proc.administrateur}\n`;
        if (proc.tribunal) text += `  Tribunal: ${proc.tribunal}\n`;
        text += `\n`;
      });
    }

    if (results.filiales && results.filiales.length > 0) {
      text += `FILIALES\n`;
      text += `${"-".repeat(30)}\n`;
      results.filiales.forEach((filiale, index) => {
        text += `Filiale ${index + 1}:\n`;
        text += `  Dénomination: ${filiale.denomination}\n`;
        text += `  SIREN: ${filiale.siren}\n`;
        if (filiale.pourcentage !== null && filiale.pourcentage !== undefined) {
          text += `  Détention: ${filiale.pourcentage.toFixed(2)}%\n`;
        }
        text += `\n`;
      });
    }

    if (results.participations && results.participations.length > 0) {
      text += `PARTICIPATIONS\n`;
      text += `${"-".repeat(30)}\n`;
      results.participations.forEach((participation, index) => {
        text += `Participation ${index + 1}:\n`;
        text += `  Dénomination: ${participation.denomination}\n`;
        text += `  SIREN: ${participation.siren}\n`;
        if (participation.pourcentage !== null && participation.pourcentage !== undefined) {
          text += `  Détention: ${participation.pourcentage.toFixed(2)}%\n`;
        }
        text += `\n`;
      });
    }

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
          Informations entreprise (Pappers)
        </h1>
        <p className="text-muted-foreground">
          Consultez toutes les informations disponibles sur une entreprise (légales, dirigeants, bilans, établissements, bénéficiaires effectifs, etc.) via Pappers
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
                  }}
                  className="flex-1"
                >
                  Par nom
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
                    (searchType === "nom" && !nomInput.trim())
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
                              {result.denomination}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">SIREN:</span>{" "}
                                <span className="font-mono">{result.siren}</span>
                              </div>
                              {result.ville && (
                                <div>
                                  <span className="font-medium">Localisation:</span>{" "}
                                  {result.code_postal} {result.ville}
                                </div>
                              )}
                              {result.libelle_code_naf && (
                                <div className="w-full">
                                  <span className="font-medium">Activité:</span>{" "}
                                  {result.code_naf} - {result.libelle_code_naf}
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
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="infos">Informations</TabsTrigger>
                <TabsTrigger value="beneficiaires">Bénéficiaires</TabsTrigger>
                <TabsTrigger value="dirigeants">Dirigeants</TabsTrigger>
                <TabsTrigger value="financier">Financier</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allData = [
                    formatInformationsForCopy(),
                    formatBeneficiairesForCopy(),
                    formatDirigeantsForCopy(),
                    formatFinancierForCopy(),
                  ].filter(Boolean).join("\n\n");
                  copyToClipboard(allData, "all");
                }}
                className="gap-2 ml-4"
              >
                {copiedSection === "all" ? (
                  <>
                    <Check className="h-4 w-4" />
                    Tout copié
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
                      onClick={() => copyToClipboard(formatInformationsForCopy(), "infos")}
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
                        {results.entreprise.denomination}
                      </p>
                    </div>
                    {results.entreprise.sigle && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Sigle
                        </p>
                        <p className="text-base">{results.entreprise.sigle}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Forme juridique
                      </p>
                      <p className="text-base">{results.entreprise.forme_juridique}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Adresse
                      </p>
                      <p className="text-base">{results.entreprise.adresse}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        SIREN
                      </p>
                      <p className="text-base font-mono">{results.entreprise.siren}</p>
                    </div>
                    {results.entreprise.siret_siege && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          SIRET siège
                        </p>
                        <p className="text-base font-mono">{results.entreprise.siret_siege}</p>
                      </div>
                    )}
                    {results.entreprise.num_tva_intracommunautaire && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          TVA intracommunautaire
                        </p>
                        <p className="text-base font-mono">{results.entreprise.num_tva_intracommunautaire}</p>
                      </div>
                    )}
                    {results.entreprise.rcs && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          RCS
                        </p>
                        <p className="text-base">{results.entreprise.rcs}</p>
                      </div>
                    )}
                    {results.entreprise.capital !== null && results.entreprise.capital !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Capital
                        </p>
                        <p className="text-base font-semibold">
                          {results.entreprise.capital_formate || formatCurrency(results.entreprise.capital)}
                          {results.entreprise.devise_capital && ` ${results.entreprise.devise_capital}`}
                        </p>
                      </div>
                    )}
                    {results.entreprise.code_naf && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Code NAF/APE
                        </p>
                        <p className="text-base">
                          {results.entreprise.code_naf} - {results.entreprise.libelle_code_naf || "Non disponible"}
                        </p>
                      </div>
                    )}
                    {results.entreprise.date_creation_formatee && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date de création
                        </p>
                        <p className="text-base">{results.entreprise.date_creation_formatee}</p>
                      </div>
                    )}
                    {results.entreprise.statut && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Statut
                        </p>
                        <p className="text-base">{results.entreprise.statut}</p>
                      </div>
                    )}
                    {results.entreprise.effectif !== null && results.entreprise.effectif !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Effectif
                        </p>
                        <p className="text-base">
                          {results.entreprise.effectif} personnes
                          {results.entreprise.annee_effectif && ` (${results.entreprise.annee_effectif})`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Établissements */}
              {results.etablissements && results.etablissements.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5" />
                      Établissements ({results.etablissements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.etablissements.map((etab, index) => (
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
                                <p className="font-semibold">{etab.denomination}</p>
                                {etab.type === "siege" && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    Siège
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {etab.adresse || `${etab.adresse_ligne_1 || ""} ${etab.adresse_ligne_2 || ""}`.trim()}
                                {etab.code_postal ? `, ${etab.code_postal}` : ""}
                                {etab.ville ? ` ${etab.ville}` : ""}
                              </p>
                              {etab.libelle_code_naf && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {etab.code_naf} - {etab.libelle_code_naf}
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
            </TabsContent>

            {/* Onglet Bénéficiaires effectifs */}
            <TabsContent value="beneficiaires" className="space-y-6">
              {results.beneficiaires_effectifs && results.beneficiaires_effectifs.length > 0 ? (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5" />
                        Bénéficiaires effectifs ({results.beneficiaires_effectifs.length})
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
                      {results.beneficiaires_effectifs.map((beneficiaire, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Nom complet
                              </p>
                              <p className="text-base font-semibold">
                                {beneficiaire.nom_complet}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Date de naissance
                              </p>
                              <p className="text-base">{beneficiaire.date_naissance}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Nationalité
                              </p>
                              <p className="text-base">{beneficiaire.nationalite}</p>
                            </div>
                            {(beneficiaire.pourcentage_parts > 0 || beneficiaire.pourcentage_votes > 0 || beneficiaire.pourcentage_parts_directes > 0 || beneficiaire.pourcentage_parts_indirectes > 0) && (
                              <>
                                {beneficiaire.pourcentage_parts > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Pourcentage de parts (total)
                                    </p>
                                    <p className="text-base font-semibold text-primary">
                                      {beneficiaire.pourcentage_parts.toFixed(2)}%
                                    </p>
                                  </div>
                                )}
                                {beneficiaire.pourcentage_parts_directes > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Parts directes
                                    </p>
                                    <p className="text-base text-primary/80">
                                      {beneficiaire.pourcentage_parts_directes.toFixed(2)}%
                                    </p>
                                  </div>
                                )}
                                {beneficiaire.pourcentage_parts_indirectes > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Parts indirectes
                                    </p>
                                    <p className="text-base text-primary/80">
                                      {beneficiaire.pourcentage_parts_indirectes.toFixed(2)}%
                                    </p>
                                  </div>
                                )}
                                {beneficiaire.pourcentage_votes > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Pourcentage de votes
                                    </p>
                                    <p className="text-base font-semibold text-primary">
                                      {beneficiaire.pourcentage_votes.toFixed(2)}%
                                    </p>
                                  </div>
                                )}
                              </>
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
                      <p>Aucun bénéficiaire effectif trouvé pour cette entreprise</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Dirigeants */}
            <TabsContent value="dirigeants" className="space-y-6">
              {results.dirigeants && results.dirigeants.length > 0 ? (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5" />
                        Dirigeants ({results.dirigeants.length})
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
                      {results.dirigeants.map((dirigeant, index) => (
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
                                {dirigeant.nom_complet}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Fonction
                              </p>
                              <p className="text-base">{dirigeant.fonction}</p>
                            </div>
                            {dirigeant.date_naissance && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Date de naissance
                                </p>
                                <p className="text-base">{dirigeant.date_naissance}</p>
                              </div>
                            )}
                            {dirigeant.nationalite && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Nationalité
                                </p>
                                <p className="text-base">{dirigeant.nationalite}</p>
                              </div>
                            )}
                            {dirigeant.date_debut_formatee && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Début de mandat
                                </p>
                                <p className="text-base">{dirigeant.date_debut_formatee}</p>
                              </div>
                            )}
                            {dirigeant.date_fin_formatee && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Fin de mandat
                                </p>
                                <p className="text-base">{dirigeant.date_fin_formatee}</p>
                              </div>
                            )}
                            {dirigeant.pourcentage_parts !== null && dirigeant.pourcentage_parts !== undefined && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Pourcentage de détention
                                </p>
                                <p className="text-base font-semibold text-primary">
                                  {dirigeant.pourcentage_parts.toFixed(2)}%
                                </p>
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
              {/* Bouton copier toutes les infos financières */}
              <div className="flex justify-end mb-4">
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
                      Copier toutes les informations financières
                    </>
                  )}
                </Button>
              </div>

              {/* Bilans */}
              {results.bilans && results.bilans.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BarChart3 className="h-5 w-5" />
                      Bilans ({results.bilans.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.bilans.slice(0, 5).map((bilan, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">
                              Bilan {bilan.annee || (bilan.date_cloture_formatee ? formatDate(bilan.date_cloture_formatee) : "N/A")}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {bilan.type_bilan || "Non spécifié"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {bilan.actif_total !== null && bilan.actif_total !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Actif total</p>
                                <p className="font-semibold">
                                  {formatCurrency(bilan.actif_total)} {bilan.devise || "EUR"}
                                </p>
                              </div>
                            )}
                            {bilan.chiffre_affaires !== null && bilan.chiffre_affaires !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Chiffre d'affaires</p>
                                <p className="font-semibold">
                                  {formatCurrency(bilan.chiffre_affaires)} {bilan.devise || "EUR"}
                                </p>
                              </div>
                            )}
                            {bilan.resultat_net !== null && bilan.resultat_net !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Résultat net</p>
                                <p className={`font-semibold ${bilan.resultat_net >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {formatCurrency(bilan.resultat_net)} {bilan.devise || "EUR"}
                                </p>
                              </div>
                            )}
                            {bilan.effectif !== null && bilan.effectif !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Effectif</p>
                                <p className="font-semibold">{bilan.effectif} personnes</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Procédures collectives */}
              {results.procedures_collectives && results.procedures_collectives.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <AlertCircle className="h-5 w-5" />
                      Procédures collectives ({results.procedures_collectives.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.procedures_collectives.map((proc, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{proc.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {proc.date_ouverture_formatee ? `Du ${proc.date_ouverture_formatee}` : "Date inconnue"}
                                {proc.date_cloture_formatee ? ` au ${proc.date_cloture_formatee}` : " (en cours)"}
                              </p>
                              {proc.administrateur && (
                                <p className="text-sm mt-1">
                                  Administrateur: {proc.administrateur}
                                </p>
                              )}
                              {proc.tribunal && (
                                <p className="text-sm mt-1">
                                  Tribunal: {proc.tribunal}
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

              {/* Événements */}
              {results.evenements && results.evenements.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-5 w-5" />
                      Événements ({results.evenements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.evenements.slice(0, 20).map((evt, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 rounded border bg-muted/30">
                          <span className="text-xs text-muted-foreground shrink-0">
                            {evt.date_formatee || formatDate(evt.date) || "Date inconnue"}
                          </span>
                          <span className="text-sm">{evt.libelle}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filiales et participations */}
              {(results.filiales && results.filiales.length > 0) || (results.participations && results.participations.length > 0) && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Network className="h-5 w-5" />
                      Filiales et participations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.filiales && results.filiales.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">Filiales ({results.filiales.length})</h4>
                        <div className="space-y-2">
                          {results.filiales.map((filiale, index) => (
                            <div key={index} className="p-3 rounded-lg border bg-muted/30">
                              <p className="font-semibold">{filiale.denomination}</p>
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                <span>SIREN: <span className="font-mono">{filiale.siren}</span></span>
                                {filiale.pourcentage !== null && filiale.pourcentage !== undefined && (
                                  <span>Détention: {filiale.pourcentage.toFixed(2)}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {results.participations && results.participations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Participations ({results.participations.length})</h4>
                        <div className="space-y-2">
                          {results.participations.map((participation, index) => (
                            <div key={index} className="p-3 rounded-lg border bg-muted/30">
                              <p className="font-semibold">{participation.denomination}</p>
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                <span>SIREN: <span className="font-mono">{participation.siren}</span></span>
                                {participation.pourcentage !== null && participation.pourcentage !== undefined && (
                                  <span>Détention: {participation.pourcentage.toFixed(2)}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Marques */}
              {results.marques && results.marques.length > 0 && (
                <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Award className="h-5 w-5" />
                      Marques ({results.marques.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.marques.map((marque, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">{marque.nom}</p>
                              {marque.numero && (
                                <p className="text-sm text-muted-foreground">
                                  N° {marque.numero} - {marque.statut || "Statut inconnu"}
                                </p>
                              )}
                              {marque.date_depot_formatee && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Dépôt: {marque.date_depot_formatee}
                                  {marque.date_expiration_formatee && ` - Expiration: ${marque.date_expiration_formatee}`}
                                </p>
                              )}
                            </div>
                            {marque.en_vigueur && (
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
