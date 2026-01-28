"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/use-auth";
import { isNinaIntroModalActive } from "@/lib/assistant/config";
import { NinaIntroModal } from "./NinaIntroModal";

const NINA_INTRO_MODAL_DISMISSED_KEY = "nina-intro-modal-dismissed";
const NINA_PAGE_PATH = "/commun/agents-ia/bot-secretaire";

/**
 * Affiche la modale d'intro Nina dès la connexion (dashboard ou toute page authentifiée),
 * jusqu'au 5 fév 2026, une fois par utilisateur. S'affiche quel que soit le rôle.
 * CTA "Démarrer avec Nina" redirige vers Nina si on n'y est pas.
 */
export function NinaIntroModalWrapper() {
  const [showIntroModal, setShowIntroModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    if (
      isNinaIntroModalActive() &&
      !localStorage.getItem(NINA_INTRO_MODAL_DISMISSED_KEY)
    ) {
      setShowIntroModal(true);
    }
  }, [user]);

  const handleCloseIntroModal = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(NINA_INTRO_MODAL_DISMISSED_KEY, "true");
    }
    setShowIntroModal(false);
  }, []);

  const handleCtaClick = useCallback(() => {
    if (pathname !== NINA_PAGE_PATH) {
      router.push(NINA_PAGE_PATH);
    }
  }, [pathname, router]);

  return (
    <NinaIntroModal
      open={showIntroModal}
      onClose={handleCloseIntroModal}
      onCtaClick={handleCtaClick}
    />
  );
}
