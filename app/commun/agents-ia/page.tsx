"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ENABLE_BOB_BOT } from "@/lib/assistant/config";

const BOT_SECRETAIRE = {
  name: "Bot Secrétaire",
  firstName: "Nina",
  href: "/commun/agents-ia/bot-secretaire",
  image: "/agents-ia/bot-secretaire/avatar.jpg",
  hoverDescription: "Rédiger, préparer un mail, corriger…",
  services: [
    "Rédiger un mail",
    "Résumer un document",
    "Corriger un texte",
  ],
};

const BOB_SANTE = {
  name: "Assistant agence Santé & Prévoyance",
  firstName: "Bob",
  href: "/commun/agents-ia/bob-sante",
  image: "/agents-ia/bot-sante/bob_rit.png",
  hoverDescription: "Arguments commerciaux et technique (régimes sociaux, sécu, SSI, mutuelle, prévoyance). Sourçage systématique.",
  services: [
    "Analyser une 2035",
    "Rédiger une DUE",
    "Arguments santé & prévoyance",
  ],
};

export default function AgentsIAPage() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInputFocused) return;
      const isAltB = e.altKey && e.key.toLowerCase() === "b";
      const isCmdShiftB = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b";
      if (ENABLE_BOB_BOT && (isAltB || isCmdShiftB)) {
        e.preventDefault();
        router.push(BOB_SANTE.href);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
          <Bot className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Agents IA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Accédez aux assistants intelligents de l&apos;agence
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100">
            Espace Agents IA
          </CardTitle>
          <CardDescription>
            Cliquez sur un agent pour ouvrir sa page. Raccourci Bob : Alt+B (Windows/Linux) ou Cmd+Shift+B (Mac).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="flex flex-wrap gap-6">
              <Link
                href={BOT_SECRETAIRE.href}
                className="group block w-[min(100%,theme(spacing.40))] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-xl"
                aria-label={`Ouvrir ${BOT_SECRETAIRE.firstName}, ${BOT_SECRETAIRE.name}`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <div className="relative aspect-square w-full max-w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50">
                        <Image
                          src={BOT_SECRETAIRE.image}
                          alt={BOT_SECRETAIRE.name}
                          fill
                          className="object-cover object-top"
                          sizes="(max-width: 768px) 128px, 160px"
                        />
                      </div>
                      <p className="mt-2 text-center text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                        {BOT_SECRETAIRE.firstName} · {BOT_SECRETAIRE.name}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs text-center"
                  >
                    <span className="font-medium">
                      {BOT_SECRETAIRE.firstName} — {BOT_SECRETAIRE.name}
                    </span>
                    <br />
                    <span className="text-muted-foreground text-xs">
                      {BOT_SECRETAIRE.hoverDescription}
                    </span>
                    <p className="mt-2 pt-2 border-t border-border text-xs font-medium">
                      {BOT_SECRETAIRE.services.join(" · ")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Link>

              {ENABLE_BOB_BOT && (
                <Link
                  href={BOB_SANTE.href}
                  className="group block w-[min(100%,theme(spacing.40))] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-xl"
                  aria-label={`Ouvrir ${BOB_SANTE.firstName}, ${BOB_SANTE.name}`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-pointer">
                        <div className="relative aspect-square w-full max-w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50">
                          <Image
                            src={BOB_SANTE.image}
                            alt={BOB_SANTE.name}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 768px) 128px, 160px"
                          />
                        </div>
                        <p className="mt-2 text-center text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                          {BOB_SANTE.firstName} · {BOB_SANTE.name}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-xs text-center"
                    >
                      <span className="font-medium">
                        {BOB_SANTE.firstName} — {BOB_SANTE.name}
                      </span>
                      <br />
                      <span className="text-muted-foreground text-xs">
                        {BOB_SANTE.hoverDescription}
                      </span>
                      <p className="mt-2 pt-2 border-t border-border text-xs font-medium">
                        {BOB_SANTE.services.join(" · ")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Link>
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
