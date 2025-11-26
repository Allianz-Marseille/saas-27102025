"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  colorScheme?: "blue" | "green" | "orange" | "purple" | "red" | "teal" | "pink" | "indigo";
  delay?: number;
}

const colorSchemes = {
  blue: {
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-l-4 border-blue-500",
  },
  green: {
    iconBg: "bg-green-500/10 dark:bg-green-500/20",
    iconColor: "text-green-600 dark:text-green-400",
    border: "border-l-4 border-green-500",
  },
  orange: {
    iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    border: "border-l-4 border-orange-500",
  },
  purple: {
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    border: "border-l-4 border-purple-500",
  },
  red: {
    iconBg: "bg-red-500/10 dark:bg-red-500/20",
    iconColor: "text-red-600 dark:text-red-400",
    border: "border-l-4 border-red-500",
  },
  teal: {
    iconBg: "bg-teal-500/10 dark:bg-teal-500/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    border: "border-l-4 border-teal-500",
  },
  pink: {
    iconBg: "bg-pink-500/10 dark:bg-pink-500/20",
    iconColor: "text-pink-600 dark:text-pink-400",
    border: "border-l-4 border-pink-500",
  },
  indigo: {
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    border: "border-l-4 border-indigo-500",
  },
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, colorScheme = "blue", delay = 0 }: KPICardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.03] group cursor-pointer relative",
        colors.border
      )}>
        {/* Gradient Background on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300" 
          style={{ 
            backgroundImage: `linear-gradient(135deg, var(--${colorScheme}-500) 0%, var(--${colorScheme}-700) 100%)` 
          }} 
        />
        
        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />

        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {title}
              </CardTitle>
              <motion.div 
                className="text-4xl font-bold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
              >
                {value}
              </motion.div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
              )}
              {trend && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 }}
                  className="mt-3"
                >
                  <span className={cn(
                    "text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full w-fit",
                    trend === 'up' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
                    trend === 'down' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 
                    'bg-gray-500/10 text-muted-foreground'
                  )}>
                    {trend === 'up' && '↑ En hausse'}
                    {trend === 'down' && '↓ En baisse'}
                    {trend === 'neutral' && '→ Stable'}
                  </span>
                </motion.div>
              )}
            </div>
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={cn("rounded-xl p-3 flex items-center justify-center", colors.iconBg)}
            >
              <Icon className={cn("h-8 w-8", colors.iconColor)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

