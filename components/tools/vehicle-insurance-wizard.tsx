"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeNode, TreeOption, InsuranceResult, vehicleInsuranceTree } from "@/lib/tools/vehicleInsuranceTree";
import { VehicleInsuranceStep } from "./vehicle-insurance-step";
import { VehicleInsuranceResult } from "./vehicle-insurance-result";
import { VehicleInsuranceProgress } from "./vehicle-insurance-progress";
import { VehicleInsuranceBreadcrumb } from "./vehicle-insurance-breadcrumb";

interface VehicleInsuranceWizardProps {
  isClientMode: boolean;
  searchQuery?: string;
}

interface HistoryItem {
  nodeId: string;
  choiceLabel: string;
}

export function VehicleInsuranceWizard({
  isClientMode,
  searchQuery = "",
}: VehicleInsuranceWizardProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string>("START");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [result, setResult] = useState<InsuranceResult | null>(null);

  const currentNode = vehicleInsuranceTree.nodes.find(n => n.id === currentNodeId);

  const handleOptionClick = (option: TreeOption) => {
    // Ajouter au history
    if (currentNode) {
      setHistory([...history, { nodeId: currentNodeId, choiceLabel: option.label }]);
    }

    if (option.nextId) {
      // Aller au prochain node
      setCurrentNodeId(option.nextId);
    } else if (option.resultId) {
      // Afficher le résultat
      const resultData = vehicleInsuranceTree.results.find(r => r.id === option.resultId);
      if (resultData) {
        setResult(resultData);
      }
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const previousItem = history[history.length - 1];
      setCurrentNodeId(previousItem.nodeId);
      setHistory(history.slice(0, -1));
      setResult(null);
    }
  };

  const handleReset = () => {
    setCurrentNodeId("START");
    setHistory([]);
    setResult(null);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index < history.length) {
      const targetItem = history[index];
      setCurrentNodeId(targetItem.nodeId);
      setHistory(history.slice(0, index));
      setResult(null);
    }
  };

  // Breadcrumb items
  const breadcrumbItems = history.map((item, index) => ({
    label: item.choiceLabel,
    onClick: () => handleBreadcrumbClick(index),
  }));

  // Calculer le nombre total d'étapes (approximatif)
  const totalSteps = result ? history.length + 1 : 5; // Max 5 étapes
  const currentStep = result ? history.length + 1 : history.length + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Barre de progression */}
      {!result && (
        <VehicleInsuranceProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          currentQuestion={currentNode?.question}
        />
      )}

      {/* Breadcrumb */}
      {history.length > 0 && (
        <VehicleInsuranceBreadcrumb
          items={breadcrumbItems}
          onBack={!result ? handleBack : undefined}
        />
      )}

      {/* Contenu principal */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="result">
            <VehicleInsuranceResult
              result={result}
              onReset={handleReset}
              isClientMode={isClientMode}
            />
          </motion.div>
        ) : currentNode ? (
          <motion.div key={currentNodeId}>
            <VehicleInsuranceStep
              node={currentNode}
              onOptionClick={handleOptionClick}
              searchQuery={searchQuery}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
