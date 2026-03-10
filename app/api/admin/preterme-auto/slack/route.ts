/**
 * POST /api/admin/preterme-auto/slack
 *
 * Agrège les données d'un import terminé et envoie la synthèse sur Slack.
 *
 * Body JSON :
 *   { importId: string, slackBotToken: string }
 *
 * Le channelId est lu depuis la config mensuelle validée (slackChannelId).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import { envoyerSlack, type SlackSynthesisData } from "@/lib/services/preterme-slack";
import type { AgenceCode } from "@/types/preterme";

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyAdmin(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  let body: { importId?: string; slackBotToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { importId, slackBotToken } = body;
  if (!importId) return NextResponse.json({ error: "importId requis." }, { status: 400 });
  if (!slackBotToken) return NextResponse.json({ error: "slackBotToken requis." }, { status: 400 });

  // ── Charger l'import ──────────────────────────────────────────────────────
  const importSnap = await adminDb.collection("preterme_imports").doc(importId).get();
  if (!importSnap.exists) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }
  const importData = importSnap.data()!;
  const { moisKey, agence: agenceCode, seuilEtpApplique, seuilVariationApplique } = importData;

  // ── Charger la config mensuelle (pour slackChannelId + noms agences) ─────
  const configSnap = await adminDb
    .collection("preterme_configs")
    .where("moisKey", "==", moisKey)
    .where("valide", "==", true)
    .limit(1)
    .get();

  if (configSnap.empty) {
    return NextResponse.json({ error: "Config mensuelle introuvable." }, { status: 404 });
  }

  const configData = configSnap.docs[0].data();
  const channelId = configData.slackChannelId ?? "";

  if (!channelId) {
    return NextResponse.json(
      { error: "Canal Slack non configuré. Renseignez slackChannelId dans la configuration mensuelle." },
      { status: 409 }
    );
  }

  // ── Agréger les données clients ───────────────────────────────────────────
  const clientsSnap = await adminDb
    .collection("preterme_clients")
    .where("importId", "==", importId)
    .get();

  const clients = clientsSnap.docs.map((d) => d.data());

  // Répartition par charge
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

  // Infos agence
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
        globaux: importData.pretermesGlobaux ?? clients.length,
        conserves: importData.pretermesConserves ?? clients.filter((c) => c.conserve).length,
      },
    ],
    parCharge,
    nbSocietesEnAttente,
    seuilEtp: seuilEtpApplique ?? 120,
    seuilVariation: seuilVariationApplique ?? 20,
  };

  // ── Envoi Slack ───────────────────────────────────────────────────────────
  const result = await envoyerSlack(channelId, slackBotToken, synthData);

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
