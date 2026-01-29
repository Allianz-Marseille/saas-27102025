"use client";

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

export default function AgentsIAPage() {
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
            Cliquez sur un agent pour ouvrir sa page. Les fonctionnalités seront
            enrichies progressivement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="flex flex-wrap gap-6">
              <Link
                href={BOT_SECRETAIRE.href}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-xl"
                aria-label={`Ouvrir ${BOT_SECRETAIRE.firstName}, ${BOT_SECRETAIRE.name}`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 md:h-40 md:w-40">
                      <Image
                        src={BOT_SECRETAIRE.image}
                        alt={BOT_SECRETAIRE.name}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 128px, 160px"
                      />
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
                    {BOT_SECRETAIRE.hoverDescription}
                  </TooltipContent>
                </Tooltip>
                <p className="mt-2 text-center text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">
                  {BOT_SECRETAIRE.firstName} · {BOT_SECRETAIRE.name}
                </p>
                <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  {BOT_SECRETAIRE.services.join(" · ")}
                </p>
              </Link>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
