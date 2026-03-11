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
import { normalizeClientName } from "@/lib/utils/preterme-quality";

async function getQualityOverrideMap(normalizedNames: string[]): Promise<Record<string, "particulier" | "societe">> {
  const uniqueNames = Array.from(new Set(normalizedNames.filter(Boolean)));
  if (uniqueNames.length === 0) return {};

  const result: Record<string, "particulier" | "societe"> = {};
  const CHUNK_SIZE = 10; // Firestore where in max size
  for (let i = 0; i < uniqueNames.length; i += CHUNK_SIZE) {
    const chunk = uniqueNames.slice(i, i + CHUNK_SIZE);
    const snap = await adminDb
      .collection("preterme_quality_overrides")
      .where("normalizedName", "in", chunk)
      .get();

    snap.docs.forEach((d) => {
      const data = d.data() as {
        normalizedName?: string;
        entityType?: "particulier" | "societe";
      };
      if (data.normalizedName && data.entityType) {
        result[data.normalizedName] = data.entityType;
      }
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyAdmin(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: { importId?: string; importIds?: string[]; seuilEtp?: number; seuilVariation?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const { importId, importIds, seuilEtp, seuilVariation } = body;

  const targetImportIds = Array.from(
    new Set((importIds && importIds.length > 0 ? importIds : importId ? [importId] : []).filter(Boolean))
  ) as string[];

  if (targetImportIds.length === 0) {
    return NextResponse.json({ error: "importId ou importIds requis." }, { status: 400 });
  }
  if (seuilEtp === undefined || seuilVariation === undefined) {
    return NextResponse.json({ error: "seuilEtp et seuilVariation requis." }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY ?? "";

  const results: Array<{
    importId: string;
    nbTotal: number;
    nbConserves: number;
    nbExclus: number;
    nbSocietesAValider: number;
    nbParticuliers: number;
    ratioConservation: number;
  }> = [];

  for (const currentImportId of targetImportIds) {
    const importRef = adminDb.collection("preterme_imports").doc(currentImportId);
    const importSnap = await importRef.get();
    if (!importSnap.exists) {
      continue;
    }

    const clientsSnap = await adminDb
      .collection("preterme_clients")
      .where("importId", "==", currentImportId)
      .get();

    if (clientsSnap.empty) {
      results.push({
        importId: currentImportId,
        nbTotal: 0,
        nbConserves: 0,
        nbExclus: 0,
        nbSocietesAValider: 0,
        nbParticuliers: 0,
        ratioConservation: 0,
      });
      continue;
    }

    const clients = clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string;
      nomClient: string;
      etp: number | null;
      tauxVariation: number | null;
    }>;

    const conserves = clients.filter((c) =>
      doitEtreConserve(
        { etp: c.etp, tauxVariation: c.tauxVariation },
        seuilEtp,
        seuilVariation
      )
    );
    const conserveIds = new Set(conserves.map((c) => c.id));

    const normalizedNames = conserves.map((c) => normalizeClientName(c.nomClient));
    const overrideMap = await getQualityOverrideMap(normalizedNames);

    const nomsPourModel: string[] = [];
    const idsPourModel: string[] = [];
    conserves.forEach((client) => {
      const normalizedName = normalizeClientName(client.nomClient);
      if (!overrideMap[normalizedName]) {
        nomsPourModel.push(client.nomClient);
        idsPourModel.push(client.id);
      }
    });
    const modelResults = await classifierNoms(nomsPourModel, geminiKey);
    const modelResultByClientId = new Map<string, { type: TypeEntite; confidence: number }>();
    idsPourModel.forEach((clientId, idx) => {
      const result = modelResults[idx];
      if (result) {
        modelResultByClientId.set(clientId, {
          type: result.type,
          confidence: result.confidence,
        });
      }
    });

    const classifByIndex = new Map<string, { type: TypeEntite; confidence: number }>();
    conserves.forEach((client) => {
      const normalizedName = normalizeClientName(client.nomClient);
      const overrideType = overrideMap[normalizedName];
      if (overrideType) {
        classifByIndex.set(client.id, { type: overrideType, confidence: 1 });
        return;
      }
      const res = modelResultByClientId.get(client.id);
      if (res) {
        classifByIndex.set(client.id, { type: res.type, confidence: res.confidence });
      }
    });

    const BATCH_SIZE = 400;
    const now = Timestamp.now();
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const slice = clients.slice(i, i + BATCH_SIZE);

      for (const c of slice) {
        const isConserve = conserveIds.has(c.id);
        const classif = classifByIndex.get(c.id);
        const ref = adminDb.collection("preterme_clients").doc(c.id);

        batch.update(ref, {
          conserve: isConserve,
          typeEntite: isConserve ? (classif?.type ?? "a_valider") : "a_valider",
          geminiConfidence: classif?.confidence ?? null,
          updatedAt: now,
        });
      }
      await batch.commit();
    }

    const nbSocietesAValider = conserves.filter((c) => {
      const classif = classifByIndex.get(c.id);
      return classif?.type === "a_valider" || classif?.type === "societe";
    }).length;

    await importRef.update({
      pretermesConserves: conserves.length,
      seuilEtpApplique: seuilEtp,
      seuilVariationApplique: seuilVariation,
      statut: nbSocietesAValider > 0 ? "VALIDATION_SOCIETES" : "PRET",
      typesValidatedAt: null,
      updatedAt: now,
    });

    results.push({
      importId: currentImportId,
      nbTotal: clients.length,
      nbConserves: conserves.length,
      nbExclus: clients.length - conserves.length,
      nbSocietesAValider,
      nbParticuliers: conserves.length - nbSocietesAValider,
      ratioConservation: clients.length > 0
        ? Math.round((conserves.length / clients.length) * 100)
        : 0,
    });
  }

  if (results.length === 0) {
    return NextResponse.json({ error: "Aucun import exploitable trouvé." }, { status: 404 });
  }

  const aggregate = results.reduce(
    (acc, current) => {
      acc.nbTotal += current.nbTotal;
      acc.nbConserves += current.nbConserves;
      acc.nbExclus += current.nbExclus;
      acc.nbSocietesAValider += current.nbSocietesAValider;
      acc.nbParticuliers += current.nbParticuliers;
      return acc;
    },
    { nbTotal: 0, nbConserves: 0, nbExclus: 0, nbSocietesAValider: 0, nbParticuliers: 0 }
  );

  const first = results[0];
  return NextResponse.json({
    success: true,
    importId: first?.importId,
    seuilEtp,
    seuilVariation,
    nbTotal: aggregate.nbTotal,
    nbConserves: aggregate.nbConserves,
    nbExclus: aggregate.nbExclus,
    nbSocietesAValider: aggregate.nbSocietesAValider,
    nbParticuliers: aggregate.nbParticuliers,
    ratioConservation: aggregate.nbTotal > 0
      ? Math.round((aggregate.nbConserves / aggregate.nbTotal) * 100)
      : 0,
    geminiKeyConfigured: !!geminiKey,
    nbImportsTraites: results.length,
    perImport: results,
  });
}
