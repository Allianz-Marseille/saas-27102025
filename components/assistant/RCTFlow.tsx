"use client";

import { useState } from "react";
import { RCTStep } from "./RCTStep";
import { ROLES, CONTEXTS_BY_ROLE, TASKS, RCT_EXPLANATIONS, getContextsForRole } from "@/lib/assistant/rct-definitions";
import type { RCTData } from "@/lib/assistant/rct-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface RCTFlowProps {
  onComplete: (rctData: RCTData) => void;
  onReset?: () => void;
  initialData?: RCTData;
}

type RCTStepType = "role" | "context" | "task" | "task_other";

export function RCTFlow({ onComplete, onReset, initialData }: RCTFlowProps) {
  const [currentStep, setCurrentStep] = useState<RCTStepType>("role");
  const [rctData, setRctData] = useState<RCTData>(initialData || {});
  const [customTask, setCustomTask] = useState("");

  const handleRoleSelect = (roleId: string) => {
    const newData = { ...rctData, role: roleId };
    setRctData(newData);
    setCurrentStep("context");
  };

  const handleContextSelect = (contextId: string) => {
    const newData = { ...rctData, context: contextId };
    setRctData(newData);
    setCurrentStep("task");
  };

  const handleTaskSelect = (taskId: string) => {
    if (taskId === "autre") {
      setCurrentStep("task_other");
    } else {
      const newData = { ...rctData, task: taskId };
      setRctData(newData);
      onComplete(newData);
    }
  };

  const handleCustomTaskSubmit = () => {
    if (customTask.trim()) {
      const newData: RCTData = { ...rctData, task: "autre", customTask: customTask.trim() };
      setRctData(newData);
      onComplete(newData);
    }
  };

  const handleBack = () => {
    if (currentStep === "context") {
      setCurrentStep("role");
      setRctData({ ...rctData, context: undefined });
    } else if (currentStep === "task") {
      setCurrentStep("context");
      setRctData({ ...rctData, task: undefined });
    } else if (currentStep === "task_other") {
      setCurrentStep("task");
      setCustomTask("");
    }
  };

  const handleReset = () => {
    setRctData({});
    setCurrentStep("role");
    setCustomTask("");
    onReset?.();
  };

  const renderStep = () => {
    switch (currentStep) {
      case "role":
        return (
          <RCTStep
            title="Il faut préciser mon rôle → Je suis :"
            explanation={RCT_EXPLANATIONS.role}
            stepNumber={1}
            totalSteps={3}
            options={ROLES.map((role) => ({
              id: role.id,
              label: role.label,
              description: role.description,
            }))}
            selectedValue={rctData.role}
            onSelect={handleRoleSelect}
          />
        );

      case "context":
        const contexts = rctData.role ? getContextsForRole(rctData.role) : [];
        return (
          <RCTStep
            title="Préciser le contexte → Dans quel contexte travaillez-vous ?"
            explanation={RCT_EXPLANATIONS.context}
            stepNumber={2}
            totalSteps={3}
            options={contexts.map((context) => ({
              id: context.id,
              label: context.label,
              description: context.description,
            }))}
            selectedValue={rctData.context}
            onSelect={handleContextSelect}
            onBack={handleBack}
            showBackButton={true}
          />
        );

      case "task":
        return (
          <RCTStep
            title="Que souhaitez-vous que l'assistant fasse ?"
            explanation={RCT_EXPLANATIONS.task}
            stepNumber={3}
            totalSteps={3}
            options={TASKS.map((task) => ({
              id: task.id,
              label: task.label,
              description: task.description,
            }))}
            selectedValue={rctData.task}
            onSelect={handleTaskSelect}
            onBack={handleBack}
            showBackButton={true}
          />
        );

      case "task_other":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Précisez votre tâche</h3>
                <span className="text-sm text-muted-foreground">Étape 3/3</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {RCT_EXPLANATIONS.task}
              </p>
            </div>

            <Textarea
              placeholder="Décrivez la tâche que vous souhaitez confier à l'assistant..."
              value={customTask}
              onChange={(e) => setCustomTask(e.target.value)}
              className="min-h-[120px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleCustomTaskSubmit();
                }
              }}
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                ← Retour
              </Button>
              <Button
                onClick={handleCustomTaskSubmit}
                disabled={!customTask.trim()}
                className="flex-1"
              >
                Valider
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
      {rctData.role && (
        <div className="pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  );
}

