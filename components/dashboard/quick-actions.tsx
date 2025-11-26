"use client";

import { Plus, FileSearch, Download, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface QuickActionsProps {
  onNewAct?: () => void;
  notificationCount?: number;
}

export function QuickActions({ onNewAct, notificationCount = 0 }: QuickActionsProps) {
  const actions = [
    { 
      icon: Plus, 
      label: "Nouvel acte", 
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      action: onNewAct 
    },
    { 
      icon: FileSearch, 
      label: "Rechercher", 
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      action: () => console.log("Search") 
    },
    { 
      icon: Download, 
      label: "Exporter", 
      color: "green",
      gradient: "from-green-500 to-green-600",
      action: () => console.log("Export") 
    },
    { 
      icon: Bell, 
      label: "Notifications", 
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      badge: notificationCount,
      action: () => console.log("Notifications") 
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.action}
            className="group relative overflow-hidden rounded-xl p-5 bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all hover:shadow-xl"
          >
            {/* Gradient de fond au hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
            
            {/* Badge pour notifications */}
            {action.badge !== undefined && action.badge > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 z-10"
              >
                <Badge className="bg-red-500 text-white border-0 h-6 min-w-6 flex items-center justify-center">
                  {action.badge}
                </Badge>
              </motion.div>
            )}
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className={`p-4 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-sm font-semibold text-center">{action.label}</span>
            </div>

            {/* Effet de brillance */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

