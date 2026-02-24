"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BotChat } from "@/components/chat/bot-chat";
import { RouteGuard } from "@/components/auth/route-guard";
import { getBotConfig } from "@/lib/config/agents";

export default function LeaPage() {
  const config = getBotConfig("lea");

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-emerald-400/10 rounded-full blur-[100px] -z-10" />

      <div className="relative w-full max-w-none mx-auto py-8 px-4 lg:px-6">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          aria-label="Fil d'Ariane"
        >
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link href="/commun/agents-ia" className="hover:text-foreground transition-colors">
            Agents IA
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-emerald-600 dark:text-emerald-300 font-medium">Léa Santé</span>
        </nav>

        <Link href="/commun/agents-ia" className="inline-block mb-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux agents
          </Button>
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0 border-2 border-emerald-500/50 text-2xl">
            🌿
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Léa Santé</h1>
            <p className="text-muted-foreground text-sm">
              {config?.description ?? "Expert Santé Individuelle"}
            </p>
          </div>
        </div>

        <BotChat
          botId="lea"
          botName={config?.name ?? "Léa"}
          accentColor="emerald"
          className="bg-card border border-emerald-500/30 shadow-xl shadow-emerald-500/5"
        />
      </div>
      </div>
    </RouteGuard>
  );
}
