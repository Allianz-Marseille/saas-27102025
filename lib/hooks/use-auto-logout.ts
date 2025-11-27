"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";
import { logUserLogout } from "@/lib/firebase/logs";
import { toast } from "sonner";

interface UseAutoLogoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  userId?: string;
  userEmail?: string;
}

/**
 * Hook pour gérer la déconnexion automatique après inactivité
 * @param options Configuration de la déconnexion auto
 * @returns void
 */
export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    timeoutMinutes = 10,
    warningMinutes = 1,
    userId,
    userEmail,
  } = options;

  const router = useRouter();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownWarningRef = useRef(false);

  const handleLogout = async () => {
    try {
      // Logger la déconnexion automatique
      if (userId && userEmail) {
        try {
          await logUserLogout(userId, userEmail, "Déconnexion automatique (inactivité)");
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement du log:", logError);
        }
      }

      await logout();
      toast.error("Vous avez été déconnecté pour inactivité", {
        description: "Pour des raisons de sécurité, votre session a expiré après 10 minutes d'inactivité."
      });
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion automatique:", error);
    }
  };

  const showWarning = () => {
    if (!hasShownWarningRef.current) {
      hasShownWarningRef.current = true;
      toast.warning("Déconnexion imminente", {
        description: `Vous serez déconnecté dans ${warningMinutes} minute${warningMinutes > 1 ? 's' : ''} si aucune activité n'est détectée.`,
      });
    }
  };

  const resetTimer = () => {
    // Réinitialiser le flag d'avertissement
    hasShownWarningRef.current = false;

    // Annuler les timers existants
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (warningTimeoutIdRef.current) {
      clearTimeout(warningTimeoutIdRef.current);
    }

    // Calculer les temps en millisecondes
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    // Timer d'avertissement
    if (warningMinutes > 0 && warningMinutes < timeoutMinutes) {
      warningTimeoutIdRef.current = setTimeout(() => {
        showWarning();
      }, warningMs);
    }

    // Timer de déconnexion
    timeoutIdRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  };

  useEffect(() => {
    // Événements à surveiller pour détecter l'activité
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Initialiser le timer au montage
    resetTimer();

    // Ajouter les écouteurs d'événements
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Nettoyer au démontage
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [userId, userEmail, timeoutMinutes, warningMinutes]);
}

