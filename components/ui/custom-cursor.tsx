"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface MousePosition {
  x: number;
  y: number;
}

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [circlePosition, setCirclePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  const LERP_FACTOR = 0.15;

  // Fonction d'interpolation linéaire (lerp)
  const lerp = useCallback((start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  }, []);

  // Détection des éléments interactifs
  const isInteractiveElement = useCallback((element: Element | null): boolean => {
    if (!element) return false;

    // Tags HTML interactifs
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
    if (interactiveTags.includes(element.tagName)) {
      return true;
    }

    // Attributs interactifs
    if (
      element.hasAttribute('onclick') ||
      element.hasAttribute('data-clickable') ||
      element.getAttribute('role') === 'button' ||
      element.getAttribute('role') === 'link'
    ) {
      return true;
    }

    // Vérifier le style cursor: pointer
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer' || computedStyle.cursor === 'grab') {
      return true;
    }

    // Vérifier les parents
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (interactiveTags.includes(parent.tagName)) {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }, []);

  // Gestion du mouvement de la souris
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Activer immédiatement si ce n'est pas déjà fait
      if (!isEnabled) {
        setIsEnabled(true);
        document.body.style.cursor = "none";
      }

      setMousePosition({ x: e.clientX, y: e.clientY });

      // Détection de l'élément sous le curseur
      const element = document.elementFromPoint(e.clientX, e.clientY);
      setIsHovering(isInteractiveElement(element));
    },
    [isInteractiveElement, isEnabled]
  );

  // Animation du cercle avec lerp
  useEffect(() => {
    const animate = () => {
      setCirclePosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, LERP_FACTOR),
        y: lerp(prev.y, mousePosition.y, LERP_FACTOR),
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isEnabled) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition, lerp, isEnabled]);

  // Gestion du clic avec son optionnel
  const handleClick = useCallback(() => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {
        // Ignorer les erreurs de lecture audio (permissions, etc.)
      });
    }
  }, []);

  // Initialisation et gestion des événements
  useEffect(() => {
    // Vérifier si on est sur un appareil avec hover (pas mobile/tablette)
    const hasHover = window.matchMedia("(hover: hover)").matches;
    
    if (!hasHover) {
      return; // Désactiver sur mobile/tablette
    }

    // Initialiser la position au centre de l'écran avant d'activer
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePosition({ x: centerX, y: centerY });
    setCirclePosition({ x: centerX, y: centerY });

    // Activer après un court délai pour éviter le flash à (0,0)
    const initTimer = setTimeout(() => {
      setIsEnabled(true);
      // Ajouter le style cursor: none au body
      document.body.style.cursor = "none";
    }, 50);

    // Événements
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    // Charger le son au clic (optionnel)
    try {
      clickSoundRef.current = new Audio("/click-sound.mp3");
      clickSoundRef.current.volume = 0.3;
    } catch (error) {
      // Le fichier audio n'existe pas ou erreur de chargement, on continue sans
    }

    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      document.body.style.cursor = "";
      
      if (clickSoundRef.current) {
        clickSoundRef.current.pause();
        clickSoundRef.current = null;
      }
    };
  }, [handleMouseMove, handleClick]);

  // Ne rien rendre si désactivé
  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Point qui suit directement la souris */}
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) translate(-50%, -50%) scale(${isHovering ? 0 : 1})`,
          opacity: isHovering ? 0 : 1,
        }}
      />

      {/* Cercle qui suit avec délai */}
      <div
        ref={circleRef}
        className="custom-cursor-circle"
        style={{
          transform: `translate(${circlePosition.x}px, ${circlePosition.y}px) translate(-50%, -50%)`,
          width: isHovering ? "60px" : "40px",
          height: isHovering ? "60px" : "40px",
        }}
        data-hovering={isHovering}
      />
    </>
  );
}

