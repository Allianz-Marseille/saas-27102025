/**
 * POST /api/admin/preterme-ird/dispatch
 *
 * 1. Charge les clients conservés d'un import IRD.
 * 2. Route chaque client vers son CDC via preterme-router (générique).
 * 3. Crée les cartes Trello via preterme-ird-trello (titre [IRD], format IARD).
 * 4. Journalise chaque création dans preterme_iard_trello_logs.
 * 5. Met à jour chaque client (trelloCardId, trelloCardUrl, statut).
 * 6. Met à jour l'import (statut → TERMINE ou DISPATCH_TRELLO si erreurs).
 *
 * Body JSON :
 *   { importId: string, trelloApiKey?: string, trelloToken?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { routerClients } from "@/lib/services/preterme-router";
import { dispatcherIrdTrello } from "@/lib/services/preterme-ird-trello";
import type { AgenceConfig, PretermeClient } from "@/types/preterme";

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyAdmin(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: { importId?: string; trelloApiKey?: string; trelloToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { importId, trelloApiKey, trelloToken } = body;
  if (!importId) return NextResponse.json({ error: "importId requis." }, { status: 400 });

  const effectiveTrelloApiKey =
    trelloApiKey?.trim() ||
    process.env.TRELLO_API_KEY?.trim() ||
    process.env.TRELLO_KEY?.trim() ||
    "";
  const effectiveTrelloToken =
    trelloToken?.trim() ||
    process.env.TRELLO_TOKEN?.trim() ||
    "";

  if (!effectiveTrelloApiKey || !effectiveTrelloToken) {
    return NextResponse.json(
      { error: "Credentials Trello manquants côté serveur." },
      { status: 400 }
    );
  }

  // ── Charger l'import IRD ──────────────────────────────────────────────────
  const importRef = adminDb.collection("preterme_iard_imports").doc(importId);
  const importSnap = await importRef.get();
  if (!importSnap.exists) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }

  const importData = importSnap.data()!;
  const { moisKey, agence: agenceCode, seuilEtpApplique, seuilVariationApplique } = importData;

  // ── Charger la config mensuelle IRD validée ───────────────────────────────
  const configSnap = await adminDb
    .collection("preterme_iard_configs")
    .where("moisKey", "==", moisKey)
    .where("valide", "==", true)
    .limit(1)
    .get();

  if (configSnap.empty) {
    return NextResponse.json(
      { error: "Configuration IARD mensuelle validée introuvable." },
      { status: 409 }
    );
  }

  const configData = configSnap.docs[0].data();
  const agenceConfig: AgenceConfig | undefined = configData.agences?.find(
    (a: AgenceConfig) => a.code === agenceCode
  );

  if (!agenceConfig) {
    return NextResponse.json(
      { error: `Aucune configuration trouvée pour l'agence ${agenceCode}.` },
      { status: 409 }
    );
  }

  // ── Charger les clients conservés ─────────────────────────────────────────
  const clientsSnap = await adminDb
    .collection("preterme_iard_clients")
    .where("importId", "==", importId)
    .where("conserve", "==", true)
    .get();

  const clients = clientsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as PretermeClient[];

  if (clients.length === 0) {
    return NextResponse.json(
      { error: "Aucun client conservé à dispatcher. Lancez d'abord le filtrage." },
      { status: 409 }
    );
  }

  // ── Routage ───────────────────────────────────────────────────────────────
  const { routes, nonRoutes } = routerClients(clients, agenceConfig);

  if (routes.length === 0) {
    return NextResponse.json(
      {
        error:
          "Aucun client routable — vérifiez la configuration des tranches de lettres et le mapping Trello.",
        nonRoutes: nonRoutes.length,
      },
      { status: 409 }
    );
  }

  // ── Dispatch Trello IRD ───────────────────────────────────────────────────
  const dispatchResult = await dispatcherIrdTrello(
    routes,
    agenceCode,
    moisKey,
    seuilEtpApplique ?? 120,
    seuilVariationApplique ?? 20,
    effectiveTrelloApiKey,
    effectiveTrelloToken
  );

  // ── Écriture Firestore ────────────────────────────────────────────────────
  const now = Timestamp.now();
  const BATCH_SIZE = 400;

  const successCards = dispatchResult.cards.filter((c) => c.success && c.cardId);
  const failedCards = dispatchResult.cards.filter((c) => !c.success);

  for (let i = 0; i < successCards.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    const slice = successCards.slice(i, i + BATCH_SIZE);

    for (const card of slice) {
      const route = routes.find((r) => r.client.id === card.clientId);
      if (!route) continue;

      batch.update(adminDb.collection("preterme_iard_clients").doc(card.clientId), {
        trelloCardId: card.cardId,
        trelloCardUrl: card.cardUrl,
        statut: "CARTE_CREEE",
        chargeAttribue: route.chargePrenom,
        chargeId: route.chargeId,
        updatedAt: now,
      });

      const logRef = adminDb.collection("preterme_iard_trello_logs").doc();
      batch.set(logRef, {
        importId,
        moisKey,
        numeroContrat: route.client.numeroContrat,
        agence: agenceCode,
        chargeAttribue: route.chargePrenom,
        trelloBoardId: route.trello.trelloBoardId,
        trelloListId: route.trello.trelloListId,
        trelloCardId: card.cardId,
        createdAt: now,
      });
    }

    await batch.commit();
  }

  const hasErrors = dispatchResult.errors > 0;
  const errorDetails = failedCards.slice(0, 20).map((card) => {
    const route = routes.find((r) => r.client.id === card.clientId);
    return {
      clientId: card.clientId,
      numeroContrat: card.numeroContrat,
      nomClient: route?.client.nomClient ?? null,
      chargeAttribue: route?.chargePrenom ?? null,
      message: card.error ?? "Erreur inconnue Trello",
    };
  });

  await importRef.update({
    statut: hasErrors ? "DISPATCH_TRELLO" : "TERMINE",
    updatedAt: now,
  });

  return NextResponse.json({
    success: true,
    importId,
    agence: agenceCode,
    moisKey,
    routage: {
      total: clients.length,
      routes: routes.length,
      nonRoutes: nonRoutes.length,
    },
    trello: {
      total: dispatchResult.total,
      success: dispatchResult.success,
      errors: dispatchResult.errors,
      errorDetails,
    },
    statut: hasErrors ? "DISPATCH_TRELLO" : "TERMINE",
  });
}
