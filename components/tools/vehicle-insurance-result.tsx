"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Clipboard,
  Lightbulb,
  ExternalLink,
  MessageSquare,
  Mail,
  FileText,
  RefreshCw,
  AlertTriangle,
  Info,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InsuranceResult } from "@/lib/tools/vehicleInsuranceTree";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VehicleInsuranceResultProps {
  result: InsuranceResult;
  onReset: () => void;
  isClientMode: boolean;
}

export function VehicleInsuranceResult({
  result,
  onReset,
  isClientMode,
}: VehicleInsuranceResultProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const isObligatory = result.verdict === "obligatoire";

  const handleCopy = async (type: "sms" | "mail" | "crm", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(`Texte ${type.toUpperCase()} copié dans le presse-papier !`);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  const sourcesToShow = isClientMode ? result.sources.slice(0, 3) : result.sources;
  const hasMoreSources = result.sources.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 py-8 px-6 max-w-5xl mx-auto"
    >
      {/* Verdict Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          className={cn(
            "border-none shadow-2xl text-white overflow-hidden relative",
            isObligatory
              ? "bg-gradient-to-br from-red-500 to-orange-600"
              : "bg-gradient-to-br from-green-500 to-emerald-600"
          )}
        >
          <CardContent className="p-8 text-center relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              {isObligatory ? "⚠️" : "✅"}
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              ASSURANCE {isObligatory ? "OBLIGATOIRE" : "NON OBLIGATOIRE"}
            </h2>
            <p className="text-xl mb-3 opacity-90">{result.title}</p>
            <Badge className="bg-white/20 text-white text-sm px-4 py-1 backdrop-blur-sm">
              {result.tag}
            </Badge>
          </CardContent>
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </Card>
      </motion.div>

      {/* Actions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clipboard className="h-5 w-5 text-blue-600" />
              Ce que tu dois mettre en place
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.whatToDo.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pourquoi Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Pourquoi ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {result.why}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preuve d'assurance Card */}
      {result.proofInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-blue-600" />
                Preuve d'assurance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {result.proofInfo}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mode Conseiller - Infos supplémentaires */}
      {!isClientMode && result.adviserMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                Mode Conseiller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.adviserMode.definitions && (
                <div>
                  <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-2">
                    Définitions
                  </p>
                  <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                    {result.adviserMode.definitions.map((def, i) => (
                      <li key={i}>• {def}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.adviserMode.questionsToAsk && (
                <div>
                  <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-2">
                    Questions à poser au client
                  </p>
                  <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                    {result.adviserMode.questionsToAsk.map((q, i) => (
                      <li key={i}>• {q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.adviserMode.vigilancePoints && (
                <div>
                  <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-2">
                    Points de vigilance
                  </p>
                  <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                    {result.adviserMode.vigilancePoints.map((point, i) => (
                      <li key={i}>⚠️ {point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.adviserMode.risks && (
                <div>
                  <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-2">
                    Risques si non conforme
                  </p>
                  <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                    {result.adviserMode.risks.map((risk, i) => (
                      <li key={i}>❌ {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sources + Actions en 2 colonnes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sources Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ExternalLink className="h-5 w-5 text-gray-600" />
                Sources officielles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sourcesToShow.map((source, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => window.open(source.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  {source.label}
                </Button>
              ))}
              {isClientMode && hasMoreSources && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  + {result.sources.length - 3} source(s) en mode Conseiller
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions rapides Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clipboard className="h-5 w-5 text-gray-600" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleCopy("sms", result.copyTemplates.sms)}
                className="gap-2"
                variant={copiedType === "sms" ? "default" : "outline"}
              >
                {copiedType === "sms" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Copier SMS
              </Button>
              <Button
                onClick={() => handleCopy("mail", result.copyTemplates.mail)}
                className="gap-2"
                variant={copiedType === "mail" ? "default" : "outline"}
              >
                {copiedType === "mail" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Copier Mail
              </Button>
              <Button
                onClick={() => handleCopy("crm", result.copyTemplates.crm)}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                variant={copiedType === "crm" ? "default" : "secondary"}
              >
                {copiedType === "crm" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Note CRM
              </Button>
              <Button onClick={onReset} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recommencer
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Phrase de prudence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900 dark:text-orange-100">
                <p className="font-semibold mb-1">Réponse indicative</p>
                <p>
                  Cette réponse est indicative selon les informations déclarées. 
                  En cas de doute (débridage, vitesse réelle, usage professionnel), 
                  une vérification complémentaire est recommandée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
