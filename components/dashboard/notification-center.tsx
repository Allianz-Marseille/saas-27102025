"use client";

import { Bell, Trophy, AlertCircle, TrendingUp, Target, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: number;
  type: "success" | "warning" | "info";
  icon: React.ElementType;
  title: string;
  message: string;
  time: string;
  color: string;
}

interface NotificationCenterProps {
  kpi?: {
    commissionValidee?: boolean;
    ratio?: number;
    nbContrats?: number;
  };
}

export function NotificationCenter({ kpi }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Génération dynamique des notifications basée sur les KPIs
  const notifications: Notification[] = [];

  if (kpi?.commissionValidee) {
    notifications.push({
      id: 1,
      type: "success",
      icon: Trophy,
      title: "🎉 Objectif atteint !",
      message: "Vous avez validé toutes les conditions de commission !",
      time: "Il y a 2h",
      color: "green"
    });
  }

  if (kpi && kpi.ratio < 100) {
    const manquant = Math.ceil((100 - kpi.ratio) / 10);
    notifications.push({
      id: 2,
      type: "warning",
      icon: Target,
      title: "Ratio à surveiller",
      message: `Il vous reste environ ${manquant} contrats Autres pour valider le ratio`,
      time: "Il y a 5h",
      color: "orange"
    });
  }

  if (kpi && kpi.nbContrats > 10) {
    notifications.push({
      id: 3,
      type: "info",
      icon: TrendingUp,
      title: "Belle performance !",
      message: `Vous avez déjà ${kpi.nbContrats} contrats ce mois-ci`,
      time: "Aujourd'hui",
      color: "blue"
    });
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg"
          >
            {notifications.length}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel de notifications */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute right-0 mt-2 w-80 md:w-96 bg-card border rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {notifications.length} {notifications.length > 1 ? 'nouvelles' : 'nouvelle'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Liste des notifications */}
              <ScrollArea className="max-h-96">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif, index) => {
                      const Icon = notif.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ x: 4 }}
                          className={`p-4 border-b hover:bg-${notif.color}-500/5 cursor-pointer transition-colors group`}
                        >
                          <div className="flex gap-3">
                            <div className={`p-2.5 rounded-lg bg-${notif.color}-500/10 h-fit group-hover:scale-110 transition-transform`}>
                              <Icon className={`h-5 w-5 text-${notif.color}-600 dark:text-${notif.color}-400`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                                {notif.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {notif.message}
                              </p>
                              <span className="text-xs text-muted-foreground">{notif.time}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t bg-muted/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm"
                    onClick={() => {
                      // Logique pour marquer comme lu
                      setIsOpen(false);
                    }}
                  >
                    Tout marquer comme lu
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

