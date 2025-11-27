"use client";

import { useState, useEffect } from "react";
import { Coins, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { getAllCommercialsKPI } from "@/lib/firebase/acts";
import { format } from "date-fns";

interface LeaderboardWidgetProps {
  currentUserEmail?: string;
  kpi?: {
    caMensuel: number;
    commissionsPotentielles: number;
  };
}

export function LeaderboardWidget({ currentUserEmail, kpi }: LeaderboardWidgetProps) {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const currentMonth = format(new Date(), "yyyy-MM");
        const commercialsKPI = await getAllCommercialsKPI(currentMonth);
        
        // Trier par commissions décroissantes et attribuer les rangs
        const sorted = commercialsKPI
          .sort((a, b) => b.commissions - a.commissions)
          .map((user, index) => ({
            name: user.firstName,
            commissions: user.commissions,
            avatar: user.firstName[0].toUpperCase(),
            isCurrentUser: user.email === currentUserEmail,
            rank: index + 1,
            trend: 0 // Peut être calculé en comparant avec le mois précédent
          }));
        
        setLeaderboardData(sorted);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [currentUserEmail]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const currentUser = leaderboardData.find(u => u.isCurrentUser);
  const gapToFirst = currentUser && leaderboardData[0] ? 
    leaderboardData[0].commissions - currentUser.commissions : 0;
  
  const targetCommissions = 800;
  const isTargetMet = currentUser ? currentUser.commissions >= targetCommissions : false;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Classement CA</CardTitle>
              <CardDescription>Top des commissions du mois</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Votre position */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg">
                  {currentUser.avatar}
                </Avatar>
                <div>
                  <p className="font-bold text-foreground">Votre position</p>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.rank === 1 ? "🏆 1ère place" : `${currentUser.rank}${currentUser.rank === 2 ? "ème" : "ème"} place`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{formatCurrency(currentUser.commissions)}</p>
                {currentUser.rank > 1 && (
                  <p className="text-xs text-muted-foreground">
                    -{formatCurrency(gapToFirst)} vs 1er
                  </p>
                )}
              </div>
            </div>

            {/* Objectif */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Objectif: {formatCurrency(targetCommissions)}
                </span>
                <span className={cn(
                  "font-semibold",
                  isTargetMet ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                )}>
                  {isTargetMet ? "✓ Atteint" : `Reste ${formatCurrency(targetCommissions - currentUser.commissions)}`}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">🏆 Top 3 du mois</h4>
          {leaderboardData.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg transition-all hover:shadow-md",
                user.isCurrentUser
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Médaille pour le top 3 */}
                  <div className="w-10 flex items-center justify-center">
                    {user.rank === 1 && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/50 border-2 border-yellow-300"
                      >
                        <span className="text-xl font-black text-white drop-shadow-md">1</span>
                      </motion.div>
                    )}
                    {user.rank === 2 && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/50 border-2 border-slate-200">
                        <span className="text-lg font-black text-white drop-shadow-md">2</span>
                      </div>
                    )}
                    {user.rank === 3 && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/50 border-2 border-orange-300">
                        <span className="text-lg font-black text-white drop-shadow-md">3</span>
                      </div>
                    )}
                    {user.rank > 3 && (
                      <span className="text-sm font-bold text-muted-foreground">#{user.rank}</span>
                    )}
                  </div>
                  
                  <Avatar className={cn(
                    "h-10 w-10 font-semibold flex items-center justify-center",
                    user.isCurrentUser 
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                      : "bg-gradient-to-br from-slate-400 to-slate-600 text-white"
                  )}>
                    {user.avatar}
                  </Avatar>
                  
                  <div>
                    <p className={cn(
                      "font-semibold",
                      user.isCurrentUser && "text-blue-700 dark:text-blue-300"
                    )}>
                      {user.isCurrentUser ? "Vous" : user.name}
                    </p>
                    {user.trend !== 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        {user.trend > 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">+{user.trend}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-600" />
                            <span className="text-red-600">{user.trend}%</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(user.commissions)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboardData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
