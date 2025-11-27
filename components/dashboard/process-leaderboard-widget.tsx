"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KPI } from "@/types";
import { getAllCommercialsKPI } from "@/lib/firebase/acts";
import { format } from "date-fns";

interface ProcessLeaderboardWidgetProps {
  currentUserEmail?: string;
  kpi?: KPI;
}

export function ProcessLeaderboardWidget({ currentUserEmail, kpi }: ProcessLeaderboardWidgetProps) {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserProcess = kpi?.nbProcess || 0;
  
  // Calcul de la moyenne par jour (basé sur le nombre de jours ouvrés écoulés dans le mois)
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Compter les jours ouvrés (lundi à vendredi) écoulés
  let workingDays = 0;
  for (let day = 1; day <= currentDay; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = dimanche, 6 = samedi
      workingDays++;
    }
  }
  
  const avgPerDay = workingDays > 0 ? (currentUserProcess / workingDays).toFixed(1) : '0.0';
  const targetPerWeek = 20;
  const targetPerDay = targetPerWeek / 5; // 4 par jour en moyenne

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const currentMonthKey = format(new Date(), "yyyy-MM");
        const commercialsKPI = await getAllCommercialsKPI(currentMonthKey);
        
        // Calculer la moyenne par jour pour chaque commercial
        const withAvgPerDay = commercialsKPI.map(user => ({
          name: user.firstName,
          process: user.process,
          avatar: user.firstName[0].toUpperCase(),
          isCurrentUser: user.email === currentUserEmail,
          avgPerDay: workingDays > 0 ? (user.process / workingDays) : 0,
          trend: 0 // Peut être calculé en comparant avec le mois précédent
        }));
        
        // Trier par nombre de process décroissants et attribuer les rangs
        const sorted = withAvgPerDay
          .sort((a, b) => b.process - a.process)
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }));
        
        setLeaderboardData(sorted);
      } catch (error) {
        console.error("Error loading process leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [currentUserEmail, workingDays]);

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
    leaderboardData[0].process - currentUser.process : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Classement Process</CardTitle>
              <CardDescription>Top des process du mois</CardDescription>
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
            className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold flex items-center justify-center text-lg">
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
                <p className="text-2xl font-bold text-foreground">{currentUser.process}</p>
                <p className="text-xs text-muted-foreground">process</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Moyenne/jour</p>
                <p className="text-lg font-bold">{avgPerDay}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Objectif: {targetPerDay}/j</p>
                <p className={cn(
                  "text-lg font-bold",
                  parseFloat(avgPerDay) >= targetPerDay 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-orange-600 dark:text-orange-400"
                )}>
                  {parseFloat(avgPerDay) >= targetPerDay ? "✓ Atteint" : "En cours"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">🔥 Top 3 du mois</h4>
          {leaderboardData.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg transition-all hover:shadow-md",
                user.isCurrentUser
                  ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300 dark:border-purple-700"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Médaille pour le top 3 */}
                  <div className="w-8 flex items-center justify-center">
                    {user.rank === 1 && <span className="text-2xl">🥇</span>}
                    {user.rank === 2 && <span className="text-2xl">🥈</span>}
                    {user.rank === 3 && <span className="text-2xl">🥉</span>}
                    {user.rank > 3 && (
                      <span className="text-sm font-bold text-muted-foreground">#{user.rank}</span>
                    )}
                  </div>
                  
                  <Avatar className={cn(
                    "h-10 w-10 font-semibold flex items-center justify-center",
                    user.isCurrentUser 
                      ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
                      : "bg-gradient-to-br from-slate-400 to-slate-600 text-white"
                  )}>
                    {user.avatar}
                  </Avatar>
                  
                  <div>
                    <p className={cn(
                      "font-semibold",
                      user.isCurrentUser && "text-purple-700 dark:text-purple-300"
                    )}>
                      {user.isCurrentUser ? "Vous" : user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.avgPerDay.toFixed(1)} / jour
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold">{user.process}</p>
                  <p className="text-xs text-muted-foreground">process</p>
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
