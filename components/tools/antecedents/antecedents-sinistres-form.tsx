"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Sinistre, RegleSinistres, NatureSinistre, ResponsabiliteSinistre, StatutSinistre } from "@/lib/tools/antecedents/antecedentsTypes";

interface AntecedentsSinistresFormProps {
  regleSinistres: RegleSinistres | { erreur: string };
  onComplete: (data: Sinistre[]) => void;
  onBack: () => void;
}

export function AntecedentsSinistresForm({
  regleSinistres,
  onComplete,
  onBack,
}: AntecedentsSinistresFormProps) {
  const [sinistres, setSinistres] = useState<Sinistre[]>([]);

  const addSinistre = () => {
    setSinistres([
      ...sinistres,
      {
        date: new Date(),
        nature: "collision",
        responsabilite: "non_responsable",
        montant: 0,
        statut: "clos",
      },
    ]);
  };

  const removeSinistre = (index: number) => {
    setSinistres(sinistres.filter((_, i) => i !== index));
  };

  const updateSinistre = (index: number, field: keyof Sinistre, value: any) => {
    const updated = [...sinistres];
    updated[index] = { ...updated[index], [field]: value };
    setSinistres(updated);
  };

  const handleSubmit = () => {
    onComplete(sinistres);
  };

  if ("erreur" in regleSinistres) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <p className="text-red-600">Erreur : {regleSinistres.erreur}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Sinistres à déclarer</h2>
          <p className="text-muted-foreground">
            Règle : {regleSinistres.regle_id} - Période : {regleSinistres.periode_mois} mois
          </p>
        </div>

        {/* Info règle */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm">
              <strong>À retenir :</strong> {regleSinistres.a_retenir.join(", ")}
            </p>
            {regleSinistres.a_exclure.length > 0 && (
              <p className="text-sm mt-2">
                <strong>À exclure :</strong> {regleSinistres.a_exclure.join(", ")}
              </p>
            )}
            {regleSinistres.regle_speciale && (
              <p className="text-sm mt-2 text-orange-600">
                <strong>Règle spéciale :</strong> {regleSinistres.regle_speciale}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Liste des sinistres */}
        <div className="space-y-4">
          {sinistres.map((sinistre, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sinistre {index + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSinistre(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={sinistre.date.toISOString().split("T")[0]}
                    onChange={(e) =>
                      updateSinistre(index, "date", new Date(e.target.value))
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Nature</Label>
                  <Select
                    value={sinistre.nature}
                    onValueChange={(value) =>
                      updateSinistre(index, "nature", value as NatureSinistre)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collision">Collision</SelectItem>
                      <SelectItem value="bris_de_glace">Bris de glace</SelectItem>
                      <SelectItem value="vol">Vol</SelectItem>
                      <SelectItem value="incendie">Incendie</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Responsabilité</Label>
                  <Select
                    value={sinistre.responsabilite}
                    onValueChange={(value) =>
                      updateSinistre(index, "responsabilite", value as ResponsabiliteSinistre)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="responsable">Responsable</SelectItem>
                      <SelectItem value="partiellement_responsable">
                        Partiellement responsable
                      </SelectItem>
                      <SelectItem value="non_responsable">Non responsable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Montant (€)
                  </Label>
                  <Input
                    type="number"
                    value={sinistre.montant}
                    onChange={(e) =>
                      updateSinistre(index, "montant", parseFloat(e.target.value) || 0)
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Statut</Label>
                  <Select
                    value={sinistre.statut}
                    onValueChange={(value) =>
                      updateSinistre(index, "statut", value as StatutSinistre)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clos">Clos</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="sans_reglement">Sans règlement</SelectItem>
                      <SelectItem value="pre_ouverture">Pré-ouverture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={addSinistre}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un sinistre
          </Button>
        </div>

        {/* Boutons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-orange-500 to-red-600"
          >
            Continuer
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
