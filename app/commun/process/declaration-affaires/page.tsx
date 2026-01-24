"use client";

/* eslint-disable react/no-unescaped-entities */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Target,
  Lightbulb,
  FileText,
  Key,
  AlertCircle,
  Shield,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPortfolioH91358, getPortfolioH92083 } from "@/lib/config/team-members";
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
 */
async function getActiveCommercials(): Promise<string[]> {
  if (!db) return [];

  try {
    const usersRef = collection(db, "users");
    const commercialRoles = [
      "CDC_COMMERCIAL",
      "COMMERCIAL_SANTE_INDIVIDUEL",
      "COMMERCIAL_SANTE_COLLECTIVE",
    ];

    // Récupérer tous les utilisateurs actifs et filtrer côté client
    const q = query(usersRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);

    const firstNames = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        // Filtrer uniquement les rôles commerciaux
        if (commercialRoles.includes(data.role)) {
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

const PORTFOLIO_H91358 = getPortfolioH91358();
const PORTFOLIO_H92083 = getPortfolioH92083();

const REPARTITION_OBJECTIVES = [
  "savoir à qui appartient le client",
  "éviter les doublons et oublis",
  "répartir équitablement aussi la gestion induite",
  "rester lisibles collectivement",
];

const IMPORTANT_RULES = [
  "Pour une société, la clé s'applique sur le nom du gérant.",
  "En cas de transfert entre agences, arbitrage obligatoire : Jean-Michel / Julien.",
  "La règle s'applique en permanence, sauf exceptions familiales déclarées.",
];

const COLLECTIVE_IMPLICATIONS = [
  "de la communication",
  "de l'entraide",
  "la capacité à prendre le relais en cas d'absence",
  "tout en respectant la clé pour garantir la cohérence globale",
];

const MEMO_POINTS = [
  "Simple : A → Z, chacun sa zone.",
  "Clair : je sais qui est mon client et celui des autres.",
  "Juste : répartition équilibrée + volumes ajustables.",
  "Réel : une affaire nouvelle = du travail derrière.",
  "Collectif : priorité absolue au service client.",
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

export default function DeclarationAffairesProcessPage() {
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
            Production : saisie des affaires nouvelles
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
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Enjeux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Travailler à deux, à trois ou à dix, ce n'est pas la même chose :
                qui fait le devis, qui fait le contrat, qui déclare l'affaire dans sa production, qui assume ensuite la gestion associée ?
              </p>
              <p className="text-foreground leading-relaxed font-semibold">
                Sans cadre clair, ce qui devrait être simple devient rapidement compliqué :
              </p>
              <ul className="list-none space-y-2">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">doublons,</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">mauvaise attribution de la production,</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">manque d'équité entre collaborateurs,</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">confusion selon l'individuel, le collectif ou des cas particuliers,</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 shrink-0" />
                  <span className="text-foreground leading-relaxed">pertes d'information lors des absences ou des transferts.</span>
                </li>
              </ul>
              <p className="text-foreground leading-relaxed pt-2 border-t border-blue-200 dark:border-blue-800">
                Pour éviter ces situations, il est indispensable d'établir des règles communes.
                L'objectif : que chacun sache qui est son client, celui d'un collègue, et quelle gestion découle d'une nouvelle affaire.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notre réponse */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                Notre réponse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* 1. Pourquoi une clé de répartition ? */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    1
                  </div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Pourquoi une clé de répartition ?
                  </h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-foreground leading-relaxed">
                    L'agence connaît un fort développement.
                    Pour éviter que plusieurs collaborateurs gèrent le même client… ou que personne ne le prenne, nous appliquons une <strong>clé de répartition simple</strong> basée sur l'initiale du client.
                  </p>
                  <p className="text-foreground leading-relaxed font-semibold">
                    Objectif :
                  </p>
                  <ul className="list-none space-y-2">
                    {REPARTITION_OBJECTIVES.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-1 shrink-0" />
                        <span className="text-foreground leading-relaxed text-sm">
                          {objective}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-foreground leading-relaxed text-sm italic pt-2 border-t border-green-200 dark:border-green-800">
                    Sauf cas personnels particuliers (père, sœur, ami proche…), l'initiale détermine la responsabilité.
                  </p>
                </div>
              </motion.div>

              {/* 2. Clés de répartition officielles */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    2
                  </div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Clés de répartition officielles
                  </h3>
                </div>
                <div className="ml-11 space-y-6">
                  {/* Portefeuille H91358 */}
                  <Card className="border-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Portefeuille H91358
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-none space-y-2">
                        {PORTFOLIO_H91358.map((person, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                            <span className="text-foreground leading-relaxed">
                              <strong>{person.name}</strong> : {person.range}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Portefeuille H92083 */}
                  <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Portefeuille H92083
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-none space-y-2">
                        {PORTFOLIO_H92083.map((person, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
                            <span className="text-foreground leading-relaxed">
                              <strong>{person.name}</strong> : {person.range}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* 3. Règles importantes */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    3
                  </div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    Règles importantes
                  </h3>
                </div>
                <div className="ml-11">
                  <ul className="list-none space-y-2">
                    {IMPORTANT_RULES.map((rule, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-1 shrink-0" />
                        <span className="text-foreground leading-relaxed text-sm font-medium">
                          {rule}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* 4. Une agence = un résultat collectif */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    4
                  </div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Une agence = un résultat collectif
                  </h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-foreground leading-relaxed">
                    La clé organise l'équipe, mais le principe supérieur reste :
                  </p>
                  <p className="text-foreground leading-relaxed font-semibold text-lg border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                    → le client doit être servi correctement, rapidement, et sans friction.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    Cela implique :
                  </p>
                  <ul className="list-none space-y-2">
                    {COLLECTIVE_IMPLICATIONS.map((implication, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                        <span className="text-foreground leading-relaxed text-sm">
                          {implication}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* 5. Volume, ajustements et alternance */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    5
                  </div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Volume, ajustements et alternance
                  </h3>
                </div>
                <div className="ml-11 space-y-3">
                  <p className="text-foreground leading-relaxed">
                    Emma est en alternance :
                    → sa zone alphabétique est réduite pour rester cohérente avec son volume de travail.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    Les clés ne sont pas figées à vie :
                  </p>
                  <ul className="list-none space-y-2">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 mt-2 shrink-0" />
                      <span className="text-foreground leading-relaxed text-sm">
                        certains segments peuvent devenir trop lourds ou trop légers,
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 mt-2 shrink-0" />
                      <span className="text-foreground leading-relaxed text-sm">
                        des ajustements peuvent être nécessaires.
                      </span>
                    </li>
                  </ul>
                  <p className="text-foreground leading-relaxed font-semibold pt-2 border-t border-teal-200 dark:border-teal-800">
                    → Un point annuel est obligatoire pour rééquilibrer les volumes si besoin.
                  </p>
                </div>
              </motion.div>
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
              <ul className="list-none space-y-3">
                {MEMO_POINTS.map((point, index) => (
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
                      {point}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
