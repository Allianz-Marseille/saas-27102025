"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { NewYearCelebration } from "./NewYearCelebration";
import { isNewYearPeriod } from "./utils";

export function NewYearWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const previousUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // Vérifier si on est dans la période du Nouvel An
    if (!isNewYearPeriod()) {
      setShowCelebration(false);
      previousUserRef.current = null;
      return;
    }

    // Afficher l'effet à chaque reconnexion (quand l'utilisateur passe de non connecté à connecté)
    if (user) {
      const currentUserId = user.uid;
      
      // Si c'est une nouvelle connexion (l'utilisateur précédent était null ou différent)
      if (previousUserRef.current !== currentUserId) {
        previousUserRef.current = currentUserId;
        setShowCelebration(true);
      }
    } else {
      // Utilisateur déconnecté, réinitialiser pour permettre l'affichage à la prochaine connexion
      previousUserRef.current = null;
      setShowCelebration(false);
    }
  }, [user, loading]);

  const handleClose = () => {
    setShowCelebration(false);
  };

  return (
    <>
      {showCelebration && <NewYearCelebration onClose={handleClose} />}
      {children}
    </>
  );
}

