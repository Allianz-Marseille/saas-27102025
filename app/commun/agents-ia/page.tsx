"use client";

import { Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentsIAPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
          <Bot className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Agents IA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Accédez aux assistants intelligents de l&apos;agence
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100">
            Espace Agents IA
          </CardTitle>
          <CardDescription>
            Cette page sera enrichie avec les différents agents et parcours IA à votre disposition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/30">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Contenu à venir
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
