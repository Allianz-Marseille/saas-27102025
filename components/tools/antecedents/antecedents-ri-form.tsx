"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Calculator, Clock, AlertCircle, FileCheck, FileX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ReleveInformations } from "@/lib/tools/antecedents/antecedentsTypes";

interface AntecedentsRIFormProps {
  onComplete: (data: ReleveInformations) => void;
  onBack: () => void;
}

export function AntecedentsRIForm({ onComplete, onBack }: AntecedentsRIFormProps) {
  const [dureeRIJustifiee, setDureeRIJustifiee] = useState<number | null>(null);
  const [dateRI, setDateRI] = useState<string>("");
  const [crmRI, setCrmRI] = useState<string>("");
  const [dureeRIConsecutive, setDureeRIConsecutive] = useState<string>("");
  const [continuite, setContinuite] = useState<boolean>(false);
  const [interruption, setInterruption] = useState<string>("");

  const handleSubmit = () => {
    if (dureeRIJustifiee === null) return;

    const ri: ReleveInformations = {
      present: dureeRIJustifiee > 0,
      continuite_assurance: continuite,
    };

    // Si le client peut justifier d'un RI (durée > 0), on demande les détails
    if (dureeRIJustifiee > 0) {
      if (dateRI) {
        ri.date = new Date(dateRI);
      }

      if (crmRI) {
        ri.crm_ri = parseFloat(crmRI);
      }

      ri.duree_ri_mois = dureeRIJustifiee;

      if (dureeRIConsecutive) {
        ri.duree_ri_consecutive_mois = parseInt(dureeRIConsecutive);
      }
    }

    if (interruption) {
      ri.interruption_mois = parseInt(interruption);
    }

    onComplete(ri);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Relevé d'informations</h2>
          <p className="text-muted-foreground">
            De combien de mois de RI le client peut-il justifier ?
          </p>
        </div>

        {/* Durée RI justifiée */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all ${
              dureeRIJustifiee === 0
                ? "ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800"
                : "hover:shadow-lg"
            }`}
            onClick={() => setDureeRIJustifiee(0)}
          >
            <CardContent className="p-6 text-center">
              <FileX className="h-10 w-10 mx-auto mb-3 text-amber-600" />
              <p className="font-semibold mb-1">0 mois</p>
              <p className="text-xs text-muted-foreground">Pas de RI</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              dureeRIJustifiee !== null && dureeRIJustifiee > 0 && dureeRIJustifiee <= 12
                ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800"
                : "hover:shadow-lg"
            }`}
            onClick={() => setDureeRIJustifiee(12)}
          >
            <CardContent className="p-6 text-center">
              <FileCheck className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <p className="font-semibold mb-1">1-12 mois</p>
              <p className="text-xs text-muted-foreground">RI récent</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              dureeRIJustifiee !== null && dureeRIJustifiee > 12 && dureeRIJustifiee <= 24
                ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800"
                : "hover:shadow-lg"
            }`}
            onClick={() => setDureeRIJustifiee(24)}
          >
            <CardContent className="p-6 text-center">
              <FileCheck className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <p className="font-semibold mb-1">13-24 mois</p>
              <p className="text-xs text-muted-foreground">RI moyen</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              dureeRIJustifiee !== null && dureeRIJustifiee > 24
                ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800"
                : "hover:shadow-lg"
            }`}
            onClick={() => setDureeRIJustifiee(36)}
          >
            <CardContent className="p-6 text-center">
              <FileCheck className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <p className="font-semibold mb-1">24+ mois</p>
              <p className="text-xs text-muted-foreground">RI long</p>
            </CardContent>
          </Card>
        </div>

        {/* Saisie manuelle de la durée */}
        {dureeRIJustifiee !== null && (
          <Card className="bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="p-4">
              <Label htmlFor="duree-ri-manuelle" className="text-sm font-medium">
                Durée exacte (mois) : {dureeRIJustifiee}
              </Label>
              <Input
                id="duree-ri-manuelle"
                type="number"
                min="0"
                placeholder="Saisir la durée exacte en mois"
                value={dureeRIJustifiee === 0 ? "" : dureeRIJustifiee}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                  setDureeRIJustifiee(isNaN(value) ? null : value);
                }}
                className="mt-2"
              />
            </CardContent>
          </Card>
        )}

        {/* Formulaire RI si durée > 0 */}
        {dureeRIJustifiee !== null && dureeRIJustifiee > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Informations du Relevé d'Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date-ri">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Date du RI
                  </Label>
                  <Input
                    id="date-ri"
                    type="date"
                    value={dateRI}
                    onChange={(e) => setDateRI(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="crm-ri">
                    <Calculator className="h-4 w-4 inline mr-2" />
                    CRM figurant sur le RI
                  </Label>
                  <Input
                    id="crm-ri"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 0.85"
                    value={crmRI}
                    onChange={(e) => setCrmRI(e.target.value)}
                    className="mt-2"
                  />
                </div>


                <div>
                  <Label htmlFor="duree-ri-consecutive">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Durée RI consécutive (pour VTC : ≥21 sur 24 mois)
                  </Label>
                  <Input
                    id="duree-ri-consecutive"
                    type="number"
                    placeholder="Ex: 24"
                    value={dureeRIConsecutive}
                    onChange={(e) => setDureeRIConsecutive(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="continuite"
                    checked={continuite}
                    onCheckedChange={(checked) => setContinuite(checked === true)}
                  />
                  <Label htmlFor="continuite">Continuité assurance</Label>
                </div>

                {!continuite && (
                  <div>
                    <Label htmlFor="interruption">
                      Durée interruption (mois)
                    </Label>
                    <Input
                      id="interruption"
                      type="number"
                      placeholder="Ex: 6"
                      value={interruption}
                      onChange={(e) => setInterruption(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alerte si pas de RI */}
        {dureeRIJustifiee === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-2">ALERTE : Pas de RI justifiable</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Impossibilité de reprendre le bonus</li>
                      <li>Application CRM par défaut (selon profil)</li>
                      <li>Majoration tarifaire possible</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Boutons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={dureeRIJustifiee === null}
            className="bg-gradient-to-r from-orange-500 to-red-600"
          >
            Continuer
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
