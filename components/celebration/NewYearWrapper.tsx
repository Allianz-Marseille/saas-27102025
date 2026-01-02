"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { NewYearCelebration } from "./NewYearCelebration";
import { isNewYearPeriod, hasShownCelebrationThisYear, markCelebrationAsShown } from "./utils";

export function NewYearWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Vérifier si on est dans la période et si l'utilisateur est connecté
    if (user && isNewYearPeriod() && !hasShownCelebrationThisYear()) {
      setShowCelebration(true);
      markCelebrationAsShown();
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

