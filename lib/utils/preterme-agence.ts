// @ts-nocheck
import type { AgenceCode } from "@/types/preterme";

/** Détecte l'agence à partir du nom de fichier (H91358 ou H92083). */
export function detectAgenceFromFilename(filename: string): AgenceCode | null {
  if (filename.includes("H91358") || filename.includes("h91358")) return "H91358";
  if (filename.includes("H92083") || filename.includes("h92083")) return "H92083";
  return null;
}
