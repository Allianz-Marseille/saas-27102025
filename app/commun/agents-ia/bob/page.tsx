"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BotChat, type QuickReply } from "@/components/chat/bot-chat";
import { RouteGuard } from "@/components/auth/route-guard";
import { getBotConfig } from "@/lib/config/agents";

const BOB_AVATAR = "/agents-ia/bot-tns/bob_sourit.png";

const BOB_QUICK_REPLIES_LEVEL1: QuickReply[] = [
  { label: "Bonjour", message: "Bonjour" },
  {
    label: "J'ai une question sur la SSI",
    message:
      "J'ai une question sur la SSI. Demande-moi de quoi j'ai besoin : un résumé, une explication générale, ou un point précis ?",
  },
  {
    label: "Sur un régime obligatoire",
    message:
      "Je veux savoir quel régime obligatoire s'applique. Demande-moi le métier du client, puis donne-moi le nom du RO et demande ce que je souhaite savoir (résumé, explication générale, point précis).",
  },
  {
    label: "C'est quoi la loi Madelin",
    message:
      "C'est quoi la loi Madelin ? Explique-moi la déductibilité des cotisations prévoyance pour les TNS et l'impact sur l'effort net.",
  },
];

const BOB_QUICK_REPLIES_LEVEL2: QuickReply[] = [
  {
    label: "Je veux faire une étude pour un TNS",
    message:
      "Je veux faire une étude pour un TNS. Lance tes questions pas à pas pour collecter les données.",
  },
  {
    label: "Coller l'image Lagon (CRM)",
    message:
      "Je vais coller une capture de la fiche Lagon. Quand je l'envoie : repère tous les éléments exploitables pour ton workflow (8 points), demande-moi de valider ce que tu as compris, puis pose uniquement les questions dont tu n'as pas la réponse.",
  },
  {
    label: "Téléverser liasse fiscale",
    message:
      "Je vais téléverser la liasse fiscale (PDF). Quand je l'envoie : repère tous les éléments exploitables, demande-moi de valider ce que tu as compris, puis pose uniquement les questions dont tu n'as pas la réponse.",
  },
];

function BobPageContent() {
  const config = getBotConfig("bob");
  const inTestMode = config?.inTestMode === true;

  const pageContent = (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-blue-400/10 rounded-full blur-[100px] -z-10" />

      <div className="relative container mx-auto py-8 px-4 max-w-2xl">
        {/* Fil d'Ariane */}
        <nav
          className="flex items-center gap-2 text-sm text-slate-400 mb-6"
          aria-label="Fil d'Ariane"
        >
          <Link
            href="/dashboard"
            className="hover:text-white transition-colors"
          >
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <Link
            href={inTestMode ? "/admin/test-bots" : "/commun/agents-ia"}
            className="hover:text-white transition-colors"
          >
            {inTestMode ? "Test des Bots" : "Agents IA"}
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <span className="text-blue-300 font-medium">Bob Santé</span>
        </nav>

        {/* Bouton Retour */}
        <Link
          href={inTestMode ? "/admin/test-bots" : "/commun/agents-ia"}
          className="inline-block mb-6"
        >
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {inTestMode ? "Retour au test des bots" : "Retour aux agents"}
          </Button>
        </Link>

        {/* Header Bob */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-500/50 shrink-0 shadow-lg shadow-blue-500/20">
            <Image
              src={BOB_AVATAR}
              alt={config?.name ?? "Bob"}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bob Santé</h1>
            <p className="text-slate-400 text-sm">
              {config?.description ?? "Expert santé et prévoyance TNS"}
            </p>
          </div>
        </div>

        {/* Chat — identité bleue, boutons d'accroche niveau 1 (Bonjour, SSI, RO, Madelin) et niveau 2 (Lagon, Liasse, Questions) */}
        <BotChat
          botId="bob"
          botName={config?.name ?? "Bob"}
          accentColor="blue"
          className="bg-slate-900/80 border-blue-500/30 shadow-xl shadow-blue-500/5"
          quickRepliesLevel1={BOB_QUICK_REPLIES_LEVEL1}
          quickRepliesLevel2={BOB_QUICK_REPLIES_LEVEL2}
          bonjourTriggerMessage="Bonjour"
        />
      </div>
    </div>
  );

  if (inTestMode) {
    return (
      <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>{pageContent}</RouteGuard>
    );
  }

  return pageContent;
}

export default function BobPage() {
  return <BobPageContent />;
}
