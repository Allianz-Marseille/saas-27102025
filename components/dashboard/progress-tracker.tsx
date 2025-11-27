"use client";

import { Trophy, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  kpi: {
    nbContrats: number;
  };
}

export function ProgressTracker({ kpi }: ProgressTrackerProps) {
  const totalObjectif = 20; // contrats par mois
  const progression = Math.min((kpi.nbContrats / totalObjectif) * 100, 100);
  const milestones = [5, 10, 15, 20];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                Votre progression ce mois
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {kpi.nbContrats} / {totalObjectif} contrats
              </p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-4xl font-bold text-amber-600"
            >
              {progression.toFixed(0)}%
            </motion.div>
          </div>

          {/* Barre de progression stylisée */}
          <div className="relative h-5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden mb-4 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progression}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 rounded-full shadow-lg"
            />
            {/* Effet de brillance animé */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut"
              }}
              style={{ width: '50%' }}
            />
          </div>

          {/* Badges de progression */}
          <div className="grid grid-cols-4 gap-2">
            {milestones.map((milestone, index) => {
              const isUnlocked = kpi.nbContrats >= milestone;
              const isNext = !isUnlocked && (index === 0 || kpi.nbContrats >= milestones[index - 1]);

              return (
                <motion.div
                  key={milestone}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "relative text-center p-3 rounded-lg transition-all border-2",
                    isUnlocked
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white scale-105 shadow-lg border-amber-400"
                      : isNext
                      ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 animate-pulse"
                      : "bg-white/50 dark:bg-black/20 text-muted-foreground border-transparent"
                  )}
                >
                  <div className="text-xs font-semibold mb-1">{milestone}</div>
                  {isUnlocked ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring" }}
                      className="text-2xl"
                    >
                      🎯
                    </motion.div>
                  ) : isNext ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-xl"
                    >
                      🎯
                    </motion.div>
                  ) : (
                    <div className="text-xl opacity-30">🎯</div>
                  )}

                  {/* Badge "Suivant" */}
                  {isNext && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                      Suivant
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Message de motivation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 text-center text-sm text-muted-foreground"
          >
            {progression >= 100 ? (
              <span className="text-green-600 dark:text-green-400 font-semibold">
                🎉 Objectif atteint ! Bravo !
              </span>
            ) : (
              <span>
                Plus que <strong className="text-foreground">{totalObjectif - kpi.nbContrats} contrats</strong> pour atteindre votre objectif !
              </span>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

