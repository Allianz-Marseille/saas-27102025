"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Edit } from "lucide-react";

interface OCRConfirmMenuProps {
  extractedData: any;
  onConfirm: () => void;
  onCorrect: () => void;
  disabled?: boolean;
}

export function OCRConfirmMenu({ extractedData, onConfirm, onCorrect, disabled = false }: OCRConfirmMenuProps) {
  if (!extractedData) {
    return null;
  }

  // Formater les données extraites pour l'affichage
  const formatData = (data: any) => {
    const fields: { label: string; value: any }[] = [];
    
    if (data.typeClient) {
      fields.push({ label: "Type", value: data.typeClient });
    }
    if (data.nom || data.prenom) {
      fields.push({ label: "Nom", value: `${data.prenom || ""} ${data.nom || ""}`.trim() });
    }
    if (data.raisonSociale) {
      fields.push({ label: "Raison sociale", value: data.raisonSociale });
    }
    if (data.email) {
      fields.push({ label: "Email", value: data.email });
    }
    if (data.telephone || data.mobile) {
      fields.push({ label: "Téléphone", value: data.telephone || data.mobile });
    }
    if (data.adresse || data.ville) {
      const address = [data.adresse, data.codePostal, data.ville].filter(Boolean).join(" ");
      if (address) {
        fields.push({ label: "Adresse", value: address });
      }
    }
    if (data.siret || data.siren) {
      fields.push({ label: "SIRET/SIREN", value: data.siret || data.siren });
    }
    
    return fields;
  };

  const formattedFields = formatData(extractedData);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          📋 Données extraites de la fiche Lagon
        </div>
        <div className="space-y-2">
          {formattedFields.length > 0 ? (
            formattedFields.map((field, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{field.label} :</span>{" "}
                <span className="text-gray-900 dark:text-gray-100">{field.value || "Non renseigné"}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Aucune donnée extraite
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <Button
            onClick={() => !disabled && onConfirm()}
            disabled={disabled}
            className={cn(
              "w-full gap-2 h-auto py-3 px-4",
              "bg-green-500 hover:bg-green-600 text-white",
              "rounded-2xl",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Check className="h-4 w-4" />
            Confirmer
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex-1"
        >
          <Button
            variant="outline"
            onClick={() => !disabled && onCorrect()}
            disabled={disabled}
            className={cn(
              "w-full gap-2 h-auto py-3 px-4",
              "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30",
              "rounded-2xl",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Edit className="h-4 w-4" />
            Corriger
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

