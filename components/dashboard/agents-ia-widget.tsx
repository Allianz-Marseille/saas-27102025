"use client";

import { Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ENABLE_BOB_BOT,
  ENABLE_NINA_BOT,
  ENABLE_PAULINE_BOT,
  ENABLE_SINISTRO_BOT,
} from "@/lib/assistant/config";

type BotItem = {
  name: string;
  firstName: string;
  href: string;
  image: string;
};

const BOTS: BotItem[] = [
  {
    firstName: "Nina",
    name: "Bot Secrétaire",
    href: "/commun/agents-ia/bot-secretaire",
    image: "/agents-ia/bot-secretaire/avatar-tete.jpg",
  },
  {
    firstName: "Bob",
    name: "Assistant Santé & Prévoyance",
    href: "/commun/agents-ia/bob-sante",
    image: "/agents-ia/bot-sante/bob_rit.png",
  },
  {
    firstName: "Sinistro",
    name: "Assistant Sinistres",
    href: "/commun/agents-ia/bot-sinistre",
    image: "/agents-ia/bot-sinistre/sinistro.png",
  },
  {
    firstName: "Pauline",
    name: "Produits Particuliers",
    href: "/commun/agents-ia/bot-pauline",
    image: "/agents-ia/bot-pauline/pauline.png",
  },
];

const ENABLED = [
  ENABLE_NINA_BOT,
  ENABLE_BOB_BOT,
  ENABLE_SINISTRO_BOT,
  ENABLE_PAULINE_BOT,
];

export function AgentsIAWidget() {
  const visibleBots = BOTS.filter((_, i) => ENABLED[i]);
  if (visibleBots.length === 0) return null;

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bot className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          Agents IA
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Assistants de l&apos;agence — cliquez pour ouvrir
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {visibleBots.map((bot) => (
            <Link
              key={bot.href}
              href={bot.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              aria-label={`Ouvrir ${bot.firstName}, ${bot.name}`}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 dark:border-slate-600">
                <Image
                  src={bot.image}
                  alt={bot.firstName}
                  fill
                  className="object-cover object-top"
                  sizes="48px"
                />
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {bot.firstName}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {bot.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/commun/agents-ia"
          className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voir tous les agents →
        </Link>
      </CardContent>
    </Card>
  );
}
