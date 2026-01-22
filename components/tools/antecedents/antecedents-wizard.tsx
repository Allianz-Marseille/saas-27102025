"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AntecedentsEngine } from "@/lib/tools/antecedents/antecedentsEngine";
import type {
  ContexteSouscription,
  ReleveInformations,
  Sinistre,
  JournalDecision,
} from "@/lib/tools/antecedents/antecedentsTypes";
import { AntecedentsStep } from "./antecedents-step";
import { AntecedentsRIForm } from "./antecedents-ri-form";
import { AntecedentsSinistresForm } from "./antecedents-sinistres-form";
import { AntecedentsResult } from "./antecedents-result";
import { AntecedentsProgress } from "./antecedents-progress";
import { AntecedentsBreadcrumb } from "./antecedents-breadcrumb";

interface AntecedentsWizardProps {
  isClientMode: boolean;
}

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface HistoryItem {
  step: WizardStep;
  label: string;
}

export function AntecedentsWizard({ isClientMode }: AntecedentsWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [journal, setJournal] = useState<JournalDecision | null>(null);

  // État accumulé du contexte
  const [contexte, setContexte] = useState<Partial<ContexteSouscription>>({});
  const [ri, setRI] = useState<Partial<ReleveInformations>>({});
  const [sinistres, setSinistres] = useState<Sinistre[]>([]);
  const [crmVehiculesParc, setCrmVehiculesParc] = useState<number[]>([]);

  const engine = new AntecedentsEngine();

  // Étapes du wizard
  const stepLabels: Record<WizardStep, string> = {
    0: "Contexte de souscription",
    1: "Conducteur désigné",
    2: "Relevé d'informations",
    3: "Calcul CRM",
    4: "Sinistres à saisir",
    5: "Bonus-malus",
    6: "Validation",
    7: "Journal de décision",
  };

  const handleStepComplete = (step: WizardStep, data: any) => {
    // Sauvegarder les données selon l'étape
    switch (step) {
      case 0:
        setContexte({ ...contexte, ...data });
        break;
      case 1:
        setContexte({ ...contexte, ...data });
        break;
      case 2:
        setRI({ ...ri, ...data });
        break;
      case 4:
        setSinistres(data);
        break;
      case 5:
        // Bonus-malus (optionnel, à implémenter)
        break;
    }

    // Ajouter à l'historique
    setHistory([...history, { step: currentStep, label: stepLabels[currentStep] }]);

    // Passer à l'étape suivante
    if (step < 7) {
      setCurrentStep((step + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousItem = history[history.length - 1];
      setCurrentStep(previousItem.step);
      setHistory(history.slice(0, -1));
      setJournal(null);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setHistory([]);
    setJournal(null);
    setContexte({});
    setRI({});
    setSinistres([]);
    setCrmVehiculesParc([]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index < history.length) {
      const targetItem = history[index];
      setCurrentStep(targetItem.step);
      setHistory(history.slice(0, index));
      setJournal(null);
    }
  };

  // Calcul automatique du CRM à l'étape 3
  const calculerCRM = () => {
    if (currentStep === 3) {
      const contexteComplet = contexte as ContexteSouscription;
      const riComplet = ri as ReleveInformations;

      if (!contexteComplet.type_souscripteur || !contexteComplet.usage) {
        return; // Contexte incomplet
      }

      try {
        const resultatCRM = engine.calculerCRM(
          contexteComplet,
          riComplet.present ? riComplet : undefined,
          crmVehiculesParc.length > 0 ? crmVehiculesParc : undefined
        );

        if ("erreur" in resultatCRM) {
          console.error("Erreur calcul CRM:", resultatCRM.erreur);
          return;
        }

        // Continuer automatiquement à l'étape suivante
        handleStepComplete(3, { crm: resultatCRM });
      } catch (error) {
        console.error("Erreur lors du calcul CRM:", error);
      }
    }
  };

  // Génération du journal à l'étape 6
  const genererJournal = () => {
    if (currentStep === 6) {
      const contexteComplet = contexte as ContexteSouscription;
      const riComplet = ri as ReleveInformations;

      if (!contexteComplet.type_souscripteur || !contexteComplet.usage) {
        return;
      }

      try {
        // Recalculer le CRM
        const resultatCRM = engine.calculerCRM(
          contexteComplet,
          riComplet.present ? riComplet : undefined,
          crmVehiculesParc.length > 0 ? crmVehiculesParc : undefined
        );

        if ("erreur" in resultatCRM) {
          console.error("Erreur calcul CRM:", resultatCRM.erreur);
          return;
        }

        // Déterminer la règle sinistres
        const regleSinistres = engine.determinerSinistres(contexteComplet);
        if ("erreur" in regleSinistres) {
          console.error("Erreur règle sinistres:", regleSinistres.erreur);
          return;
        }

        // Vérifier les blocages
        const blocages = engine.verifierBlocages(
          contexteComplet,
          resultatCRM.valeur,
          riComplet.present ? true : false // carteVTC (à améliorer)
        );

        // Détecter les alertes
        const alertes = engine.detecterAlertes(contexteComplet, riComplet, sinistres);

        // Générer le journal
        const journalGenere = engine.genererJournal(
          contexteComplet,
          resultatCRM,
          regleSinistres,
          sinistres,
          blocages,
          alertes,
          riComplet.present ? riComplet : undefined
        );

        setJournal(journalGenere);
        setCurrentStep(7);
      } catch (error) {
        console.error("Erreur lors de la génération du journal:", error);
      }
    }
  };

  // Breadcrumb items
  const breadcrumbItems = history.map((item, index) => ({
    label: item.label,
    onClick: () => handleBreadcrumbClick(index),
  }));

  // Calculer le nombre total d'étapes
  const totalSteps = 8;
  const currentStepNumber = currentStep + 1;

  // Effet pour calculer automatiquement le CRM à l'étape 3
  useEffect(() => {
    if (currentStep === 3) {
      calculerCRM();
    }
  }, [currentStep]);

  // Effet pour générer automatiquement le journal à l'étape 6
  useEffect(() => {
    if (currentStep === 6) {
      genererJournal();
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Barre de progression */}
      {!journal && (
        <AntecedentsProgress
          currentStep={currentStepNumber}
          totalSteps={totalSteps}
          currentQuestion={stepLabels[currentStep]}
        />
      )}

      {/* Breadcrumb */}
      {history.length > 0 && (
        <AntecedentsBreadcrumb
          items={breadcrumbItems}
          onBack={!journal ? handleBack : undefined}
        />
      )}

      {/* Contenu principal */}
      <AnimatePresence mode="wait">
        {journal ? (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AntecedentsResult
              journal={journal}
              onReset={handleReset}
              isClientMode={isClientMode}
            />
          </motion.div>
        ) : (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {currentStep === 0 && (
              <AntecedentsStep
                step={0}
                title="Contexte de souscription"
                onComplete={(data) => handleStepComplete(0, data)}
              />
            )}
            {currentStep === 1 && (
              <AntecedentsStep
                step={1}
                title="Conducteur désigné"
                onComplete={(data) => handleStepComplete(1, data)}
              />
            )}
            {currentStep === 2 && (
              <AntecedentsRIForm
                onComplete={(data) => handleStepComplete(2, data)}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="mb-6"
                  >
                    <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
                      <Calculator className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-4">Calcul du CRM en cours...</h2>
                  <p className="text-muted-foreground">
                    Application des règles métier en cours...
                  </p>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <AntecedentsSinistresForm
                regleSinistres={engine.determinerSinistres(contexte as ContexteSouscription)}
                onComplete={(data) => handleStepComplete(4, data)}
                onBack={handleBack}
              />
            )}
            {currentStep === 5 && (
              <AntecedentsStep
                step={5}
                title="Bonus-malus (optionnel)"
                onComplete={(data) => handleStepComplete(5, data)}
              />
            )}
            {currentStep === 6 && (
              <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Validation en cours...</h2>
                  <p className="text-muted-foreground">
                    Vérification des blocages et génération du journal...
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Calculator } from "lucide-react";
