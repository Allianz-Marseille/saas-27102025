"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, Building2, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ColorScheme = {
  iconBg: string;
  iconColor: string;
  border: string;
  badge: string;
  glow: string;
};

const colorSchemes: ColorScheme[] = [
  {
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-l-4 border-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    glow: "shadow-blue-500/20",
  },
  {
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-l-4 border-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow: "shadow-emerald-500/20",
  },
  {
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
    iconColor: "text-purple-600 dark:text-purple-400",
    border: "border-l-4 border-purple-500",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    glow: "shadow-purple-500/20",
  },
];

type OutilItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Logo de l'outil (affiché à la place de l'icône si présent) */
  image?: string;
  href: string;
  features: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
  }[];
  badge?: string;
  ccnBadge?: boolean;
  tagline?: string;
  /** Affiche un badge "new" fluo clignotant */
  showNewBadge?: boolean;
};

export default function OutilsPage() {
  const router = useRouter();

  const outils: OutilItem[] = [
    {
      id: "beneficiaires-effectifs",
      title: "Informations entreprise (Pappers)",
      description: "Accédez instantanément à toutes les données légales et financières des entreprises françaises via l'API Pappers.",
      icon: Users,
      image: "/Pappers-logo-blue.png",
      href: "/commun/outils/beneficiaires-effectifs",
      badge: "API Pappers",
      features: [
        { icon: Building2, text: "Légal, dirigeants, bilans, établissements" },
        { icon: Users, text: "Bénéficiaires effectifs" },
        { icon: FileText, text: "Documents officiels et participations" },
      ],
    },
    {
      id: "societe-entreprise",
      title: "Informations entreprise (Societe.com)",
      description: "Fiche entreprise, CCN, scoring, contact et marques.",
      icon: Building2,
      image: "/Logo_Societe.png",
      href: "/commun/outils/societe-entreprise",
      badge: "API Societe.com",
      ccnBadge: true,
      showNewBadge: true,
      features: [
        { icon: TrendingUp, text: "Scoring financier et extra-financier" },
        { icon: Building2, text: "Contact, marques, établissements" },
        { icon: Users, text: "Recherche SIREN / nom / TVA" },
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
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          Outils
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {outils.map((outil, index) => {
          const Icon = outil.icon;
          const colors = colorSchemes[index % colorSchemes.length];
          
          return (
            <motion.div
              key={outil.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="h-full"
            >
              <Card
                className={cn(
                  "group relative overflow-hidden cursor-pointer transition-all duration-300",
                  "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
                  "border border-gray-200 dark:border-gray-800",
                  colors.border,
                  "hover:shadow-xl",
                  index === 0 ? "hover:shadow-blue-500/20" : "hover:shadow-emerald-500/20",
                  "hover:border-gray-300 dark:hover:border-gray-600",
                  "h-full flex flex-col"
                )}
                onClick={() => router.push(outil.href)}
              >
                {outil.showNewBadge && (
                  <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-400 text-slate-900 shadow-lg animate-blink-fluo">
                    new
                  </span>
                )}
                <CardHeader className="pb-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icon ou logo */}
                      <div className={cn(
                        "p-2 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center overflow-hidden min-w-[40px] min-h-[40px]",
                        outil.image ? "bg-white dark:bg-white/95" : colors.iconBg
                      )}>
                        {outil.image ? (
                          <Image
                            src={outil.image}
                            alt=""
                            width={40}
                            height={40}
                            className="h-8 w-auto object-contain"
                          />
                        ) : (
                          <Icon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 flex-wrap">
                            <CardTitle className="text-base font-semibold text-foreground leading-snug break-words">
                          {outil.title}
                        </CardTitle>
                        {outil.badge && (
                          <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 mt-0.5",
                            colors.badge
                          )}>
                            {outil.badge}
                          </span>
                        )}
                        {outil.ccnBadge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5 bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                            CCN
                          </span>
                        )}
                          </div>
                          <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                            {outil.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                      <ArrowRight className={cn(
                      "h-4 w-4 shrink-0 mt-0.5 transition-all duration-300",
                        colors.iconColor,
                      "group-hover:translate-x-1"
                      )} />
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col pt-0 pb-3">
                  {/* Bandeau CCN (Societe.com uniquement) */}
                  {outil.ccnBadge && (
                    <div className="mb-4 -mx-6 px-4 py-2 bg-violet-500/15 dark:bg-violet-500/15 border-y border-violet-500/20">
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 text-center">
                        Conventions collectives (CCN) — IDCC + Code du travail numérique
                      </p>
                    </div>
                  )}
                  {/* Features list simplifiée */}
                  <div className="space-y-2 mb-3 flex-1">
                    {outil.features.map((feature, featureIndex) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <div key={featureIndex} className="flex items-start gap-2.5">
                          <FeatureIcon className={cn("mt-0.5 shrink-0 h-4 w-4", colors.iconColor)} />
                          <p className="text-xs text-muted-foreground leading-relaxed break-words flex-1 min-w-0">
                            {feature.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* CTA Footer compact */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      colors.iconColor
                    )}>
                      <span>Découvrir</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
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
