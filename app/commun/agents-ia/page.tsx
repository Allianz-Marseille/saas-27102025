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

type BotCardConfig = {
  name: string;
  firstName: string;
  href: string;
  image: string;
  /** Image affichée au survol (sourire, plan rapproché…) pour rendre le bot vivant */
  imageHover?: string;
  hoverDescription: string;
  services: string[];
};

const BOT_SECRETAIRE: BotCardConfig = {
  name: "Bot Secrétaire",
  firstName: "Nina",
  href: "/commun/agents-ia/bot-secretaire",
  image: "/agents-ia/bot-secretaire/avatar.jpg",
  imageHover: "/agents-ia/bot-secretaire/avatar-tete.jpg",
  hoverDescription: "Rédiger, préparer un mail, corriger…",
  services: [
    "Rédiger un mail",
    "Résumer un document",
    "Corriger un texte",
  ],
};

const BOB_SANTE: BotCardConfig = {
  name: "Assistant agence Santé & Prévoyance",
  firstName: "Bob",
  href: "/commun/agents-ia/bob-sante",
  image: "/agents-ia/bot-sante/bob_rit.png",
  imageHover: "/agents-ia/bot-sante/bob_sourit.png",
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
              {[BOT_SECRETAIRE, ...(ENABLE_BOB_BOT ? [BOB_SANTE] : [])].map(
                (bot) => (
                  <Link
                    key={bot.href}
                    href={bot.href}
                    className="group block w-[min(100%,theme(spacing.40))] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-xl"
                    aria-label={`Ouvrir ${bot.firstName}, ${bot.name}`}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <div
                            className="relative aspect-square w-full max-w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all duration-300 ease-out group-hover:shadow-lg group-hover:-translate-y-1.5 dark:border-slate-700 dark:bg-slate-800/50"
                            style={{ willChange: "transform" }}
                          >
                            <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105">
                              <Image
                                src={bot.image}
                                alt={bot.name}
                                fill
                                className="object-cover object-top"
                                sizes="(max-width: 768px) 128px, 160px"
                              />
                              {bot.imageHover && (
                                <Image
                                  src={bot.imageHover}
                                  alt=""
                                  aria-hidden
                                  fill
                                  className="absolute inset-0 object-cover object-top opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
                                  sizes="(max-width: 768px) 128px, 160px"
                                />
                              )}
                            </div>
                          </div>
                          <p className="mt-2 text-center text-sm font-medium text-slate-700 transition-colors duration-200 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                            {bot.firstName} · {bot.name}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="max-w-xs text-center"
                      >
                        <span className="font-medium">
                          {bot.firstName} — {bot.name}
                        </span>
                        <br />
                        <span className="text-muted-foreground text-xs">
                          {bot.hoverDescription}
                        </span>
                        <p className="mt-2 pt-2 border-t border-border text-xs font-medium">
                          {bot.services.join(" · ")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                )
              )}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
