"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, Clock, TrendingUp, Lightbulb, MessageSquare, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DecryptedText from "@/components/DecryptedText";
import { motion } from "framer-motion";
import Image from "next/image";
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

export default function StrategieRegularitePage() {
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-8">
          <DecryptedText
            text="Stratégie Process : L'art de la régularité"
            animateOn="view"
            revealDirection="center"
            speed={30}
            maxIterations={15}
            className="text-foreground"
            encryptedClassName="text-muted-foreground opacity-50"
          />
        </h1>
        <p className="text-muted-foreground text-lg">
          Un rappel essentiel pour votre succès et celui de l'agence
        </p>
      </div>

      <div className="space-y-6">
        {/* Personnes concernées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
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

        {/* Section Image principale - Les 4 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900"
        >
          <div className="relative w-full h-64 md:h-80">
            <Image
              src="/les-4.webp"
              alt="Les 4 - Objectif quotidien process"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Section 1 : La régularité */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-xl mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    La régularité est la clé
                  </h2>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
                    Il est essentiel de maintenir un <span className="font-bold">effort régulier</span> sur les process : 
                    <span className="font-bold text-blue-600 dark:text-blue-400"> M+3, Préterme Auto et Préterme IRD</span>.
                  </p>
                  <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 border border-blue-300/50 dark:border-blue-700/50">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-blue-900 dark:text-blue-100">
                        Objectif quotidien : 4 process par jour minimum
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2 : Acte stratégique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-xl mb-3 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Un acte stratégique pour l'agence
                  </h2>
                  <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed mb-4">
                    Les process ne sont pas qu'une simple tâche administrative. C'est <span className="font-bold">un levier stratégique</span> qui 
                    contribue directement au développement de l'agence et à votre réussite personnelle.
                  </p>
                  <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/30 border border-purple-300/50 dark:border-purple-700/50">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 italic">
                      💡 "Ce n'est pas un sprint, c'est un marathon."
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      La constance et la persévérance font la différence sur le long terme.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3 : Phrases magiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-xl mb-3 text-amber-900 dark:text-amber-100 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Les phrases magiques
                  </h2>
                  
                  {/* M+3 */}
                  <div className="mb-4 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-amber-300/50 dark:border-amber-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Pour M+3
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      <span className="font-semibold">« Vous êtes nouveau client et c'est moi qui gère votre dossier. 
                      Vous avez quelques minutes pour moi ? »</span>
                    </p>
                  </div>

                  {/* Préterme */}
                  <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-amber-300/50 dark:border-amber-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Pour Préterme Auto / IRD
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      <span className="font-semibold">« La date anniversaire de votre contrat auto / IRD c'est le mois prochain. 
                      Il n'a pas été revu depuis longtemps. Il faudrait faire un point. »</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Ensemble, construisons le succès de l'agence, un process à la fois ! 💪
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
