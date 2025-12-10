"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, Users, FileText, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import { 
  isAdmin, 
  isCommercial, 
  isCommercialSanteIndividuel, 
  isCommercialSanteCollective,
  ROLES
} from "@/lib/utils/roles";

export type ProcessTag = "commercial" | "sante-individuel" | "sante-collective" | "vie-agence" | "sinistre";

interface Process {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  hoverColor: string;
  tags: ProcessTag[];
}

const processes: Process[] = [
  {
    id: "leads",
    title: "Gestion des leads",
    description: "Processus de coordination pour la gestion des leads : réception, traitement via Lagon, Trello et Slack, et procédure de prise en charge.",
    icon: Users,
    href: "/commun/process/leads",
    color: "from-blue-600 via-purple-600 to-blue-600",
    hoverColor: "hover:from-blue-700 hover:via-purple-700 hover:to-blue-700",
    tags: ["commercial"],
  },
  {
    id: "declaration-affaires",
    title: "Déclaration d'affaires",
    description: "Processus de déclaration d'affaires : clés de répartition par agence, règles de travail en équipe, obligations de déclaration et répartition santé.",
    icon: FileText,
    href: "/commun/process/declaration-affaires",
    color: "from-emerald-600 via-teal-600 to-emerald-600",
    hoverColor: "hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700",
    tags: ["commercial"],
  },
  {
    id: "strategie-regularite",
    title: "Stratégie Process : L'art de la régularité",
    description: "Un rappel essentiel pour votre succès et celui de l'agence. Objectif quotidien : 4 process par jour minimum (M+3, Préterme Auto, Préterme IRD).",
    icon: Target,
    href: "/commun/process/strategie-regularite",
    color: "from-purple-600 via-pink-600 to-purple-600",
    hoverColor: "hover:from-purple-700 hover:via-pink-700 hover:to-purple-700",
    tags: ["commercial"],
  },
];

const tagLabels: Record<ProcessTag, string> = {
  "commercial": "Commercial",
  "sante-individuel": "Santé Individuel",
  "sante-collective": "Santé Collective",
  "vie-agence": "Vie Agence",
  "sinistre": "Sinistre",
};

const tagColors: Record<ProcessTag, string> = {
  "commercial": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  "sante-individuel": "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  "sante-collective": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  "vie-agence": "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  "sinistre": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
};

function getUserProcessTags(userData: any): ProcessTag[] | null {
  if (!userData) return null;
  
  if (isAdmin(userData)) {
    return null; // Admin voit tous les processus
  }
  
  if (isCommercial(userData)) {
    return ["commercial"];
  }
  
  if (isCommercialSanteIndividuel(userData)) {
    return ["sante-individuel"];
  }
  
  if (isCommercialSanteCollective(userData)) {
    return ["sante-collective"];
  }
  
  // Gestionnaire sinistre
  if (userData.role === ROLES.GESTIONNAIRE_SINISTRE) {
    return ["sinistre"];
  }
  
  return [];
}

export default function ProcessPage() {
  const router = useRouter();
  const { userData } = useAuth();
  
  const userTags = getUserProcessTags(userData);
  
  // Filtrer les processus selon les tags de l'utilisateur
  // Si userTags est null (admin), on affiche tous les processus
  const filteredProcesses = userTags === null 
    ? processes 
    : processes.filter(process => 
        process.tags.some(tag => userTags.includes(tag))
      );

  return (
    <div className="w-full px-6 lg:px-12 xl:px-16">
      {/* Header */}
      <div className="text-center lg:text-left mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Processus
        </h1>
        <p className="text-muted-foreground mt-2">
          Consultez les processus et procédures de l'agence
        </p>
      </div>

      {/* Grille de cartes avec espacements égaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {filteredProcesses.map((process, index) => {
          const Icon = process.icon;
          return (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group relative overflow-hidden h-full flex flex-col",
                  "border-2 hover:border-blue-300 dark:hover:border-blue-700"
                )}
                onClick={() => router.push(process.href)}
              >
                {/* Gradient Background on Hover */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                    `from-blue-500 to-purple-500`
                  )}
                />

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn(
                      "p-3 rounded-lg bg-gradient-to-br shadow-lg",
                      `bg-gradient-to-br ${process.color}`
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {process.title}
                  </CardTitle>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {process.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn("text-xs", tagColors[tag])}
                      >
                        {tagLabels[tag]}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 flex-1 flex flex-col">
                  <CardDescription className="text-base leading-relaxed flex-1">
                    {process.description}
                  </CardDescription>
                  <div className="mt-6 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform">
                    Consulter le processus
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
