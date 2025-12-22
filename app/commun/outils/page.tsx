"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ArrowRight, Bot, Building2, FileText, TrendingUp, Sparkles, MessageSquare, FileSearch, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ColorScheme = {
  gradient: string;
  iconBg: string;
  iconColor: string;
  border: string;
  hoverGlow: string;
  badge: string;
};

const colorSchemes: ColorScheme[] = [
  {
    gradient: "from-blue-600 via-indigo-600 to-violet-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-l-4 border-blue-500",
    hoverGlow: "hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)]",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-l-4 border-emerald-500",
    hoverGlow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)]",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
];

type OutilItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  features: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }[];
  badge?: string;
};

export default function OutilsPage() {
  const router = useRouter();

  const outils: OutilItem[] = [
    {
      id: "beneficiaires-effectifs",
      title: "Informations entreprise (Pappers)",
      description: "Accédez instantanément à toutes les données légales et financières des entreprises françaises via l'API Pappers.",
      icon: Users,
      href: "/commun/outils/beneficiaires-effectifs",
      badge: "API Pappers",
      features: [
        { icon: Building2, text: "Informations légales complètes (SIREN, forme juridique, capital)" },
        { icon: Users, text: "Bénéficiaires effectifs et dirigeants" },
        { icon: FileText, text: "Bilans comptables et documents officiels" },
        { icon: TrendingUp, text: "Établissements, filiales et participations" },
      ],
    },
    {
      id: "assistant-ia",
      title: "Assistant IA",
      description: "Votre assistant intelligent multimodal alimenté par l'IA pour automatiser et optimiser vos tâches quotidiennes.",
      icon: Bot,
      href: "/commun/outils/assistant-ia",
      badge: "IA Avancée",
      features: [
        { icon: MessageSquare, text: "Conversations intelligentes et contextuelles" },
        { icon: FileSearch, text: "Analyse de documents et OCR automatique" },
        { icon: Sparkles, text: "Génération de contenu et templates" },
        { icon: Zap, text: "Recherche web et informations en temps réel" },
      ],
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          Outils
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {outils.map((outil, index) => {
          const Icon = outil.icon;
          const colors = colorSchemes[index % colorSchemes.length];
          
          return (
            <motion.div
              key={outil.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.15 }}
              whileHover={{ y: -6 }}
              className="h-full"
            >
              <Card
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all duration-500",
                  "bg-gradient-to-br from-white via-white to-gray-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/30",
                  "border border-gray-200/60 dark:border-gray-700/60",
                  colors.border,
                  colors.hoverGlow,
                  "hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-[1.01]",
                  "hover:border-gray-300 dark:hover:border-gray-600",
                  "h-full min-h-[420px] flex flex-col"
                )}
                onClick={() => router.push(outil.href)}
              >
                {/* Gradient Background Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700",
                    colors.gradient
                  )}
                />

                {/* Animated Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  initial={{ x: "-200%", opacity: 0 }}
                  whileHover={{ x: "200%", opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />

                <CardHeader className="relative z-10 pb-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon with Gradient Background */}
                      <motion.div
                        whileHover={{ rotate: [0, -8, 8, -8, 0], scale: 1.08 }}
                        transition={{ duration: 0.6 }}
                        className={cn(
                          "p-3.5 rounded-xl shadow-md",
                          colors.iconBg,
                          "group-hover:shadow-xl transition-shadow duration-300"
                        )}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <CardTitle className="text-xl font-bold text-foreground leading-tight">
                          {outil.title}
                        </CardTitle>
                        {outil.badge && (
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            colors.badge
                          )}>
                            {outil.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ x: 4, scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <ArrowRight className={cn(
                        "h-5 w-5 shrink-0 transition-all duration-300",
                        colors.iconColor,
                        "group-hover:drop-shadow-md"
                      )} />
                    </motion.div>
                  </div>

                  <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                    {outil.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 flex-1 flex flex-col pt-0">
                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {outil.features.map((feature, featureIndex) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <motion.div
                          key={featureIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + featureIndex * 0.1 }}
                          className="flex items-start gap-3 group/feature"
                        >
                          <div className={cn(
                            "mt-0.5 p-1.5 rounded-lg transition-colors duration-300",
                            colors.badge,
                            "group-hover/feature:scale-110"
                          )}>
                            <FeatureIcon className="h-4 w-4" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-snug flex-1">
                            {feature.text}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* CTA Footer */}
                  <div className="mt-auto pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 text-sm font-semibold tracking-wide",
                        colors.iconColor,
                        "group-hover:translate-x-1 transition-transform duration-300"
                      )}
                    >
                      <span>Découvrir l'outil</span>
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
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
