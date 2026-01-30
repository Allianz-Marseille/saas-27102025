"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Page Mentions légales — accessible depuis le bandeau Bob et autres.
 * Contenu à compléter selon les obligations légales de l'agence.
 */
export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Button variant="ghost" size="icon" asChild className="mb-6">
        <Link href="/commun/agents-ia" aria-label="Retour aux agents IA">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Mentions légales
      </h1>
      <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400">
        <p>
          Bob et les autres assistants IA intégrés à cette application sont des outils d&apos;aide à la décision.
          Les réponses générées ne constituent pas un conseil juridique, fiscal ou médical personnalisé.
        </p>
        <p>
          Contenu à compléter selon les obligations légales de l&apos;agence (éditeur, hébergeur, données personnelles, cookies, etc.).
        </p>
      </div>
    </div>
  );
}
