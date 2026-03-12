"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ExternalLink, Calendar, User, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Courtage } from "@/types/courtage";

interface CourtageDetailModalProps {
  item: Courtage | null;
  open: boolean;
  onClose: () => void;
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function Row({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copié !");
  };

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono break-all">
          {secret && !show ? "••••••••••••" : (value || "—")}
        </span>
        {secret && value && (
          <button
            onClick={() => setShow((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        {value && (
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function CourtageDetailModal({ item, open, onClose }: CourtageDetailModalProps) {
  if (!item) return null;

  const hasUrl = item.internet && isUrl(item.internet);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.compagnie}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Infos principales */}
          <div className="rounded-lg border p-4 space-y-3">
            <Row label="Identifiant" value={item.identifiant} />
            <div className="border-t" />
            <Row label="Mot de passe" value={item.password} secret />
            <div className="border-t" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lien internet
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm break-all">{item.internet || "—"}</span>
                {hasUrl && (
                  <a
                    href={item.internet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Traçabilité */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Traçabilité
            </p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {item.qui ? (
                  <span>Modifié par <strong>{item.qui}</strong></span>
                ) : (
                  <span className="text-muted-foreground">Aucune modification</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {item.dateModification ? (
                  <span>Le <strong>{item.dateModification}</strong></span>
                ) : (
                  <span className="text-muted-foreground">Import initial</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
