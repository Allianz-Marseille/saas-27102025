"use client";

import { Award, Star, Target, TrendingUp, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AchievementBadgesProps {
  kpi: {
    nbContrats: number;
    ratio: number;
    caMensuel: number;
  };
}

export function AchievementBadges({ kpi }: AchievementBadgesProps) {
  const badges = [
    {
      id: "first_act",
      icon: Star,
      title: "Premier pas",
      description: "Premier acte créé",
      unlocked: kpi.nbContrats >= 1,
      color: "blue",
      gradient: "from-blue-400 to-blue-600"
    },
    {
      id: "streak_10",
      icon: Zap,
      title: "Productif",
      description: "10 contrats ce mois",
      unlocked: kpi.nbContrats >= 10,
      color: "orange",
      gradient: "from-orange-400 to-orange-600"
    },
    {
      id: "top_performer",
      icon: Crown,
      title: "Top Performer",
      description: "20 contrats ce mois",
      unlocked: kpi.nbContrats >= 20,
      color: "yellow",
      gradient: "from-yellow-400 to-amber-600"
    },
    {
      id: "ratio_master",
      icon: Target,
      title: "Équilibre Parfait",
      description: "Ratio ≥ 100%",
      unlocked: kpi.ratio >= 100,
      color: "green",
      gradient: "from-green-400 to-emerald-600"
    },
    {
      id: "revenue_king",
      icon: TrendingUp,
      title: "CA Champion",
      description: "10k € de CA",
      unlocked: kpi.caMensuel >= 10000,
      color: "purple",
      gradient: "from-purple-400 to-purple-600"
    },
    {
      id: "legend",
      icon: Award,
      title: "Légende",
      description: "Tous les badges",
      unlocked: kpi.nbContrats >= 20 && kpi.ratio >= 100 && kpi.caMensuel >= 10000,
      color: "pink",
      gradient: "from-pink-400 to-rose-600"
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Vos récompenses
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {unlockedCount} / {badges.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            const isUnlocked = badge.unlocked;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div
                  className={cn(
                    "relative rounded-xl p-4 border-2 transition-all cursor-pointer",
                    isUnlocked
                      ? `bg-gradient-to-br ${badge.gradient} border-white/30 shadow-lg`
                      : "bg-muted/50 border-muted opacity-40 hover:opacity-60"
                  )}
                >
                  {/* Badge débloqu */}
                  {isUnlocked && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10"
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}

                  {/* Effet de brillance pour badges débloqués */}
                  {isUnlocked && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-xl"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  <div className="flex flex-col items-center text-center gap-2 relative z-10">
                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        isUnlocked ? "bg-white/20" : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          isUnlocked ? "text-white" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div>
                      <h4
                        className={cn(
                          "font-semibold text-xs",
                          isUnlocked ? "text-white" : "text-muted-foreground"
                        )}
                      >
                        {badge.title}
                      </h4>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          isUnlocked ? "text-white/80" : "text-muted-foreground"
                        )}
                      >
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tooltip au hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    {badge.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-black" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Message de progression */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg"
        >
          <p className="text-xs text-center text-muted-foreground">
            {unlockedCount === badges.length ? (
              <span className="text-green-600 dark:text-green-400 font-semibold">
                🏆 Vous avez débloqué tous les badges ! Félicitations !
              </span>
            ) : (
              <>
                Débloquez <strong className="text-foreground">{badges.length - unlockedCount}</strong> badges supplémentaires pour devenir une légende !
              </>
            )}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}

