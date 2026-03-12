/**
 * POST /api/admin/courtage/suggest-tags
 *
 * Analyse le nom + URL d'une compagnie avec Gemini et suggère des tags pertinents.
 * Réservé aux ADMINISTRATEUR.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { GoogleGenAI } from "@google/genai";

const REFERENCE_TAGS = [
  "jeune conducteur", "malussé", "flotte auto", "camping-car", "deux-roues", "utilitaire", "résiliation",
  "locataire", "propriétaire", "copropriété", "immeuble",
  "RC pro", "décennale", "cyber", "multi-risque pro", "garantie financière", "caution",
  "santé individuelle", "santé collective", "prévoyance", "invalidité", "TNS",
  "assistance voyage", "rapatriement", "annulation",
  "expertise sinistre", "recours", "assistance juridique",
  "DSN", "résiliation assurée", "signature électronique", "extranet courtier",
  "animaux", "sport", "événementiel",
];

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 401 });
  }

  let body: { compagnie: string; internet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { compagnie, internet } = body;
  if (!compagnie?.trim()) {
    return NextResponse.json({ error: "Nom de compagnie requis" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY non configurée" }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Tu es un expert en assurance. Analyse la compagnie suivante et retourne UNIQUEMENT un JSON valide.

Compagnie : ${compagnie}
Site web : ${internet || "inconnu"}

Tags disponibles (choisis parmi eux, et ajoute des tags libres si pertinent) :
${REFERENCE_TAGS.join(", ")}

Règles :
- Retourne maximum 8 tags les plus pertinents.
- Retourne UNIQUEMENT ce JSON, rien d'autre : {"tags":["tag1","tag2"]}
- Si tu ne connais pas la compagnie, retourne {"tags":[]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const raw = response.text ?? "{}";
    let parsed: { tags?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ suggestedTags: [] });
    }

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 8)
      : [];

    return NextResponse.json({ suggestedTags: tags });
  } catch (err) {
    console.error("POST /api/admin/courtage/suggest-tags:", err);
    return NextResponse.json({ suggestedTags: [] });
  }
}
