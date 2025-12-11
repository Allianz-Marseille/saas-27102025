"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wrench, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function OutilsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          Outils
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Construction className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              En construction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6"
              >
                <Wrench className="h-24 w-24 text-muted-foreground/50 mx-auto" />
              </motion.div>
              <p className="text-lg text-foreground mb-2">
                Cette page est en cours de construction.
              </p>
              <p className="text-sm text-muted-foreground">
                Les outils seront bientôt disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
