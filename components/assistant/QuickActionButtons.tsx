"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Mail, 
  HelpCircle, 
  Lightbulb, 
  Brain, 
  FileText, 
  Calculator, 
  TrendingUp, 
  MessageSquare,
  FileSearch,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: "email",
    label: "Rédiger un email",
    prompt: "Aide-moi à rédiger un email professionnel",
    icon: Mail,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "renseignement",
    label: "Un renseignement",
    prompt: "J'ai besoin d'un renseignement",
    icon: HelpCircle,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "idee",
    label: "Une idée",
    prompt: "J'ai une idée, peux-tu m'aider à la développer ?",
    icon: Lightbulb,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "reflechir",
    label: "Réfléchir",
    prompt: "Aide-moi à réfléchir sur un sujet",
    icon: Brain,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "analyse",
    label: "Analyser un document",
    prompt: "Analyse ce document pour moi",
    icon: FileSearch,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "devis",
    label: "Créer un devis",
    prompt: "Aide-moi à créer un devis personnalisé",
    icon: Calculator,
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "commercial",
    label: "Conseil commercial",
    prompt: "J'ai besoin d'un conseil commercial",
    icon: TrendingUp,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "resume",
    label: "Résumer",
    prompt: "Résume-moi ce contenu",
    icon: FileText,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "comparaison",
    label: "Comparer",
    prompt: "Compare ces éléments pour moi",
    icon: MessageSquare,
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "sinistre",
    label: "Gestion sinistre",
    prompt: "Aide-moi avec un sinistre",
    icon: FileText,
    color: "from-red-500 to-orange-500",
  },
];

interface QuickActionButtonsProps {
  onSelect: (prompt: string) => void;
  onOpenFullAssistant?: () => void;
}

export function QuickActionButtons({ onSelect, onOpenFullAssistant }: QuickActionButtonsProps) {
  const router = useRouter();

  const handleOpenFullAssistant = () => {
    router.push("/commun/outils/assistant-ia");
    if (onOpenFullAssistant) {
      onOpenFullAssistant();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Que souhaitez-vous faire ?
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                onClick={() => onSelect(action.prompt)}
                className={cn(
                  "w-full h-auto py-3 px-3 flex flex-col items-center gap-2",
                  "bg-gradient-to-br hover:from-opacity-100",
                  "border-2 hover:border-primary/50",
                  "transition-all duration-200",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br",
                  action.color,
                  "text-white"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Bouton pour ouvrir l'outil IA complet */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: quickActions.length * 0.05 }}
        className="pt-2 border-t border-border/50"
      >
        <Button
          variant="default"
          onClick={handleOpenFullAssistant}
          className={cn(
            "w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500",
            "hover:from-purple-600 hover:via-pink-600 hover:to-blue-600",
            "text-white shadow-lg hover:shadow-xl",
            "transition-all duration-200"
          )}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          <span>Ouvrir l'outil IA complet</span>
          <ExternalLink className="h-3.5 w-3.5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}

