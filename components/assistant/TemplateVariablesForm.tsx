"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";
import type { PromptTemplate } from "@/lib/assistant/templates";
import { extractTemplateVariables, replaceTemplateVariables } from "@/lib/assistant/templates";

interface TemplateVariablesFormProps {
  template: PromptTemplate;
  onApply: (filledPrompt: string) => void;
  onCancel: () => void;
}

export function TemplateVariablesForm({
  template,
  onApply,
  onCancel,
}: TemplateVariablesFormProps) {
  const variables = extractTemplateVariables(template.prompt);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const handleApply = () => {
    const filledPrompt = replaceTemplateVariables(template.prompt, templateVariables);
    onApply(filledPrompt);
  };

  const allVariablesFilled = variables.every((varName) => templateVariables[varName]?.trim());

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-base mb-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {template.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            Remplissez les variables pour personnaliser le template
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        {variables.map((varName) => (
          <div key={varName}>
            <Label htmlFor={`var-${varName}`} className="text-xs font-medium">
              {varName}
            </Label>
            <Input
              id={`var-${varName}`}
              value={templateVariables[varName] || ""}
              onChange={(e) =>
                setTemplateVariables((prev) => ({
                  ...prev,
                  [varName]: e.target.value,
                }))
              }
              placeholder={`Entrez la valeur pour ${varName}`}
              className="mt-1 h-8 text-sm focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && allVariablesFilled) {
                  handleApply();
                }
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleApply}
          disabled={!allVariablesFilled}
          size="sm"
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Appliquer
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-2"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}

