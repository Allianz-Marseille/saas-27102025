"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Zap, Shield, Brain, MessageCircle } from "lucide-react";

const agents = [
  {
    name: "Bob",
    role: "L'expert prévoyance TNS",
    image: "/agents-ia/bot-tns/bob_sourit.png",
    superpower: "Décoder les mutuelles comme personne. Bientôt : vision laser pour lire les bulletins à 10 m.",
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    glow: "shadow-emerald-500/50",
    href: "/commun/agents-ia/bob",
  },
  {
    name: "Léa",
    role: "L'experte santé individuelle",
    image: "/agents-ia/lea-sante/lea.png",
    superpower: "Optique, dentaire, hospitalier ? Elle lit les tableaux de garanties mieux que votre opticien. (Et elle ne vous fera pas attendre 2h.)",
    color: "from-emerald-500 via-green-500 to-teal-500",
    glow: "shadow-emerald-500/50",
    href: "/commun/agents-ia/lea",
  },
  {
    name: "John",
    role: "L'expert des collectives",
    image: "/agents-ia/john-call/john-call.png",
    superpower: "Santé, prévoyance, retraite collective : il parle CCN et effectifs comme personne. Prochaine feature : négocier les PER en dormant.",
    color: "from-amber-500 via-orange-500 to-rose-500",
    glow: "shadow-amber-500/50",
    href: "/commun/agents-ia/john",
  },
  {
    name: "Sinistro",
    role: "Le spécialiste sinistres",
    image: "/agents-ia/bot-sinistre/sinistro.png",
    superpower: "IRSA, IRCA, IRSI ? Child's play. Prochaine mise à jour : télépathie avec les assureurs.",
    color: "from-amber-500 via-orange-500 to-red-500",
    glow: "shadow-amber-500/50",
    href: null,
  },
  {
    name: "Pauline",
    role: "La reine du retail",
    image: "/agents-ia/bot-pauline/pauline.png",
    superpower: "Auto, MRH, tout ça. Bientôt elle vendra des contrats en dormant. (Non, on plaisante. Ou pas.)",
    color: "from-violet-500 via-purple-500 to-indigo-500",
    glow: "shadow-violet-500/50",
    href: null,
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Fond futuriste : grille + gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[80px] -z-10" />

      <div className="relative container mx-auto py-12 px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Mise à jour en cours...
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-200">
              Nos agents IA sont en formation
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Bob, Léa, John, Sinistro et Pauline ont été envoyés en stage intensif
              <span className="text-violet-400 font-semibold"> « Super-pouvoirs niveau 2.0 »</span>.
              Ils reviennent bientôt, plus puissants que jamais. Promis, on a vérifié les fusibles.
            </p>
          </motion.div>

          {/* Cartes agents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const CardContent = (
                <div
                  className={`
                    relative overflow-hidden rounded-2xl p-6
                    bg-slate-900/60 backdrop-blur-xl border
                    border-slate-700/50 hover:border-violet-500/40
                    transition-all duration-500 hover:scale-[1.02]
                    ${agent.glow} hover:shadow-2xl
                  `}
                >
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${agent.color} mix-blend-overlay opacity-10 rounded-2xl`}
                  />
                  <div className="relative flex gap-6 items-start">
                    <div className="relative shrink-0">
                      <div
                        className={`w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-600/50 group-hover:border-violet-400/50 transition-colors shadow-xl ${agent.glow}`}
                      >
                        <Image
                          src={agent.image}
                          alt={agent.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${agent.color} opacity-0 group-hover:opacity-20 blur-xl rounded-2xl transition-opacity duration-500`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {agent.name}
                      </h3>
                      <p className={`text-sm font-medium bg-gradient-to-r ${agent.color} bg-clip-text text-transparent mb-3`}>
                        {agent.role}
                      </p>
                      <p className="text-slate-400 text-sm leading-relaxed">
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
                  className="group relative"
                >
                  {agent.href ? (
                    <Link href={agent.href} className="block">
                      {CardContent}
                    </Link>
                  ) : (
                    CardContent
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* CTA humoristique */}
          <motion.div
            variants={itemVariants}
            className="text-center p-8 rounded-2xl bg-slate-900/40 border border-slate-700/50 backdrop-blur-sm"
          >
            <p className="text-slate-400 text-lg mb-4">
              En attendant, continuez à faire comme d&apos;habitude. Ou profitez pour prendre un café.
              On dit que ça aide à patienter.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Brain className="h-4 w-4" />
                Neurones en surchauffe
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Zap className="h-4 w-4" />
                Circuits en upgrade
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Shield className="h-4 w-4" />
                Super-pouvoirs en test
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
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
