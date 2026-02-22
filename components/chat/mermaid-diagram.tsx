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
