"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function BotSecretairePage() {
  return (
    <div className="flex min-h-[60vh] flex-col space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/commun/agents-ia" aria-label="Retour aux agents IA">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Nina — Bot Secrétaire
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 dark:border-slate-700 dark:bg-slate-800/30">
        <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 md:h-64 md:w-64">
          <Image
            src="/agents-ia/bot-secretaire/avatar.jpg"
            alt="Nina, Bot Secrétaire"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 192px, 256px"
            priority
          />
        </div>
        <p className="max-w-md text-center text-sm text-slate-500 dark:text-slate-400">
          Rédaction, préparation de mails, correction… Les fonctionnalités du
          Bot Secrétaire seront développées dans un prochain temps.
        </p>
      </div>
    </div>
  );
}
