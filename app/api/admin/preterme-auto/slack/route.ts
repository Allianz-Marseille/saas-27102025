/**
 * POST /api/admin/preterme-auto/slack
 *
 * Agrège les données d'un import terminé et envoie la synthèse sur Slack.
 *
 * Body JSON :
 *   { importId: string }
 *
 * Le bot token est lu depuis process.env.SLACK_BOT_TOKEN.
 * Le channelId est hardcodé (CE58HNVF0).
 */

import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import { envoyerSlack, type SlackSynthesisData } from "@/lib/services/preterme-slack";
import type { AgenceCode } from "@/types/preterme";

function readSlackTokenFromEnvLocal(): string | null {
  try {
    const envPath = join(process.cwd(), ".env.local");
    if (!existsSync(envPath)) return null;
    const raw = readFileSync(envPath, "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("SLACK_BOT_TOKEN="));
    if (!line) return null;
    const value = line.slice(line.indexOf("=") + 1).trim().replace(/^['"]|['"]$/g, "");
    return value || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  const slackBotToken =
    process.env.SLACK_BOT_TOKEN?.trim() ||
    readSlackTokenFromEnvLocal() ||
    "";
  if (!slackBotToken) {
    return NextResponse.json({ error: "SLACK_BOT_TOKEN non configuré côté serveur." }, { status: 503 });
  }

  // ── Charger l'import ──────────────────────────────────────────────────────
  const importSnap = await adminDb.collection("preterme_imports").doc(importId).get();
  if (!importSnap.exists) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }
  const importData = importSnap.data()!;
  const { moisKey, agence: agenceCode, branche, seuilEtpApplique, seuilVariationApplique } = importData;

  // ── Charger la config mensuelle (pour slackChannelId + noms agences) ─────
  const configSnap = await adminDb
    .collection("preterme_configs")
    .where("moisKey", "==", moisKey)
    .where("branche", "==", branche)
    .where("valide", "==", true)
    .limit(1)
    .get();

  if (configSnap.empty) {
    return NextResponse.json({ error: "Config mensuelle introuvable." }, { status: 404 });
  }

  const channelId = "CE58HNVF0";

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
