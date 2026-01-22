"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface NewYearCelebrationProps {
  onClose: () => void;
}

export function NewYearCelebration({ onClose }: NewYearCelebrationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  // Lecture automatique du son de fête au montage
  useEffect(() => {
    try {
      const audio = new Audio("/sounds/new-year-celebration.mp3");
      audio.volume = 0.6;
      audio.play().catch((error) => {
        // Ignorer les erreurs d'autoplay (politique du navigateur)
        console.log("Impossible de lire le son automatiquement:", error);
      });
      audioRef.current = audio;

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    } catch (error) {
      console.log("Erreur lors du chargement du son:", error);
    }
  }, []);

  const handleClose = () => {
    // Arrêter le son si en cours
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Configuration du feu d'artifice
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        onClose();
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Feu d'artifice depuis plusieurs points
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 }
      });
    }, 250);

    // Arrêter après la durée
    setTimeout(() => {
      clearInterval(interval);
      onClose();
    }, duration);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] overflow-hidden">
        {/* Fond noir avec étoiles */}
        <div className="absolute inset-0 bg-black">
          {/* Étoiles animées */}
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Texte Star Wars */}
        <div 
          ref={containerRef}
          className="relative h-full w-full flex items-center justify-center perspective-1000 overflow-hidden"
        >
          <motion.div
            className="text-center text-yellow-400 font-bold star-wars-text w-full"
            style={{
              transformStyle: "preserve-3d",
              perspective: "1000px",
            }}
          >
            <motion.div
              initial={{ 
                y: 0,
                scale: 0.1,
                opacity: 0,
              }}
              animate={{ 
                y: [0, 0, -2000],
                scale: [0.1, 1, 0.05],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 15,
                ease: "linear",
                repeat: Infinity,
                times: [0, 0.3, 1],
              }}
              style={{
                transformStyle: "preserve-3d",
                transform: "perspective(1000px) rotateX(25deg)",
              }}
              className="space-y-8 w-full"
            >
              <motion.p
                className="text-5xl md:text-7xl lg:text-9xl mb-8 w-full"
                style={{
                  textShadow: "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700",
                  fontSize: "clamp(2rem, 15vw, 12rem)",
                }}
              >
                BONNE ANNÉE
              </motion.p>
              
              <motion.p
                className="text-6xl md:text-8xl lg:text-[12rem] w-full"
                style={{
                  textShadow: "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700",
                  fontSize: "clamp(3rem, 20vw, 15rem)",
                }}
              >
                {currentYear}
              </motion.p>

              <motion.p
                className="text-2xl md:text-4xl lg:text-5xl mt-12 w-full"
                style={{
                  textShadow: "0 0 5px #ffd700, 0 0 10px #ffd700",
                  fontSize: "clamp(1.25rem, 5vw, 4rem)",
                }}
              >
                Que la force soit avec vous !
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Bouton pour fermer */}
          <motion.button
            onClick={handleClose}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] px-8 py-4 bg-yellow-400 text-black font-bold text-xl rounded-lg hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continuer vers mon espace
          </motion.button>
        </div>
      </div>
    </AnimatePresence>
  );
}

