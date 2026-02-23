"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
});

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export function MermaidDiagram({ code, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState<string | null>(null);

  useEffect(() => {
    if (!code?.trim()) return;

    const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
    setError(null);
    setRendered(null);

    mermaid
      .render(id, code.trim())
      .then(({ svg }) => {
        setRendered(svg);
      })
      .catch((err) => {
        setError(err?.message ?? "Erreur rendu diagramme");
      });
  }, [code]);

  useEffect(() => {
    if (!rendered || !containerRef.current) return;
    containerRef.current.innerHTML = rendered;
    const svgEl = containerRef.current.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("style", "max-width: 100%; height: auto;");
      // Contraste : sur fonds clairs (carence J1–J3, CPAM J4–J90, relais J91+), forcer le texte en sombre
      const lightFillPatterns = ["fff3cd", "d4edda", "cce5ff", "255, 243, 205", "212, 237, 218", "204, 229, 255"];
      const textColorDark = "#1e293b";
      svgEl.querySelectorAll("rect").forEach((rect) => {
        const fillAttr = (rect.getAttribute("fill") ?? "").toLowerCase();
        const styleAttr = (rect.getAttribute("style") ?? "").toLowerCase();
        const fill = `${fillAttr} ${styleAttr}`;
        const isLight = lightFillPatterns.some((p) => fill.includes(p));
        if (isLight) {
          const node = rect.closest(".node") ?? rect.closest("g") ?? rect.parentElement;
          node?.querySelectorAll("text, tspan").forEach((el) => {
            el.setAttribute("fill", textColorDark);
          });
        }
      });
    }
  }, [rendered]);

  if (error) {
    return (
      <div className="my-3 rounded-lg border border-amber-500/50 bg-amber-950/20 p-3 text-sm text-amber-200">
        Diagramme non rendu : {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-3 overflow-x-auto rounded-lg p-3 ${className}`}
    />
  );
}
