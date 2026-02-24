"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { BotChat, type QuickReply } from "@/components/chat/bot-chat";
import { getBotConfig } from "@/lib/config/agents";

const SINISTRO_AVATAR = "/agents-ia/bot-sinistre/sinistro.png";

const SINISTRO_QUICK_REPLIES_LEVEL1: QuickReply[] = [
  { label: "Bonjour", message: "Bonjour" },
  {
    label: "Qui gère et qui paie en auto ? (IRSA/IDA)",
    message:
      "Qui est l'assureur gestionnaire pour un sinistre auto matériel ? Explique-moi IRSA et IDA (qui indemnise, qui fait le recours).",
  },
  {
    label: "Dégâts des eaux : IRSI ou CIDE-COP ?",
    message:
      "Pour des dégâts des eaux en immeuble, comment savoir si on est en IRSI (tranche 1 ou 2) ou en CIDE-COP ? Donne-moi les seuils et qui gère.",
  },
  {
    label: "Convention vs droit du client",
    message:
      "Quelle est la différence entre les conventions inter-assurances (IRSA, IRSI, etc.) et le droit du client à être indemnisé ? Les conventions sont-elles opposables au client ?",
  },
  {
    label: "Cas complexe / hors convention",
    message:
      "J'ai un cas complexe (étranger, constat contesté, litige majeur). Aide-moi à qualifier si on est hors convention et à formuler une escalade vers un expert.",
  },
];

const SINISTRO_QUICK_REPLIES_LEVEL2: QuickReply[] = [
  {
    label: "Analyser un constat amiable",
    message:
      "Je veux analyser un constat amiable auto. Je peux te donner les cases cochées (1 à 17) pour A et B, ou envoyer une photo. Dis-moi le cas IRSA, l'assureur gestionnaire et le recours.",
  },
  {
    label: "Qualifier un sinistre (type, montant, lieu)",
    message:
      "Je veux qualifier un sinistre. Je te donne le type (auto matériel, auto corporel, dégâts des eaux, incendie, pro/RC), le montant estimé si habitation, et la localisation. Dis-moi la convention, l'assureur gestionnaire et si recours.",
  },
  {
    label: "Glossaire et conventions",
    message:
      "Donne-moi un résumé des conventions (IRSA, IDA, IRCA, PAOS, IRSI, CIDE-COP, CID-PIV, CRAC) et dans quels cas chacune s'applique.",
  },
  {
    label: "Escalade expert sinistres",
    message:
      "Le dossier est ambigu ou hors convention. Donne-moi un résumé court en 5 blocs + une proposition d'escalade vers un gestionnaire senior.",
  },
];

function SinistroPageContent() {
  const config = getBotConfig("sinistro");
  const inTestMode = config?.inTestMode === true;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(251,146,60,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,146,60,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-amber-400/10 rounded-full blur-[100px] -z-10" />

      <div className="relative w-full max-w-none mx-auto py-8 px-4 lg:px-6">
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
          <span className="text-orange-600 dark:text-orange-300 font-medium">
            Sinistro
          </span>
        </nav>

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

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-orange-500/50 shrink-0 shadow-lg shadow-orange-500/20">
            <Image
              src={SINISTRO_AVATAR}
              alt={config?.name ?? "Sinistro"}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sinistro</h1>
            <p className="text-muted-foreground text-sm">
              {config?.description ?? "Expert gestion & analyse de sinistres"}
            </p>
          </div>
        </div>

        <BotChat
          botId="sinistro"
          botName={config?.name ?? "Sinistro"}
          accentColor="orange"
          className="bg-card border border-orange-500/30 dark:border-orange-500/30 shadow-xl shadow-orange-500/5"
          quickRepliesLevel1={SINISTRO_QUICK_REPLIES_LEVEL1}
          quickRepliesLevel2={SINISTRO_QUICK_REPLIES_LEVEL2}
          bonjourTriggerMessage="Bonjour"
          inputPlaceholderSubtitle="Expert gestion & analyse de sinistres"
        />
      </div>
    </div>
  );
}

export default function SinistroPage() {
  return <SinistroPageContent />;
}
