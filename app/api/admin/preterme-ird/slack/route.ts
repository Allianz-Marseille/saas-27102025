/**
 * POST /api/admin/preterme-ird/slack
 *
 * Agrège les données d'un import IARD terminé et envoie la synthèse sur Slack.
 *
 * Body JSON :
 *   { importId: string }
 *
 * Le bot token est lu depuis process.env.SLACK_BOT_TOKEN.
 * Le canal cible est hardcodé (CE58HNVF0) — même canal que Auto.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import { envoyerIrdSlack, type SlackSynthesisData } from "@/lib/services/preterme-ird-slack";
import type { AgenceCode } from "@/types/preterme";

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  let body: { importId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { importId } = body;
  if (!importId) return NextResponse.json({ error: "importId requis." }, { status: 400 });

  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  if (!slackBotToken) {
    return NextResponse.json({ error: "SLACK_BOT_TOKEN non configuré côté serveur." }, { status: 503 });
  }

  // ── Charger l'import IRD ──────────────────────────────────────────────────
  const importSnap = await adminDb.collection("preterme_iard_imports").doc(importId).get();
  if (!importSnap.exists) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }
  const importData = importSnap.data()!;
  const { moisKey, agence: agenceCode, seuilEtpApplique, seuilVariationApplique } = importData;

  const channelId = "CE58HNVF0";

  // ── Agréger les données clients IRD ───────────────────────────────────────
  const clientsSnap = await adminDb
    .collection("preterme_iard_clients")
    .where("importId", "==", importId)
    .get();

  const clients = clientsSnap.docs.map((d) => d.data());

  const parCharge: Record<string, number> = {};
  let nbSocietesEnAttente = 0;

  for (const c of clients) {
    if (!c.conserve) continue;
    if ((c.typeEntite === "societe" || c.typeEntite === "a_valider") && !c.nomGerant) {
      nbSocietesEnAttente++;
      continue;
    }
    if (c.chargeAttribue) {
      parCharge[c.chargeAttribue] = (parCharge[c.chargeAttribue] ?? 0) + 1;
    }
  }

  const AGENCES_LABELS: Record<AgenceCode, string> = {
    H91358: "La Corniche",
    H92083: "La Rouvière",
  };

  const synthData: SlackSynthesisData = {
    moisKey,
    agences: [
      {
        code: agenceCode,
        nom: AGENCES_LABELS[agenceCode as AgenceCode] ?? agenceCode,
        globaux:   importData.pretermesGlobaux  ?? clients.length,
        conserves: importData.pretermesConserves ?? clients.filter((c) => c.conserve).length,
      },
    ],
    parCharge,
    nbSocietesEnAttente,
    seuilEtp:       seuilEtpApplique       ?? 120,
    seuilVariation: seuilVariationApplique ?? 20,
  };

  const result = await envoyerIrdSlack(channelId, slackBotToken, synthData);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    ts: result.ts,
    channelId,
    moisKey,
  });
}
