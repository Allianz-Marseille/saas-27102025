"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Zap, Shield, Brain, MessageCircle } from "lucide-react";
import { getBotConfig } from "@/lib/config/agents";

type StatusVariant = "ok" | "enCours" | "ko";

const statusStyles: Record<
  StatusVariant,
  { label: string; className: string }
> = {
  ok: {
    label: "Ok, on y va !",
    className:
      "bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/30",
  },
  enCours: {
    label: "En cours",
    className:
      "bg-amber-500/90 text-white border-amber-400/50 shadow-amber-500/30",
  },
  ko: {
    label: "KO pour le moment",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const agentsBots = [
  {
    name: "Bob TNS",
    role: "Expert en prévoyance",
    image: "/agents-ia/bot-tns/bob_sourit.png",
    superpower: "Décoder les mutuelles comme personne. Bientôt : vision laser pour lire les bulletins à 10 m.",
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    glow: "shadow-emerald-500/50",
    href: "/commun/agents-ia/bob",
    status: "ok" as StatusVariant,
  },
  {
    name: "Léa",
    role: "L'experte santé individuelle",
    image: "/agents-ia/lea-sante/lea.png",
    superpower: "Optique, dentaire, hospitalier ? Elle lit les tableaux de garanties mieux que votre opticien. (Et elle ne vous fera pas attendre 2h.)",
    color: "from-emerald-500 via-green-500 to-teal-500",
    glow: "shadow-emerald-500/50",
    href: "/commun/agents-ia/lea",
    status: "ko" as StatusVariant,
  },
  {
    name: "John",
    role: "L'expert des collectives",
    image: "/agents-ia/john-call/john-call.png",
    superpower: "Santé, prévoyance, retraite collective : il parle CCN et effectifs comme personne. Prochaine feature : négocier les PER en dormant.",
    color: "from-amber-500 via-orange-500 to-rose-500",
    glow: "shadow-amber-500/50",
    href: "/commun/agents-ia/john",
    status: "ko" as StatusVariant,
  },
  {
    name: "Sinistro",
    role: "Le spécialiste sinistres",
    image: "/agents-ia/bot-sinistre/sinistro.png",
    superpower: "IRSA, IRCA, IRSI ? Child's play. Prochaine mise à jour : télépathie avec les assureurs.",
    color: "from-amber-500 via-orange-500 to-red-500",
    glow: "shadow-amber-500/50",
    href: null,
    status: "enCours" as StatusVariant,
  },
];

const inspecteursIA = [
  {
    name: "Dédé",
    role: "Le pro artisans, commerçants et professions libérales",
    image: "/agents-ia/bot-dede-le-pro/dede.png",
    imagePosition: "object-[50%_35%]",
    superpower: "Spécialisé sur les marchés du professionnel : artisans, commerçants et professions libérales.",
    color: "from-slate-500 via-blue-500 to-indigo-500",
    glow: "shadow-slate-500/50",
    href: "/commun/agents-ia/dede",
    status: "ko" as StatusVariant,
  },
  {
    name: "Pauline",
    role: "La reine du retail",
    image: "/agents-ia/bot-pauline/pauline.png",
    superpower: "Auto, MRH, tout ça. Bientôt elle vendra des contrats en dormant. (Non, on plaisante. Ou pas.)",
    color: "from-violet-500 via-purple-500 to-indigo-500",
    glow: "shadow-violet-500/50",
    href: null,
    status: "ko" as StatusVariant,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function AgentsIAPage() {
  const router = useRouter();
  const visibleBots = agentsBots.filter(
    (a) => !(a.href === "/commun/agents-ia/bob" && getBotConfig("bob")?.inTestMode)
  );

  const renderAgentCard = (agent: (typeof agentsBots)[0] | (typeof inspecteursIA)[0]) => {
    const status = (agent as { status?: StatusVariant }).status ?? "ko";
    const style = statusStyles[status];
    const CardContent = (
      <div
        className={`
          relative overflow-hidden rounded-2xl p-6 h-full flex flex-col
          bg-card backdrop-blur-xl border border-border
          hover:border-violet-500/40 transition-all duration-500 hover:scale-[1.02]
          ${agent.glow} hover:shadow-2xl
        `}
      >
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ${style.className}`}
          aria-label={`État : ${style.label}`}
        >
          {style.label}
        </span>
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${agent.color} mix-blend-overlay opacity-10 rounded-2xl`}
        />
        <div className="relative flex gap-6 items-start flex-1 min-h-0">
          <div className="relative shrink-0">
            <div
              className={`w-24 h-24 rounded-2xl overflow-hidden border-2 border-border group-hover:border-violet-400/50 transition-colors shadow-xl ${agent.glow}`}
            >
              <Image
                src={agent.image}
                alt={agent.name}
                width={96}
                height={96}
                className={`w-full h-full object-cover ${(agent as { imagePosition?: string }).imagePosition ?? ""}`}
              />
            </div>
            <div
              className={`absolute -inset-1 bg-gradient-to-r ${agent.color} opacity-0 group-hover:opacity-20 blur-xl rounded-2xl transition-opacity duration-500`}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {agent.name}
            </h3>
            <p className={`text-sm font-medium bg-gradient-to-r ${agent.color} bg-clip-text text-transparent mb-3`}>
              {agent.role}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
              {agent.superpower}
            </p>
          </div>
        </div>
      </div>
    );
    return (
      <motion.div
        key={agent.name}
        variants={itemVariants}
        className="group relative h-full"
      >
        {agent.href ? (
          <Link href={agent.href} className="block h-full">
            {CardContent}
          </Link>
        ) : (
          CardContent
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fond : grille + gradients (thème-aware) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[80px] -z-10" />

      <div className="relative container mx-auto py-12 px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Mise à jour en cours...
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground via-violet-600 to-fuchsia-600 dark:from-white dark:via-violet-200 dark:to-fuchsia-200">
              Nos agents IA sont en formation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Bob, Léa, John, Sinistro et Pauline ont été envoyés en stage intensif
              <span className="text-violet-600 dark:text-violet-400 font-semibold"> « Super-pouvoirs niveau 2.0 »</span>.
              Ils reviennent bientôt, plus puissants que jamais. Promis, on a vérifié les fusibles.
            </p>
          </motion.div>

          {/* Section 1 : les 4 bots */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {visibleBots.map((agent) => renderAgentCard(agent))}
            </div>
          </div>

          {/* Section 2 : Mes inspecteurs IA (Pauline, Dédé) */}
          <div className="space-y-6">
            <motion.h2
              variants={itemVariants}
              className="text-2xl md:text-3xl font-bold text-foreground border-b border-border pb-3"
            >
              Mes inspecteurs IA
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {inspecteursIA.map((agent) => renderAgentCard(agent))}
            </div>
          </div>

          {/* CTA humoristique */}
          <motion.div
            variants={itemVariants}
            className="text-center p-8 rounded-2xl bg-card border border-border backdrop-blur-sm"
          >
            <p className="text-muted-foreground text-lg mb-4">
              En attendant, continuez à faire comme d&apos;habitude. Ou profitez pour prendre un café.
              On dit que ça aide à patienter.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                Neurones en surchauffe
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                Circuits en upgrade
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Super-pouvoirs en test
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                Blagues en préparation
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
