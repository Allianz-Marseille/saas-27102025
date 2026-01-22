"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AntecedentsProgressProps {
  currentStep: number;
  totalSteps: number;
  currentQuestion?: string;
}

export function AntecedentsProgress({
  currentStep,
  totalSteps,
  currentQuestion,
}: AntecedentsProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 sticky top-0 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Barre de progression avec points */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "w-full h-2 rounded-full transition-all duration-300",
                    index < currentStep - 1
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                >
                  {index < currentStep - 1 && (
                    <motion.div
                      className="h-full w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  )}
                </motion.div>
                {index < totalSteps - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>

          {/* Compteur d'étapes */}
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              Étape {currentStep}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Question actuelle */}
        {currentQuestion && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentQuestion}
            className="text-sm text-gray-600 dark:text-gray-400 text-center"
          >
            {currentQuestion}
          </motion.p>
        )}
      </div>
    </div>
  );
}
