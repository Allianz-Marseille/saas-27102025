"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { AssistantDrawer } from "./AssistantDrawer";
import { useAuth } from "@/lib/firebase/use-auth";
import { useAssistantStore } from "@/lib/assistant/assistant-store";

export function AssistantWrapper() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Utiliser le store Zustand pour l'état du drawer
  const { isOpenDrawer, setIsOpenDrawer } = useAssistantStore();

  const handleCloseDrawer = useCallback(() => {
    setIsOpenDrawer(false);
  }, [setIsOpenDrawer]);

  // Ne pas afficher le drawer si l'utilisateur n'est pas connecté
  if (!user) return null;

  // Ne pas afficher le drawer sur la homepage et la page de login
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <AssistantDrawer isOpen={isOpenDrawer} onClose={handleCloseDrawer} />
  );
}

