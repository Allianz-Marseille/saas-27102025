"use client";

import { useEffect, useState, useRef } from "react";

interface NewFeatureArrowProps {
  targetButtonRef?: React.RefObject<HTMLButtonElement | null>;
  featureStartDate: Date;
  daysToShow?: number;
  targetHref?: string;
}

export function NewFeatureArrow({
  targetButtonRef,
  featureStartDate,
  daysToShow = 7,
  targetHref,
}: NewFeatureArrowProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const arrowRef = useRef<HTMLDivElement>(null);

  // Vérifier si on est dans la fenêtre de 7 jours
  useEffect(() => {
    const today = new Date();
    const daysDiff = Math.floor(
      (today.getTime() - featureStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    setIsVisible(daysDiff < daysToShow);
  }, [featureStartDate, daysToShow]);

  // Calculer la position de la flèche
  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      let button: HTMLButtonElement | null = null;

      if (targetButtonRef?.current) {
        button = targetButtonRef.current;
      } else if (targetHref) {
        // Fallback : chercher le bouton par son href
        button = document.querySelector(
          `button[data-href="${targetHref}"]`
        ) as HTMLButtonElement;
      }

      if (button) {
        const buttonRect = button.getBoundingClientRect();
        // Position fixe par rapport à la fenêtre
        // Flèche à gauche du bouton, centrée verticalement
        setPosition({
          top: buttonRect.top + buttonRect.height / 2,
          left: buttonRect.left - 70, // 70px à gauche du bouton
        });
      }
    };

    // Attendre que le DOM soit prêt
    const timeout = setTimeout(updatePosition, 100);
    
    // Mettre à jour lors du scroll et du resize
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      clearTimeout(timeout);
    };
  }, [isVisible, targetButtonRef, targetHref]);

  if (!isVisible) return null;

  return (
    <div
      ref={arrowRef}
      className="fixed z-50 pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateY(-50%)",
      }}
    >
      {/* Flèche rouge cartoon */}
      <div className="relative">
        {/* Ombre portée */}
        <div
          className="absolute inset-0 blur-md opacity-50"
          style={{
            transform: "translate(2px, 2px)",
            filter: "blur(4px)",
          }}
        >
          <svg
            width="80"
            height="60"
            viewBox="0 0 80 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M70 30 L10 30 L20 20 M10 30 L20 40"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M70 30 L10 30 L20 20 M10 30 L20 40"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Flèche principale */}
        <div className="relative animate-bounce-arrow">
          <svg
            width="80"
            height="60"
            viewBox="0 0 80 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
          >
            {/* Corps de la flèche */}
            <path
              d="M70 30 L10 30"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M70 30 L10 30"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pointe de la flèche */}
            <path
              d="M10 30 L20 20 M10 30 L20 40"
              stroke="#000"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 30 L20 20 M10 30 L20 40"
              stroke="#dc2626"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Badge NEW en relief */}
          <div
            className="absolute -top-2 -right-2 animate-pulse-glow"
            style={{
              transform: "rotate(-15deg)",
            }}
          >
            <div className="relative">
              {/* Ombre pour effet relief */}
              <div
                className="absolute inset-0"
                style={{
                  transform: "translate(2px, 2px)",
                  background:
                    "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  borderRadius: "8px",
                  filter: "blur(2px)",
                  opacity: 0.5,
                }}
              />
              {/* Badge principal */}
              <div
                className="relative px-2 py-1 rounded-lg font-black text-xs text-black border-2 border-black"
                style={{
                  background:
                    "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px #000",
                  textShadow:
                    "1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.3)",
                }}
              >
                NEW
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
