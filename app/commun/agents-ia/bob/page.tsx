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
    label: "Quelle différence entre SSI et sécurité sociale pour un TNS ?",
    message:
      "Quelle est la différence entre la SSI et la sécurité sociale pour un TNS ?",
  },
  {
    label: "J'ai besoin d'infos sur un RO",
    message:
      "J'ai besoin d'infos sur un régime obligatoire. Demande-moi le métier du client, puis donne-moi le nom du RO et ce que je souhaite savoir (résumé, explication générale, point précis).",
  },
  {
    label: "C'est quoi la loi Madelin",
    message:
      "C'est quoi la loi Madelin ? Explique-moi la déductibilité des cotisations prévoyance pour les TNS et l'impact sur l'effort net.",
  },
];

const BOB_QUICK_REPLIES_LEVEL2: QuickReply[] = [
  {
    label: "Je veux faire une étude pour un TNS et répondre à tes questions",
    message:
      "Je veux faire une étude pour un TNS et répondre à tes questions. Lance tes questions pas à pas (ordre strict : Identité, Âge, Famille, Métier, Revenu & Besoin, Frais Généraux). Une question courte à la fois, extraction combinée, ne jamais redemander ce qui a été cité.",
  },
  {
    label: "Coller l'image Lagon (CRM)",
    message:
      "Je vais coller une capture de la fiche Lagon. Quand je l'envoie : repère tous les éléments exploitables pour ton workflow (6 points), demande-moi de valider ce que tu as compris, puis pose uniquement les questions pour les points manquants, dans l'ordre 1 à 6.",
  },
  {
    label: "Téléverser une liasse fiscale",
    message:
      "Je vais téléverser la liasse fiscale (PDF). Quand je l'envoie : repère tous les éléments exploitables (6 points), demande-moi de valider ce que tu as compris, puis pose uniquement les questions pour les points manquants, dans l'ordre 1 à 6.",
  },
];

function BobPageContent() {
  const config = getBotConfig("bob");
  const inTestMode = config?.inTestMode === true;

  const pageContent = (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-blue-400/10 rounded-full blur-[100px] -z-10" />

      <div className="relative w-full max-w-none mx-auto py-8 px-4 lg:px-6">
        {/* Fil d'Ariane */}
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          aria-label="Fil d'Ariane"
        >
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link
            href={inTestMode ? "/admin/test-bots" : "/commun/agents-ia"}
            className="hover:text-foreground transition-colors"
          >
            {inTestMode ? "Test des Bots" : "Agents IA"}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-blue-600 dark:text-blue-300 font-medium">Bob TNS</span>
        </nav>

        {/* Bouton Retour */}
        <Link
          href={inTestMode ? "/admin/test-bots" : "/commun/agents-ia"}
          className="inline-block mb-6"
        >
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
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
            <h1 className="text-2xl font-bold text-foreground">Bob TNS</h1>
            <p className="text-muted-foreground text-sm">
              {config?.description ?? "Expert en prévoyance"}
            </p>
          </div>
        </div>

        {/* Chat — identité bleue, boutons d'accroche niveau 1 (Bonjour, SSI, RO, Madelin) et niveau 2 (Lagon, Liasse, Questions) */}
        <BotChat
          botId="bob"
          botName={config?.name ?? "Bob TNS"}
          accentColor="blue"
          className="bg-card border border-blue-500/30 dark:border-blue-500/30 shadow-xl shadow-blue-500/5"
          quickRepliesLevel1={BOB_QUICK_REPLIES_LEVEL1}
          quickRepliesLevel2={BOB_QUICK_REPLIES_LEVEL2}
          bonjourTriggerMessage="Bonjour"
          inputPlaceholderSubtitle="Expert en prévoyance"
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
