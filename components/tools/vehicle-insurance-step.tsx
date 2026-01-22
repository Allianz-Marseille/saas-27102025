"use client";

import { motion } from "framer-motion";
import { Info, HelpCircle, LucideIcon } from "lucide-react";
import { TreeNode, TreeOption } from "@/lib/tools/vehicleInsuranceTree";
import { OptionCard } from "./vehicle-insurance-option-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as LucideIcons from "lucide-react";

interface VehicleInsuranceStepProps {
  node: TreeNode;
  onOptionClick: (option: TreeOption) => void;
  searchQuery?: string;
}

export function VehicleInsuranceStep({
  node,
  onOptionClick,
  searchQuery = "",
}: VehicleInsuranceStepProps) {
  // Déterminer quelle carte surligner selon la recherche
  const highlightedOptionIndex = searchQuery
    ? node.options.findIndex(opt =>
        opt.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : -1;

  const handleSelectChange = (value: string) => {
    const selectedOption = node.options.find((opt, idx) => idx.toString() === value);
    if (selectedOption) {
      onOptionClick(selectedOption);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 py-8 px-6"
    >
      {/* Question principale */}
      <div className="text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100"
        >
          {node.question}
        </motion.h2>

        {/* Description */}
        {node.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            {node.description}
          </motion.p>
        )}

        {/* Micro-aide */}
        {node.helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Info className="h-4 w-4" />
                  Pourquoi cette question ?
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{node.helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Select rapide (en complément des cartes) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md mx-auto"
      >
        <div className="space-y-2">
          <Label className="text-sm text-gray-600 dark:text-gray-400">
            Sélection rapide (ou cliquez sur les cartes ci-dessous)
          </Label>
          <Select onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisissez un type de véhicule..." />
            </SelectTrigger>
            <SelectContent>
              {node.options.map((option, index) => {
                const IconComponent = ((LucideIcons as any)[option.icon] || LucideIcons.HelpCircle) as LucideIcon;
                
                return (
                  <SelectItem 
                    key={index} 
                    value={index.toString()} 
                    className="cursor-pointer"
                    title={option.subLabel || option.label}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.subLabel && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Séparateur visuel */}
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
        <span className="text-sm text-gray-400 dark:text-gray-600">ou</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
      </div>

      {/* Grille de cartes */}
      <motion.div
        className="flex flex-wrap justify-center gap-4 max-w-6xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {node.options.map((option, index) => {
          // Récupérer l'icône dynamiquement
          const IconComponent = ((LucideIcons as any)[option.icon] || LucideIcons.HelpCircle) as LucideIcon;
          
          return (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] xl:w-[calc(25%-0.75rem)]"
            >
              <OptionCard
                label={option.label}
                subLabel={option.subLabel}
                icon={IconComponent}
                color={option.color}
                onClick={() => onOptionClick(option)}
                isHighlighted={index === highlightedOptionIndex}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
