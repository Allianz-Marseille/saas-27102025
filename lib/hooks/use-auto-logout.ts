"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const sessionEndRef = useRef<number>(0);
  const hasShownWarningRef = useRef(false);
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutMinutes * 60);

  const handleLogout = useCallback(async () => {
    try {
      if (userId && userEmail) {
        try {
          await logUserLogout(userId, userEmail, "Déconnexion automatique (inactivité)");
        } catch (logError) {
          console.error("Erreur lors de l'enregistrement du log:", logError);
        }
      }
      await logout();
      toast.error("Vous avez été déconnecté pour inactivité", {
        description: `Pour des raisons de sécurité, votre session a expiré après ${timeoutMinutes} minute${timeoutMinutes > 1 ? "s" : ""} d'inactivité.`,
      });
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion automatique:", error);
    }
  }, [userId, userEmail, router, timeoutMinutes]);

  const showWarning = useCallback(() => {
    if (!hasShownWarningRef.current) {
      hasShownWarningRef.current = true;
      toast.warning("Déconnexion imminente", {
        description: `Vous serez déconnecté dans ${warningMinutes} minute${warningMinutes > 1 ? "s" : ""} si aucune activité n'est détectée.`,
      });
    }
  }, [warningMinutes]);

  const resetTimer = useCallback(() => {
    hasShownWarningRef.current = false;

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    sessionEndRef.current = Date.now() + timeoutMs;
    setSecondsRemaining(timeoutMinutes * 60);

    if (warningMinutes > 0 && warningMinutes < timeoutMinutes) {
      warningTimeoutIdRef.current = setTimeout(() => {
        showWarning();
      }, warningMs);
    }

    timeoutIdRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [timeoutMinutes, warningMinutes, showWarning, handleLogout]);

  useEffect(() => {
    if (!userId) return;

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    resetTimer();

    intervalIdRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((sessionEndRef.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    }, 1000);

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail, timeoutMinutes, warningMinutes]);

  return { secondsRemaining };
}
