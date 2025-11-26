"use client";

import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeaderboardWidgetProps {
  currentUserEmail?: string;
  kpi?: {
    caMensuel: number;
  };
}

export function LeaderboardWidget({ currentUserEmail, kpi }: LeaderboardWidgetProps) {
  // Données simulées - À remplacer par de vraies données depuis Firebase
  const currentUserCA = kpi?.caMensuel || 6720;
  const firstName = currentUserEmail?.split('@')[0]?.split('.')[0] || 'Vous';

  const leaderboard = [
    { rank: 1, name: "Emma D.", ca: 8500, avatar: "E", isCurrentUser: false, trend: 15 },
    { rank: 2, name: firstName, ca: currentUserCA, avatar: firstName[0].toUpperCase(), isCurrentUser: true, trend: 12 },
    { rank: 3, name: "Gwendal C.", ca: 6200, avatar: "G", isCurrentUser: false, trend: 8 },
    { rank: 4, name: "Julien B.", ca: 5900, avatar: "J", isCurrentUser: false, trend: 10 },
    { rank: 5, name: "Astrid U.", ca: 5500, avatar: "A", isCurrentUser: false, trend: -3 },
  ];

  const currentUser = leaderboard.find(u => u.isCurrentUser);
  const gapToFirst = currentUser ? leaderboard[0].ca - currentUser.ca : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Classement du mois
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((user, index) => {
            const hasMedal = user.rank <= 3;
            const medals = ['🥇', '🥈', '🥉'];

            return (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4, scale: 1.02 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all group",
                  user.isCurrentUser
                    ? "bg-blue-500/10 dark:bg-blue-500/20 border-2 border-blue-500 shadow-lg"
                    : "hover:bg-muted/50 border border-transparent hover:border-muted"
                )}
              >
                {/* Médaille ou rang */}
                <div className="w-10 text-center flex-shrink-0">
                  {hasMedal ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                      className="text-3xl"
                    >
                      {medals[user.rank - 1]}
                    </motion.span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      #{user.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  className={cn(
                    "h-12 w-12 flex-shrink-0 transition-all",
                    user.isCurrentUser && "ring-2 ring-blue-500 ring-offset-2 scale-110"
                  )}
                >
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 text-white font-bold text-lg">
                    {user.avatar}
                  </div>
                </Avatar>

                {/* Info utilisateur */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {user.name}
                    {user.isCurrentUser && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full"
                      >
                        Vous
                      </motion.span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-medium">{user.ca.toLocaleString('fr-FR')} €</span>
                    <span>CA</span>
                  </div>
                </div>

                {/* Tendance */}
                <div className="text-right flex-shrink-0">
                  <div className={cn(
                    "text-sm font-bold flex items-center gap-1",
                    user.trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {user.trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(user.trend)}%
                  </div>
                  <div className="text-xs text-muted-foreground">vs hier</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Message de motivation */}
        {currentUser && currentUser.rank > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-900"
          >
            <p className="text-sm text-center">
              🎯 Plus que{' '}
              <strong className="text-amber-600 dark:text-amber-400">
                {gapToFirst.toLocaleString('fr-FR')} €
              </strong>{' '}
              de CA pour prendre la tête !
            </p>
          </motion.div>
        )}

        {currentUser && currentUser.rank === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-900"
          >
            <p className="text-sm text-center text-green-600 dark:text-green-400 font-semibold">
              👑 Vous êtes en tête ! Continuez comme ça !
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

