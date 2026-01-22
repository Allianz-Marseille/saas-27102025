"use client";

import { motion } from "framer-motion";
import { Building2, User, Briefcase, Car, BriefcaseBusiness, Navigation, Truck, Users, Plus, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContexteSouscription, TypeSouscripteur, UsageVehicule, SituationSouscription, TypeConducteur } from "@/lib/tools/antecedents/antecedentsTypes";

interface AntecedentsStepProps {
  step: 0 | 1 | 5;
  title: string;
  onComplete: (data: Partial<ContexteSouscription>) => void;
}

export function AntecedentsStep({ step, title, onComplete }: AntecedentsStepProps) {
  const handleStep0 = (data: { type_souscripteur: TypeSouscripteur; usage: UsageVehicule; situation: SituationSouscription; nb_vehicules_actuels: number }) => {
    onComplete(data);
  };

  const handleStep1 = (data: { conducteur_designe: boolean; conducteur_type?: TypeConducteur; conducteur_nom?: string }) => {
    onComplete(data);
  };

  const handleStep5 = (data: { actualiser_bonus_malus: boolean }) => {
    // L'étape 5 (bonus-malus) n'ajoute pas de données au contexte pour l'instant
    onComplete({});
  };

  if (step === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground">
              Sélectionnez les informations de base pour le diagnostic
            </p>
          </div>

          {/* Type souscripteur */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Qui est l'assuré ?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "prive",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <p className="font-semibold">Personne morale</p>
                  <p className="text-sm text-muted-foreground">Société</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_physique",
                  usage: "prive",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="font-semibold">Personne physique</p>
                  <p className="text-sm text-muted-foreground">Particulier</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "assimile_pm",
                  usage: "prive",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-amber-600" />
                  <p className="font-semibold">Assimilé PM</p>
                  <p className="text-sm text-muted-foreground">Artisan, commerçant</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Usage principal du véhicule ?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "prive",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <Car className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <p className="font-semibold">Privé</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "tous_deplacements",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <BriefcaseBusiness className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                  <p className="font-semibold">Tous déplacements</p>
                  <p className="text-sm text-muted-foreground">Pro + perso</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "VTC",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <Navigation className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <p className="font-semibold">Taxi / VTC</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Situation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Type de souscription ?</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "prive",
                  situation: "premier_vehicule",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <p className="font-semibold">1er véhicule</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "prive",
                  situation: "ajout_vehicule",
                  nb_vehicules_actuels: 1,
                })}
              >
                <CardContent className="p-6 text-center">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <p className="font-semibold">Ajout véhicule</p>
                  <p className="text-sm text-muted-foreground">2e, 3e, etc.</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleStep0({
                  type_souscripteur: "personne_morale",
                  usage: "prive",
                  situation: "remplacement",
                  nb_vehicules_actuels: 0,
                })}
              >
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 text-amber-600" />
                  <p className="font-semibold">Remplacement</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground">
              Un conducteur habituel est-il désigné ?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleStep1({ conducteur_designe: true })}
            >
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="font-semibold">Oui</p>
                <p className="text-sm text-muted-foreground">Conducteur désigné</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleStep1({ conducteur_designe: false })}
            >
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="font-semibold">Non</p>
                <p className="text-sm text-muted-foreground">Pas de conducteur désigné</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-muted-foreground">
              Actualiser le CRM selon échéance ?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleStep5({ actualiser_bonus_malus: true })}
            >
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <p className="font-semibold">Oui</p>
                <p className="text-sm text-muted-foreground">Actualiser</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handleStep5({ actualiser_bonus_malus: false })}
            >
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="font-semibold">Non</p>
                <p className="text-sm text-muted-foreground">Garder CRM actuel</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
