"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BotChat } from "@/components/chat/bot-chat";
import { getBotConfig } from "@/lib/config/agents";

export default function JohnPage() {
  const config = getBotConfig("john-coll");

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-amber-400/10 rounded-full blur-[100px] -z-10" />

      <div className="relative w-full max-w-none mx-auto py-8 px-4 lg:px-6">
        <nav
          className="flex items-center gap-2 text-sm text-slate-400 mb-6"
          aria-label="Fil d'Ariane"
        >
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <Link href="/commun/agents-ia" className="hover:text-white transition-colors">
            Agents IA
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <span className="text-orange-300 font-medium">John Collectif</span>
        </nav>

        <Link href="/commun/agents-ia" className="inline-block mb-6">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux agents
          </Button>
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-orange-500/30 flex items-center justify-center shrink-0 border-2 border-orange-500/50 text-2xl">
            🏢
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">John Collectif</h1>
            <p className="text-slate-400 text-sm">
              {config?.description ?? "Expert Santé, Prévoyance et Retraite Collectives"}
            </p>
          </div>
        </div>

        <BotChat
          botId="john-coll"
          botName={config?.name ?? "John"}
          accentColor="orange"
          className="bg-slate-900/80 border-orange-500/30 shadow-xl shadow-orange-500/5"
        />
      </div>
    </div>
  );
}
