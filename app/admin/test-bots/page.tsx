"use client";

import Image from "next/image";
import Link from "next/link";
import { getBotsInTestMode, getBotConfig } from "@/lib/config/agents";
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";

const BOT_TEST_CARDS: Record<
  string,
  { role: string; superpower: string; image: string; color: string }
> = {
  bob: {
    role: "L'expert prévoyance TNS",
    superpower:
      "Décoder les mutuelles, SSI, régimes obligatoires. Vision pour lire captures Lagon et liasses.",
    image: "/agents-ia/bot-tns/bob_sourit.png",
    color: "from-blue-500 via-cyan-500 to-teal-500",
  },
};

export default function TestBotsPage() {
  const botsInTest = getBotsInTestMode();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test des Bots</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Bots en phase de validation. Accessible uniquement aux administrateurs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {botsInTest.map((botId) => {
          const config = getBotConfig(botId);
          const cardData = BOT_TEST_CARDS[botId];
          const href = botId === "bob" ? "/commun/agents-ia/bob" : null;

          if (!config || !cardData || !href) return null;

          return (
            <Link key={botId} href={href} className="block group">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-blue-400/50">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500/50">
                      <Image
                        src={cardData.image}
                        alt={config.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          En test
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mt-1">{config.name}</h3>
                      <p
                        className={`text-sm font-medium bg-gradient-to-r ${cardData.color} bg-clip-text text-transparent`}
                      >
                        {cardData.role}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {cardData.superpower}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {botsInTest.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun bot en phase de test pour le moment.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
