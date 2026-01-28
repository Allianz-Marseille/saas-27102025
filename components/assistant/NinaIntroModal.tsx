"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NinaIntroModalProps {
  open: boolean;
  onClose: () => void;
  /** Appelé après onClose quand l'utilisateur clique sur "Démarrer avec Nina" (ex. navigation vers Nina). */
  onCtaClick?: () => void;
}

export function NinaIntroModal({ open, onClose, onCtaClick }: NinaIntroModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        aria-describedby="nina-intro-description"
      >
        <DialogHeader className="flex flex-row items-start gap-3 sm:flex-row">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-emerald-500/30">
            <Image
              src="/agents-ia/bot-secretaire/avatar-tete.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Nina — Votre assistante secrétaire
            </DialogTitle>
            <DialogDescription
              id="nina-intro-description"
              className="text-sm text-slate-600 dark:text-slate-400"
            >
              Nina est votre assistante secrétaire intelligente. Elle vous aide
              au quotidien pour la rédaction, l’analyse de documents et
              l’organisation de vos tâches administratives — avec un ton
              professionnel et une réponse immédiate.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
              Ce qu’elle fait pour vous
            </h3>
            <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Rédaction
                </strong>{" "}
                : emails professionnels, courriers, comptes rendus et notes de
                synthèse à partir de vos brouillons.
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Correction
                </strong>{" "}
                : orthographe et amélioration du style de vos textes.
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Documents
                </strong>{" "}
                : résumés de PDF, extraction d’informations à partir de captures
                d’écran ou de fichiers (Word, Excel, etc.).
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Formatage
                </strong>{" "}
                : mise en forme claire — listes, titres, tableaux — pour des
                livrables prêts à l’emploi.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
              Fonctionnalités de l’interface
            </h3>
            <ul className="list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Chat en direct
                </strong>{" "}
                : réponses en temps réel (streaming), avec indicateur « Nina
                écrit… ».
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Pièces jointes
                </strong>{" "}
                : envoi d’images (Ctrl+V ou Cmd+V), de PDF, Word, Excel, TXT,
                CSV — jusqu’à 10 fichiers par message.
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Copier / exporter
                </strong>{" "}
                : copie d’une réponse en un clic ; export en PDF (réponse ou
                conversation).
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Brouillon
                </strong>{" "}
                : panneau dédié pour déposer un texte, l’éditer, le copier ou
                l’exporter en PDF.
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Actions rapides
                </strong>{" "}
                : « Mettre dans le brouillon », « Transformer en mail », «
                Résumer en 3 points » sur chaque réponse longue.
              </li>
              <li>
                <strong className="text-slate-700 dark:text-slate-300">
                  Sécurité
                </strong>{" "}
                : option pour masquer les données sensibles (IBAN, email,
                téléphone) avant copie ou export.
              </li>
            </ul>
          </section>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onClose();
              onCtaClick?.();
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            aria-label="Démarrer avec Nina"
          >
            Démarrer avec Nina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
