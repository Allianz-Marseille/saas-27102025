"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, Building2, MapPin, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";

interface EntrepriseData {
  denomination: string;
  forme_juridique: string;
  adresse: string;
  siren: string;
}

interface BeneficiaireData {
  nom: string;
  prenom: string;
  date_naissance: string;
  nationalite: string;
  qualite: string;
  pourcentage_parts: number;
  pourcentage_votes: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    entreprise: EntrepriseData;
    beneficiaires: BeneficiaireData[];
  };
  error?: string;
}

export default function BeneficiairesEffectifsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sirenInput, setSirenInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation et conversion SIRET → SIREN
  const validateAndExtractSiren = (input: string): string | null => {
    // Nettoyer l'input (supprimer les espaces et caractères non numériques)
    const cleaned = input.replace(/\s+/g, "").replace(/\D/g, "");

    if (cleaned.length === 9) {
      // C'est un SIREN
      return cleaned;
    } else if (cleaned.length === 14) {
      // C'est un SIRET, extraire les 9 premiers chiffres (SIREN)
      return cleaned.substring(0, 9);
    } else {
      return null;
    }
  };

  const handleSearch = async () => {
    // Réinitialiser les erreurs et résultats précédents
    setError(null);
    setResults(null);

    // Validation
    const siren = validateAndExtractSiren(sirenInput);
    if (!siren) {
      setError("Veuillez saisir un SIREN (9 chiffres) ou un SIRET (14 chiffres) valide");
      return;
    }

    if (!user) {
      setError("Vous devez être connecté pour effectuer une recherche");
      return;
    }

    setIsLoading(true);

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/pappers/beneficiaires", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ siren }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la recherche");
      }

      if (data.data) {
        setResults(data.data);
        toast.success("Recherche effectuée avec succès");
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
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
          Bénéficiaires effectifs
        </h1>
        <p className="text-muted-foreground">
          Recherchez les bénéficiaires effectifs d'une entreprise par SIREN ou SIRET
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
              Saisissez un SIREN (9 chiffres) ou un SIRET (14 chiffres)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Ex: 123456789 ou 12345678901234"
                  value={sirenInput}
                  onChange={(e) => setSirenInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading || !sirenInput.trim()}
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
                <p className="text-sm font-medium">{error}</p>
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
          {/* Informations de l'entreprise */}
          <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Dénomination
                </p>
                <p className="text-base font-semibold">{results.entreprise.denomination}</p>
              </div>
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
            </CardContent>
          </Card>

          {/* Liste des bénéficiaires effectifs */}
          <Card className="bg-card text-card-foreground rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5" />
                Bénéficiaires effectifs
                {results.beneficiaires.length > 0 && (
                  <span className="text-base font-normal text-muted-foreground">
                    ({results.beneficiaires.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.beneficiaires.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun bénéficiaire effectif trouvé pour cette entreprise</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.beneficiaires.map((beneficiaire, index) => (
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
                            {beneficiaire.prenom} {beneficiaire.nom}
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
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Qualité
                          </p>
                          <p className="text-base">{beneficiaire.qualite}</p>
                        </div>
                        {(beneficiaire.pourcentage_parts > 0 || beneficiaire.pourcentage_votes > 0) && (
                          <>
                            {beneficiaire.pourcentage_parts > 0 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                  Pourcentage de parts
                                </p>
                                <p className="text-base font-semibold text-primary">
                                  {beneficiaire.pourcentage_parts.toFixed(2)}%
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
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
