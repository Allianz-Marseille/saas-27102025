"use client";

/* eslint-disable react/no-unescaped-entities */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  RefreshCw,
  Bell,
  UserCheck,
  FolderOpen,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Extrait le prénom depuis l'email
 */
function extractFirstName(email: string): string {
  const emailParts = email.split("@")[0].split(".");
  const rawFirstName = emailParts[0] || "Commercial";
  return (
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  );
}

/**
 * Récupère tous les commerciaux actifs depuis Firestore
 * Uniquement les commerciaux CDC (exclut les commerciaux santé)
 */
async function getActiveCommercials(): Promise<string[]> {
  if (!db) return [];

  try {
    const usersRef = collection(db, "users");

    // Récupérer tous les utilisateurs actifs et filtrer côté client
    const q = query(usersRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);

    const firstNames = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        // Filtrer uniquement les commerciaux CDC (exclut COMMERCIAL_SANTE_INDIVIDUEL et COMMERCIAL_SANTE_COLLECTIVE)
        if (data.role === "CDC_COMMERCIAL") {
          return extractFirstName(data.email || "");
        }
        return null;
      })
      .filter((name): name is string => name !== null && name !== "Commercial")
      .sort();

    return firstNames;
  } catch (error) {
    console.error("Erreur lors de la récupération des commerciaux:", error);
    return [];
  }
}

