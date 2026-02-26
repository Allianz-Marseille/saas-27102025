"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export function MermaidDiagram({ code, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "default";
    mermaid.initialize({
      startOnLoad: false,
      theme,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
      },
    });
  }, [resolvedTheme]);

  useEffect(() => {
    if (!code?.trim()) return;

    const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
    setError(null);
    setRendered(null);

    Promise.resolve(mermaid.parse(code.trim()))
      .then(() => mermaid.render(id, code.trim()))
      .then(({ svg }) => {
        if (svg && /syntax error|mermaid version/i.test(svg)) {
          setError("Erreur de syntaxe dans le diagramme Mermaid.");
          return;
        }
        setRendered(svg);
      })
      .catch((err) => {
        setError(err?.message ?? "Erreur de syntaxe dans le diagramme Mermaid.");
      });
  }, [code, resolvedTheme]);

  useEffect(() => {
    if (!rendered || !containerRef.current) return;
    containerRef.current.innerHTML = rendered;
    const svgEl = containerRef.current.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("style", "max-width: 100%; height: auto;");
      // Contraste : sur fonds clairs (carence J1–J3, CPAM J4–J90, relais J91+),
      // forcer le texte en sombre pour labels SVG ET htmlLabels (foreignObject).
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
            el.setAttribute("opacity", "1");
          });
          node?.querySelectorAll(".label, .label *, foreignObject, foreignObject *, span, p, div").forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.color = textColorDark;
              el.style.fill = textColorDark;
              el.style.opacity = "1";
            } else {
              el.setAttribute("fill", textColorDark);
              el.setAttribute("opacity", "1");
            }
          });
        }
      });
    }
  }, [rendered]);

  if (error) {
    return (
      <div className="my-3 rounded-lg border border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-200">
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
