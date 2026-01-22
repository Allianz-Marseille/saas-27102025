"use client";

import { Shield, Heart, Stethoscope, PiggyBank, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Act } from "@/types";

interface SpecialtyContractsTrackerProps {
  acts: Act[];
}

export function SpecialtyContractsTracker({ acts }: SpecialtyContractsTrackerProps) {
  // Compter les contrats par type (uniquement les AN)
  const anActs = acts.filter(act => act.kind === "AN");
  
  const countByType = {
    PJ: anActs.filter(act => act.contratType === "PJ").length,
    GAV: anActs.filter(act => act.contratType === "GAV").length,
    SANTE_PREV: anActs.filter(act => act.contratType === "SANTE_PREV").length,
    VIE_PP: anActs.filter(act => act.contratType === "VIE_PP").length,
  };

  const specialtyContracts = [
    {
      id: "pj_specialist",
      type: "PJ",
      icon: Shield,
      title: "Protecteur Juridique",
      description: "5 contrats PJ",
      count: countByType.PJ,
      target: 5,
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-50",
      bgDark: "dark:bg-blue-950/20",
      commission: "30€/contrat"
    },
    {
      id: "gav_specialist",
      type: "GAV",
      icon: Heart,
      title: "Expert GAV",
      description: "5 contrats GAV",
      count: countByType.GAV,
      target: 5,
      color: "rose",
      gradient: "from-rose-500 to-pink-500",
      bgLight: "bg-rose-50",
      bgDark: "dark:bg-rose-950/20",
      commission: "40€/contrat"
    },
    {
      id: "sante_specialist",
      type: "SANTE_PREV",
      icon: Stethoscope,
      title: "Champion Santé",
      description: "5 contrats Santé/Prévoyance",
      count: countByType.SANTE_PREV,
      target: 5,
      color: "green",
      gradient: "from-green-500 to-emerald-500",
      bgLight: "bg-green-50",
      bgDark: "dark:bg-green-950/20",
      commission: "50€/contrat"
    },
    {
      id: "epargne_specialist",
      type: "VIE_PP",
      icon: PiggyBank,
      title: "Pro de l'Épargne",
      description: "5 contrats Vie PP",
      count: countByType.VIE_PP,
      target: 5,
      color: "amber",
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      bgDark: "dark:bg-amber-950/20",
      commission: "50€/contrat"
    },
  ];

  const unlockedCount = specialtyContracts.filter(sc => sc.count >= sc.target).length;
  const totalProgress = specialtyContracts.reduce((sum, sc) => sum + Math.min((sc.count / sc.target) * 100, 100), 0) / specialtyContracts.length;

  return (
    <Card className="mb-6 overflow-hidden relative">
      {/* Background décoratif */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50 dark:from-purple-950/10 dark:via-transparent dark:to-blue-950/10 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Shield className="h-5 w-5 text-white" />
              </div>
              Contrats d'Excellence
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Débloquez des badges en réalisant 5 contrats de chaque type premium
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Badges débloqués</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {unlockedCount} / {specialtyContracts.length}
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progression globale</span>
            <span>{totalProgress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialtyContracts.map((contract, index) => {
            const Icon = contract.icon;
            const progress = Math.min((contract.count / contract.target) * 100, 100);
            const isUnlocked = contract.count >= contract.target;

            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div
                  className={cn(
                    "relative rounded-xl border-2 p-5 transition-all",
                    isUnlocked
                      ? `bg-gradient-to-br ${contract.gradient} border-white/50 shadow-lg`
                      : `${contract.bgLight} ${contract.bgDark} border-muted hover:border-muted-foreground/30`
                  )}
                >
                  {/* Badge débloqu é en haut à droite */}
                  {isUnlocked ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 shadow-xl z-10"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </motion.div>
                  ) : (
                    <div className="absolute -top-2 -right-2 bg-muted rounded-full p-2 opacity-30">
                      <Lock className="h-4 w-4" />
                    </div>
                  )}

                  {/* Effet de brillance pour contrats débloqués */}
                  {isUnlocked && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-xl"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  <div className="relative z-10">
                    {/* En-tête */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl transition-transform group-hover:scale-110",
                          isUnlocked
                            ? "bg-white/20 shadow-lg"
                            : "bg-background"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-7 w-7",
                            isUnlocked ? "text-white" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={cn(
                            "font-bold text-lg leading-tight",
                            isUnlocked ? "text-white" : "text-foreground"
                          )}
                        >
                          {contract.title}
                        </h4>
                        <p
                          className={cn(
                            "text-sm mt-0.5",
                            isUnlocked ? "text-white/90" : "text-muted-foreground"
                          )}
                        >
                          {contract.description}
                        </p>
                      </div>
                    </div>

                    {/* Compteur et progression */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-3xl font-bold",
                            isUnlocked ? "text-white" : "text-foreground"
                          )}
                        >
                          {contract.count}
                          <span
                            className={cn(
                              "text-lg font-normal ml-1",
                              isUnlocked ? "text-white/70" : "text-muted-foreground"
                            )}
                          >
                            / {contract.target}
                          </span>
                        </span>
                        <div
                          className={cn(
                            "text-xs font-medium px-3 py-1 rounded-full",
                            isUnlocked
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {contract.commission}
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div>
                        <div
                          className={cn(
                            "h-3 rounded-full overflow-hidden",
                            isUnlocked ? "bg-white/20" : "bg-muted"
                          )}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                            className={cn(
                              "h-full rounded-full",
                              isUnlocked
                                ? "bg-white shadow-lg"
                                : `bg-gradient-to-r ${contract.gradient}`
                            )}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isUnlocked ? "text-white/80" : "text-muted-foreground"
                            )}
                          >
                            {progress.toFixed(0)}%
                          </span>
                          {!isUnlocked && contract.count > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Plus que {contract.target - contract.count}
                            </span>
                          )}
                          {isUnlocked && (
                            <span className="text-xs text-white/80 font-semibold">
                              ✓ Débloqué !
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Message de motivation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/30"
        >
          {unlockedCount === specialtyContracts.length ? (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  🎉 Félicitations ! Vous êtes Expert Multi-Produits !
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vous maîtrisez l'ensemble des contrats d'excellence. Continue comme ça !
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                💡 <strong className="text-foreground">Astuce :</strong> Diversifiez votre portefeuille pour débloquer tous les badges et maximiser vos commissions !
              </p>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}