const WORKFLOW_STEPS = [
  {
    number: 1,
    title: "Automatisation de la réception",
    icon: RefreshCw,
    description:
      'Les mails Allianz sont automatiquement transférés dans Trello, colonne "Entrée". Aucun lead n\'est perdu et il n\'est plus nécessaire de surveiller Lagon en continu.',
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    number: 2,
    title: "Notification instantanée de l'équipe",
    icon: Bell,
    description:
      "Slack informe immédiatement tout le monde de l'arrivée d'un lead. Résultat : plus de charge mentale, chacun sait en temps réel qu'un nouveau contact est disponible.",
    color: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    number: 3,
    title: "Attribution claire",
    icon: UserCheck,
    description:
      "Le collaborateur qui prend le lead déplace la carte dans sa propre colonne. Cela garantit une attribution visible, explicite et sans ambiguïté, empêchant les doublons ou les oublis.",
    color: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    number: 4,
    title: "Traitement structuré dans Lagon",
    icon: FolderOpen,
    description: "Actions à effectuer :",
    actions: [
      "création de la fiche client dans Lagon",
      "reprise du devis / analyse de la demande",
      "suppression du mail Allianz / GED",
      "application du plan d'appel 3 / 2 / 1",
    ],
    color: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
  {
    number: 5,
    title: "Deux règles incontournables",
    icon: AlertCircle,
    description: "Règles à respecter absolument :",
    rules: [
      "ne jamais appeler un prospect sans avoir créé la fiche Lagon",
      'ne jamais laisser une carte dans "Entrée" après prise en charge',
    ],
    color: "from-red-500 to-orange-500",
    bgGradient: "from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
];

const MEMO_STEPS = [
  "Je vois l'arrivée du lead sur Slack.",
  "Je prends la carte Trello dans ma colonne.",
  "Je crée la fiche Lagon avant tout contact.",
  "Je supprime le mail Allianz / GED.",
  "J'appelle selon le plan 3 / 2 / 1.",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export default function LeadsProcessPage() {
  const router = useRouter();
  const [commercialNames, setCommercialNames] = useState<string[]>([]);
  const [isLoadingCommercials, setIsLoadingCommercials] = useState(true);

  useEffect(() => {
    const loadCommercials = async () => {
      setIsLoadingCommercials(true);
      const names = await getActiveCommercials();
      setCommercialNames(names);
      setIsLoadingCommercials(false);
    };

    loadCommercials();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Leads Allianz – Workflow Optimisé de Prise en Charge
          </h1>
          <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
            Commercial
          </Badge>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Personnes concernées */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                Personnes concernées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCommercials ? (
                <div className="text-sm text-muted-foreground">
                  Chargement des commerciaux...
                </div>
              ) : commercialNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {commercialNames.map((name) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Aucun commercial actif trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enjeux */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Enjeux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Allianz nous donne la possibilité de recevoir des leads. Le
                choix d'en profiter ou non dépend directement de notre stratégie
                : c'est un investissement lorsqu'il est bien géré, mais un coût
                inutile lorsqu'il est mal exploité.
              </p>
              <p className="text-foreground leading-relaxed font-semibold">
                La compagnie met à disposition un mode d'arrivée des leads qui
                reste imparfait et contraignant :
              </p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">
                    nécessité de consulter régulièrement Lagon pour repérer les
                    alertes → forte charge mentale, risque d'oublier ;
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">
                    réception des mails dans la boîte commune → manque
                    d'attribution claire : qui s'en occupe ? est-ce déjà traité
                    ? risque de doublons, de délais trop longs ou de non-prise
                    en charge.
                  </span>
                </li>
              </ul>
              <p className="text-foreground leading-relaxed pt-2 border-t border-blue-200 dark:border-blue-800">
                <strong>Conséquence :</strong> un investissement potentiellement
                rentable devient insatisfaisant et mal utilisé, avec perte
                d'efficacité commerciale et risque de mauvaise expérience client.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notre réponse - Timeline */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                Notre réponse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline verticale */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-200 via-green-300 to-green-200 dark:from-green-800 dark:via-green-700 dark:to-green-800 hidden md:block" />

                <div className="space-y-8">
                  {WORKFLOW_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === WORKFLOW_STEPS.length - 1;

                    return (
                      <motion.div
                        key={step.number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="relative"
                      >
                        {/* Point de la timeline */}
                        <div className="flex items-start gap-4 md:gap-6">
                          <div className="relative z-10 flex-shrink-0">
                            <div
                              className={cn(
                                "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900",
                                `bg-gradient-to-br ${step.color}`
                              )}
                            >
                              <Icon className="h-7 w-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-green-600 dark:border-green-400 flex items-center justify-center">
                              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                {step.number}
                              </span>
                            </div>
                          </div>

                          <Card
                            className={cn(
                              "flex-1 border-2",
                              step.bgGradient,
                              step.borderColor
                            )}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg font-semibold">
                                {step.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-foreground leading-relaxed">
                                {step.description}
                              </p>
                              {step.actions && (
                                <ul className="list-none space-y-2 mt-3">
                                  {step.actions.map((action, actionIndex) => (
                                    <li
                                      key={actionIndex}
                                      className="flex items-start gap-3"
                                    >
                                      <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
                                      <span className="text-foreground leading-relaxed text-sm">
                                        {action}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {step.rules && (
                                <ul className="list-none space-y-2 mt-3">
                                  {step.rules.map((rule, ruleIndex) => (
                                    <li
                                      key={ruleIndex}
                                      className="flex items-start gap-3"
                                    >
                                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-1 shrink-0" />
                                      <span className="text-foreground leading-relaxed text-sm font-medium">
                                        {rule}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Flèche de connexion (sauf pour le dernier) */}
                        {!isLast && (
                          <div className="hidden md:block absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b from-green-300 to-green-200 dark:from-green-700 dark:to-green-800" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mémo / Pour la route */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-950/20 dark:to-green-950/20 border-teal-200 dark:border-teal-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Mémo / Pour la route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-none space-y-3">
                {MEMO_STEPS.map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {index + 1}
                    </div>
                    <span className="text-foreground leading-relaxed pt-1.5">
                      {step}
                    </span>
                  </motion.li>
                ))}
              </ol>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="mt-6 pt-4 border-t border-teal-200 dark:border-teal-800"
              >
                <p className="text-foreground font-semibold text-center italic">
                  En bref : rapide, clair, sans doublon.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
