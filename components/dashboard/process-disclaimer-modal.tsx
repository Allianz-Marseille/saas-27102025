"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, MessageSquare, Clock, Lightbulb, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function ProcessDisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Afficher la modale à chaque connexion après un court délai
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Fermer la modale (elle réapparaîtra à la prochaine connexion)
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Target className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stratégie Process : L'art de la régularité
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Un rappel essentiel pour votre succès et celui de l'agence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section Image principale - Les 4 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-900"
          >
            <div className="relative w-full h-64 md:h-80">
              <Image
                src="/les-4.webp"
                alt="Les 4 - Objectif quotidien process"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Section 1 : La régularité */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200/50 dark:border-blue-800/50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-blue-900 dark:text-blue-100">
                  La régularité est la clé
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  Il est essentiel de maintenir un <span className="font-bold">effort régulier</span> sur les process : 
                  <span className="font-bold text-blue-600 dark:text-blue-400"> M+3, Préterme Auto et Préterme IRD</span>.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 border border-blue-300/50 dark:border-blue-700/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      Objectif quotidien : 4 process par jour minimum
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2 : Acte stratégique */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200/50 dark:border-purple-800/50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-purple-900 dark:text-purple-100">
                  Un acte stratégique pour l'agence
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                  Les process ne sont pas qu'une simple tâche administrative. C'est <span className="font-bold">un levier stratégique</span> qui 
                  contribue directement au développement de l'agence et à votre réussite personnelle.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/30 border border-purple-300/50 dark:border-purple-700/50">
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 italic">
                    💡 "Ce n'est pas un sprint, c'est un marathon."
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    La constance et la persévérance font la différence sur le long terme.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3 : Phrases magiques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200/50 dark:border-amber-800/50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-3 text-amber-900 dark:text-amber-100">
                  Les phrases magiques
                </h3>
                
                {/* M+3 */}
                <div className="mb-4 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-amber-300/50 dark:border-amber-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      Pour M+3
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">« Vous êtes nouveau client et c'est moi qui gère votre dossier. 
                    Vous avez quelques minutes pour moi ? »</span>
                  </p>
                </div>

                {/* Préterme */}
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-amber-300/50 dark:border-amber-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      Pour Préterme Auto / IRD
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">« La date anniversaire de votre contrat auto / IRD c'est le mois prochain. 
                    Il n'a pas été revu depuis longtemps. Il faudrait faire un point. »</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200/50 dark:border-green-800/50"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Ensemble, construisons le succès de l'agence, un process à la fois ! 💪
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bouton d'action */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t">
          <Button
            onClick={handleClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
          >
            J'ai compris, c'est parti ! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

