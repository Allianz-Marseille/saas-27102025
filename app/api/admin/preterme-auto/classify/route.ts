/**
 * POST /api/admin/preterme-auto/classify
 *
 * 1. Lit les clients d'un import (importId).
 * 2. Applique le filtrage métier (ETP >= seuilEtp OR TauxVariation >= seuilVariation).
 * 3. Classifie les noms via Gemini (particulier / société / a_valider).
 * 4. Met à jour chaque client en Firestore (conserve, typeEntite, geminiConfidence).
 * 5. Met à jour l'import (pretermesConserves, seuilsAppliqués, statut → VALIDATION_SOCIETES).
 *
 * Body JSON attendu :
 *   { importId: string, seuilEtp: number, seuilVariation: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { doitEtreConserve } from "@/lib/services/preterme-anomaly";
import { classifierNoms } from "@/lib/services/preterme-gemini";
import type { TypeEntite } from "@/types/preterme";

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyAdmin(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: { importId?: string; seuilEtp?: number; seuilVariation?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { importId, seuilEtp, seuilVariation } = body;

  if (!importId) return NextResponse.json({ error: "importId requis." }, { status: 400 });
  if (seuilEtp === undefined || seuilVariation === undefined) {
    return NextResponse.json({ error: "seuilEtp et seuilVariation requis." }, { status: 400 });
  }

  // ── Vérifier que l'import existe ──────────────────────────────────────────
  const importRef = adminDb.collection("preterme_imports").doc(importId);
  const importSnap = await importRef.get();
  if (!importSnap.exists) {
    return NextResponse.json({ error: "Import introuvable." }, { status: 404 });
  }

  // ── Récupérer les clients ─────────────────────────────────────────────────
  const clientsSnap = await adminDb
    .collection("preterme_clients")
    .where("importId", "==", importId)
    .get();

  if (clientsSnap.empty) {
    return NextResponse.json({ error: "Aucun client trouvé pour cet import." }, { status: 404 });
  }

  const clients = clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string;
    nomClient: string;
    etp: number | null;
    tauxVariation: number | null;
  }>;

  // ── Filtrage métier ───────────────────────────────────────────────────────
  const conserves = clients.filter((c) =>
    doitEtreConserve(
      { etp: c.etp, tauxVariation: c.tauxVariation },
      seuilEtp,
      seuilVariation
    )
  );

  const nomsAClasser = conserves.map((c) => c.nomClient);

  // ── Classification Gemini ─────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY ?? "";
  const classifications = await classifierNoms(nomsAClasser, geminiKey);

  // Map nom → résultat (par index, même ordre garanti)
  const classifByIndex = new Map<string, { type: TypeEntite; confidence: number }>();
  conserves.forEach((c, i) => {
    const res = classifications[i];
    if (res) {
      classifByIndex.set(c.id, { type: res.type, confidence: res.confidence });
    }
  });

  // ── Écriture Firestore par batch ──────────────────────────────────────────
  const BATCH_SIZE = 400;
  const now = Timestamp.now();

  // Tous les clients : marquer conserve + typeEntite
  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    const slice = clients.slice(i, i + BATCH_SIZE);

    for (const c of slice) {
      const isConserve = conserves.some((cv) => cv.id === c.id);
      const classif = classifByIndex.get(c.id);
      const ref = adminDb.collection("preterme_clients").doc(c.id);

      batch.update(ref, {
        conserve: isConserve,
        typeEntite: isConserve
          ? (classif?.type ?? "a_valider")
          : "a_valider",
        geminiConfidence: classif?.confidence ?? null,
        updatedAt: now,
      });
    }

    await batch.commit();
  }

  // Compter les sociétés à valider parmi les clients conservés
  const nbSocietesAValider = conserves.filter((c) => {
    const classif = classifByIndex.get(c.id);
    return classif?.type === "a_valider" || classif?.type === "societe";
  }).length;

  // ── Mettre à jour l'import ────────────────────────────────────────────────
  await importRef.update({
    pretermesConserves: conserves.length,
    seuilEtpApplique: seuilEtp,
    seuilVariationApplique: seuilVariation,
    statut: nbSocietesAValider > 0 ? "VALIDATION_SOCIETES" : "PRET",
    updatedAt: now,
  });

  return NextResponse.json({
    success: true,
    importId,
    seuilEtp,
    seuilVariation,
    nbTotal: clients.length,
    nbConserves: conserves.length,
    nbExclus: clients.length - conserves.length,
    nbSocietesAValider,
    nbParticuliers: conserves.length - nbSocietesAValider,
    ratioConservation: clients.length > 0
      ? Math.round((conserves.length / clients.length) * 100)
      : 0,
    geminiKeyConfigured: !!geminiKey,
  });
}
