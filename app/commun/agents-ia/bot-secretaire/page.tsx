"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * Page Nina — Bot Secrétaire (fullscreen).
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 * Route : /commun/agents-ia/bot-secretaire
 */
export default function BotSecretairePage() {
  const [hasStarted, setHasStarted] = useState(false);

  const handleBonjour = () => {
    setHasStarted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Barre fixe : Retour + titre */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/commun/agents-ia" aria-label="Retour aux agents IA">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Nina — Bot Secrétaire
        </h1>
      </header>

      {/* Zone conversation : écran d'accueil ou fil de messages */}
      <main className="flex flex-1 flex-col overflow-auto">
        {!hasStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-emerald-500/30 shadow-md md:h-40 md:w-40">
              <Image
                src="/agents-ia/bot-secretaire/avatar-tete.jpg"
                alt="Nina, votre assistante secrétaire"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 128px, 160px"
                priority
              />
            </div>
            <p className="max-w-sm text-center text-slate-600 dark:text-slate-400">
              Je suis Nina, votre assistante secrétaire.
            </p>
            <Button
              size="lg"
              onClick={handleBonjour}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Bonjour
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {/* Message d'accueil Nina après clic Bonjour */}
            <div className="flex gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-emerald-500/30">
                <Image
                  src="/agents-ia/bot-secretaire/avatar-tete.jpg"
                  alt="Nina"
                  fill
                  className="object-cover object-top"
                  sizes="40px"
                />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Bonjour ! Je suis Nina, votre assistante. Que puis-je faire pour vous aujourd&apos;hui ?
                </p>
              </div>
            </div>
            {/* Placeholder zone saisie / chat à venir (Phase 2) */}
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Zone de conversation et saisie — à venir (Phase 2).
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
