"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WeatherCard } from "@/components/admin/weather-card";
import { ActivityOverview } from "@/components/admin/activity-overview";
import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";

export default function AdminHome() {
  const { userData } = useAuth();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getUserName = () => {
    if (!userData?.email) return 'Administrateur';
    const emailParts = userData.email.split('@')[0].split('.');
    const firstName = emailParts[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Message de bienvenue modernisé */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-lg">
          {/* Effets de fond */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
          
          <CardContent className="relative z-10 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Bonjour */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
                  Bonjour {getUserName()} !
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-300/50 dark:border-blue-700/50">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {userData?.email || 'Chargement...'}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold">
                    ADMIN
                  </div>
                </div>
              </div>
              
              {/* Date */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-600/20 dark:to-amber-600/20 border border-orange-300/50 dark:border-orange-700/50">
                  <span className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {capitalizeFirstLetter(formattedDate)}
                  </span>
                </div>
              </div>
              
              {/* Météo */}
              <div className="flex justify-center">
                <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 shadow-md">
                  <WeatherCard />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vue activité */}
      <ActivityOverview />
    </div>
  );
}
