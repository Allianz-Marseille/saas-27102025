"use client";

import { useAuth } from "@/lib/firebase/use-auth";
import { Trophy, Target, TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface WelcomeBannerProps {
  kpi: {
    nbContrats: number;
    caMensuel: number;
    commissionValidee: boolean;
    ratio: number;
  };
}

export function WelcomeBanner({ kpi }: WelcomeBannerProps) {
  const { userData } = useAuth();
  const rawFirstName = userData?.email.split('@')[0]?.split('.')[0] || 'Utilisateur';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const objectifMensuel = 20;
  const progression = Math.min((kpi.nbContrats / objectifMensuel) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white border-0 mb-6 shadow-2xl">
        {/* Cercles décoratifs animés */}
        <div className="absolute top-0 right-0 opacity-10">
          <motion.svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="150" cy="150" r="100" fill="white" />
            <circle cx="200" cy="100" r="50" fill="white" />
          </motion.svg>
        </div>

        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="p-6 md:p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2"
              >
                {greeting}, {firstName} !
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  👋
                </motion.span>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg mb-6"
              >
                Vous avez réalisé <strong className="text-white">{kpi.nbContrats} contrats</strong> ce mois-ci
                <span className="ml-2">
                  ({kpi.caMensuel.toLocaleString('fr-FR')} € CA)
                </span>
              </motion.p>

              <div className="flex flex-wrap gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/30"
                >
                  <Target className="h-5 w-5" />
                  <div>
                    <div className="text-xs text-white/80">Progression</div>
                    <div className="text-sm font-bold">{progression.toFixed(0)}% de l'objectif</div>
                  </div>
                </motion.div>

                {kpi.commissionValidee && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 bg-green-500/30 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-green-400/50"
                  >
                    <Trophy className="h-5 w-5" />
                    <div>
                      <div className="text-xs text-white/80">Félicitations</div>
                      <div className="text-sm font-bold">Commissions validées !</div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/30"
                >
                  <TrendingUp className="h-5 w-5" />
                  <div>
                    <div className="text-xs text-white/80">Ratio</div>
                    <div className="text-sm font-bold">{kpi.ratio.toFixed(0)}%</div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Illustration motivante */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="hidden lg:block"
            >
              <div className="relative w-32 h-32">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-white/10 rounded-full blur-xl"
                />
                <div className="relative flex items-center justify-center w-full h-full text-7xl">
                  {kpi.commissionValidee ? '🏆' : '🎯'}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

