"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OptionCardProps {
  label: string;
  subLabel?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "cyan" | "amber" | "gray" | "red";
  onClick: () => void;
  isHighlighted?: boolean;
}

const colorClasses = {
  blue: {
    bg: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
    hover: "hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20",
    hover: "hover:from-green-100 hover:to-emerald-200 dark:hover:from-green-900/30 dark:hover:to-emerald-800/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
  },
  cyan: {
    bg: "from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/20",
    hover: "hover:from-cyan-100 hover:to-cyan-200 dark:hover:from-cyan-900/30 dark:hover:to-cyan-800/30",
    border: "border-cyan-200 dark:border-cyan-800",
    icon: "text-cyan-600 dark:text-cyan-400",
  },
  amber: {
    bg: "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20",
    hover: "hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900/30 dark:hover:to-amber-800/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  gray: {
    bg: "from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20",
    hover: "hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-900/30 dark:hover:to-gray-800/30",
    border: "border-gray-200 dark:border-gray-800",
    icon: "text-gray-600 dark:text-gray-400",
  },
  red: {
    bg: "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
    hover: "hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
  },
};

export function OptionCard({
  label,
  subLabel,
  icon: Icon,
  color = "blue",
  onClick,
  isHighlighted = false,
}: OptionCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative group overflow-hidden",
        "w-full h-[160px] p-6",
        "flex flex-col items-center justify-center gap-4",
        "bg-gradient-to-br",
        colors.bg,
        colors.hover,
        "border-2 rounded-2xl",
        colors.border,
        "shadow-lg hover:shadow-2xl",
        "transition-all duration-300",
        "cursor-pointer",
        "backdrop-blur-sm",
        isHighlighted && "ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-gray-900 shadow-2xl scale-105"
      )}
    >
      {/* Effet de brillance au survol */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100"
        initial={false}
        transition={{ duration: 0.3 }}
      />

      {/* Cercle décoratif derrière l'icône */}
      <motion.div
        className={cn(
          "absolute top-4 right-4 w-20 h-20 rounded-full opacity-20 blur-2xl",
          colors.icon.includes("blue") && "bg-blue-400",
          colors.icon.includes("green") && "bg-green-400",
          colors.icon.includes("cyan") && "bg-cyan-400",
          colors.icon.includes("amber") && "bg-amber-400",
          colors.icon.includes("red") && "bg-red-400",
          colors.icon.includes("gray") && "bg-gray-400"
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Icône avec cercle de fond */}
      <motion.div
        className={cn(
          "relative z-10",
          "p-4 rounded-2xl",
          "bg-white/50 dark:bg-gray-800/50",
          "backdrop-blur-sm",
          "shadow-lg group-hover:shadow-xl",
          "transition-all duration-300"
        )}
        whileHover={{ rotate: [0, -8, 8, -8, 0], scale: 1.15 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className={cn("h-10 w-10", colors.icon, "drop-shadow-lg")} />
      </motion.div>

      {/* Label principal */}
      <div className="text-center relative z-10">
        <p className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
          {label}
        </p>
        {subLabel && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-snug">
            {subLabel}
          </p>
        )}
      </div>

      {/* Effet de ripple au clic */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-white/40 to-transparent"
          initial={{ scale: 0, opacity: 0.6 }}
          whileTap={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Indicateur de sélection (si highlighted) */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1.5 shadow-lg z-20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            ✓
          </motion.div>
        </motion.div>
      )}
    </motion.button>
  );
}
