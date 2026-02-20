"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, ChevronRight, Lock } from "lucide-react";
import { getBotConfig } from "@/lib/config/agents";

/** Bots avec page dédiée (lien cliquable) */
const BOT_IDS_ACTIFS = ["bob"] as const;

/** Bots à venir (carte affichée mais non cliquable) */
const BOT_IDS_A_VENIR = ["nina", "sinistro", "pauline"] as const;

const agentDisplay: Record<
  string,
  { image: string; color: string; glow: string; superpower: string; name: string }
> = {
  bob: {
    image: "/agents-ia/bot-sante/bob_sourit.png",
    color: "from-blue-500 via-blue-600 to-cyan-500",
    glow: "shadow-blue-500/50",
    superpower: "Expert santé et prévoyance TNS. Mutuelles, SSI, CARPIMKO, CAVEC…",
    name: "Bob",
  },
  nina: {
    image: "/agents-ia/bot-secretaire/avatar.jpg",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/50",
    superpower: "Secrétariat, plannings.",
    name: "Nina",
  },
  sinistro: {
    image: "/agents-ia/bot-sinistre/sinistro.png",
    color: "from-orange-500 to-amber-600",
    glow: "shadow-orange-500/50",
    superpower: "Sinistres IRSA, IRCA, IRSI.",
    name: "Sinistro",
  },
  pauline: {
    image: "/agents-ia/bot-pauline/pauline.png",
    color: "from-pink-500 to-rose-600",
    glow: "shadow-pink-500/50",
    superpower: "Retail, auto, MRH.",
    name: "Pauline",
  },
};

export default function AgentsIAPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-fuchsia-200">
              Mes agents IA
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Choisissez un agent pour démarrer une conversation. Chaque bot a un objectif précis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {BOT_IDS_ACTIFS.map((id) => {
              const config = getBotConfig(id);
              const disp = agentDisplay[id];
              if (!config || !disp) return null;
              return (
                <Link key={id} href={`/commun/agents-ia/${id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative text-left rounded-2xl p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-blue-500/40 transition-all shadow-xl hover:shadow-2xl cursor-pointer"
                  >
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${disp.color} mix-blend-overlay opacity-10 rounded-2xl`}
                    />
                    <div className="relative flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-600/50 shrink-0">
                        <Image
                          src={disp.image}
                          alt={config.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1">{config.name}</h3>
                        <p className="text-slate-400 text-sm mb-2">{config.description}</p>
                        <p className="text-slate-500 text-xs">{disp.superpower}</p>
                      </div>
                      <MessageCircle className="h-5 w-5 text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-blue-400/80">
                      <span>Ouvrir le chat</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
            {BOT_IDS_A_VENIR.map((id) => {
              const disp = agentDisplay[id];
              if (!disp) return null;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative text-left rounded-2xl p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 border-dashed opacity-75"
                >
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Lock className="h-3 w-3" />
                      À venir
                    </span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-600/50 shrink-0 grayscale">
                      <Image
                        src={disp.image}
                        alt={disp.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-500 mb-1">{disp.name}</h3>
                      <p className="text-slate-600 text-sm">{disp.superpower}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-slate-500 text-sm">
            D&apos;autres agents (Expert Retraite, AVAMAP) arrivent bientôt.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
