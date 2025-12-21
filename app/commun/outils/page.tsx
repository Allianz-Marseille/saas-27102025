"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ArrowRight, Bot } from "lucide-react";
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
};

const colorSchemes: ColorScheme[] = [
  {
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-l-4 border-blue-500",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
  },
  {
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-l-4 border-emerald-500",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]",
  },
  {
    gradient: "from-orange-500 via-amber-500 to-yellow-600",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",
    iconColor: "text-orange-600 dark:text-orange-400",
    border: "border-l-4 border-orange-500",
    hoverGlow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]",
  },
];

export default function OutilsPage() {
  const router = useRouter();

  const outils = [
    {
      id: "beneficiaires-effectifs",
      title: "Informations entreprise (Pappers)",
      description: "Consultez toutes les informations disponibles sur une entreprise (légales, dirigeants, bilans, établissements, bénéficiaires effectifs, etc.) via Pappers",
      icon: Users,
      href: "/commun/outils/beneficiaires-effectifs",
    },
    {
      id: "assistant-ia",
      title: "Assistant IA",
      description: "Assistant IA intelligent pour vous aider dans vos tâches quotidiennes.",
      icon: Bot,
      href: "/commun/outils/assistant-ia",
    },
  ] as const;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {outils.map((outil, index) => {
          const Icon = outil.icon;
          const colors = colorSchemes[index % colorSchemes.length];
          
          return (
            <motion.div
              key={outil.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Card
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all duration-300",
                  "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
                  "border-2 border-gray-200/50 dark:border-gray-700/50",
                  colors.border,
                  colors.hoverGlow,
                  "hover:shadow-2xl hover:scale-[1.02]",
                  "h-full min-h-[280px] flex flex-col"
                )}
                onClick={() => router.push(outil.href)}
              >
                {/* Gradient Background Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500",
                    colors.gradient
                  )}
                />

                {/* Animated Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%", opacity: 0 }}
                  whileHover={{ x: "100%", opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {/* Pulsing Glow Effect */}
                <motion.div
                  className={cn(
                    "absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500",
                    colors.gradient
                  )}
                  animate={{
                    opacity: [0, 0.1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon with Gradient Background */}
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "p-4 rounded-2xl shadow-lg",
                          colors.iconBg
                        )}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-foreground group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-foreground group-hover:to-foreground/70 transition-all">
                          {outil.title}
                        </CardTitle>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ x: 5, scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowRight className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        colors.iconColor
                      )} />
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 flex-1 flex flex-col">
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {outil.description}
                  </CardDescription>
                  
                  {/* Decorative Element */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <motion.div
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        colors.iconColor
                      )}
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      Accéder à l'outil →
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
