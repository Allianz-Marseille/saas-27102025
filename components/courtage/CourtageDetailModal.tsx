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
import { getTagStyle } from "./TagInput";
import { cn } from "@/lib/utils";

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
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono break-all">
          {secret && !show ? "••••••••••••" : (value || "—")}
        </span>
        {secret && value && (
          <button onClick={() => setShow((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
        {value && (
          <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
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
  const tags = item.tags ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {item.logoUrl && isUrl(item.logoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logoUrl}
                alt={item.compagnie}
                className="h-7 w-auto object-contain max-w-[80px]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            {item.compagnie}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", getTagStyle(tag))}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Infos de connexion */}
          <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
            <Row label="Identifiant" value={item.identifiant} />
            <div className="border-t" />
            <Row label="Mot de passe" value={item.password} secret />
            <div className="border-t" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lien internet</span>
              <div className="flex items-center gap-2">
                <span className="text-sm break-all">{item.internet || "—"}</span>
                {hasUrl && (
                  <a href={item.internet} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Traçabilité */}
          <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Traçabilité</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {item.qui ? <><span className="text-muted-foreground">Modifié par</span> <strong>{item.qui}</strong></> : <span className="text-muted-foreground">Aucune modification</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {item.dateModification ? <><span className="text-muted-foreground">Le</span> <strong>{item.dateModification}</strong></> : <span className="text-muted-foreground">Import initial</span>}
              </span>
            </div>
            {item.tagsUpdatedBy && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Tags mis à jour par <strong>{item.tagsUpdatedBy}</strong>
                {item.tagsUpdatedAt && <> · {item.tagsUpdatedAt}</>}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          {hasUrl ? (
            <a href={item.internet} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Ouvrir le portail
              </Button>
            </a>
          ) : <div />}
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
