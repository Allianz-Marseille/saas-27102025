"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, ChevronRight } from "lucide-react";
import { BOTS, getBotConfig } from "@/lib/config/agents";
import { BotChat } from "@/components/chat/bot-chat";

const AVAILABLE_BOT_IDS = ["bob"] as const;

const agentDisplay: Record<
  string,
  { image: string; color: string; glow: string; superpower: string }
> = {
  bob: {
    image: "/agents-ia/bot-sante/bob_sourit.png",
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    glow: "shadow-emerald-500/50",
    superpower: "Expert santé et prévoyance TNS. Mutuelles, SSI, CARPIMKO, CAVEC…",
  },
};

export default function AgentsIAPage() {
  const router = useRouter();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  const availableBots = AVAILABLE_BOT_IDS.map((id) => getBotConfig(id)).filter(Boolean);
  const selectedConfig = selectedBotId ? getBotConfig(selectedBotId) : null;
  const display = selectedBotId ? agentDisplay[selectedBotId] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

      <div className="relative container mx-auto py-12 px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => (selectedBotId ? setSelectedBotId(null) : router.back())}
          className="mb-8 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {selectedBotId ? "Retour aux agents" : "Retour"}
        </Button>

        <AnimatePresence mode="wait">
          {!selectedBotId ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                {availableBots.map((bot) => {
                  const disp = agentDisplay[bot.id];
                  if (!disp) return null;
                  return (
                    <motion.button
                      key={bot.id}
                      type="button"
                      onClick={() => setSelectedBotId(bot.id)}
                      className="group relative text-left rounded-2xl p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-emerald-500/40 transition-all hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                    >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${disp.color} mix-blend-overlay opacity-10 rounded-2xl`} />
                      <div className="relative flex gap-4 items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-600/50 shrink-0">
                          <Image
                            src={disp.image}
                            alt={bot.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-1">{bot.name}</h3>
                          <p className="text-slate-400 text-sm mb-2">{bot.description}</p>
                          <p className="text-slate-500 text-xs">{disp.superpower}</p>
                        </div>
                        <MessageCircle className="h-5 w-5 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-emerald-400/80">
                        <span>Ouvrir le chat</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {Object.keys(BOTS).length < 4 && (
                <p className="text-center text-slate-500 text-sm">
                  D&apos;autres agents (Nina, Sinistro, Pauline) arrivent bientôt.
                </p>
              )}
            </motion.div>
          ) : selectedConfig && display ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-600/50 shrink-0">
                  <Image
                    src={display.image}
                    alt={selectedConfig.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedConfig.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedConfig.description}</p>
                </div>
              </div>
              <BotChat
                botId={selectedConfig.id}
                botName={selectedConfig.name}
                className="bg-slate-900/80 border-slate-700/50"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
