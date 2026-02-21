"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BotChat } from "@/components/chat/bot-chat";
import { FlaskConical } from "lucide-react";

const BOB_AVATAR = "/agents-ia/bot-sante/bob_sourit.png";

export default function TestBotsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test des Bots</h1>
        <p className="text-muted-foreground mt-1">
          Interface de test des agents IA pour les administrateurs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Environnement de test
          </CardTitle>
          <CardDescription>
            Cette page est réservée aux administrateurs pour tester les bots.
            Migration vers Gemini en cours — le chat retourne un message d&apos;attente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Chat de test (Bob). Les réponses seront fournies par Gemini après migration.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-500/50 shrink-0 shadow-lg">
              <Image
                src={BOB_AVATAR}
                alt="Bob test"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">Bob test</h3>
              <p className="text-sm text-muted-foreground">
                Expert santé et prévoyance TNS — migration Gemini
              </p>
            </div>
          </div>
          <BotChat
            botId="bob"
            botName="Bob test"
            accentColor="blue"
            className="bg-slate-900/80 border-blue-500/30 shadow-xl"
          />
        </CardContent>
      </Card>
    </div>
  );
}
