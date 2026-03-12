/**
 * POST /api/admin/preterme-auto/upload
 *
 * Reçoit un fichier Excel préterme, le parse, l'identifie (agence),
 * purge l'import précédent pour le même triplet mois/agence/AUTO,
 * et stocke les clients dans Firestore.
 *
 * FormData attendu :
 *   - file      : File (xlsx/xls)
 *   - moisKey   : string  (ex: "2026-04")
 *   - agence    : string? (ex: "H91358") — optionnel si détectable via nom de fichier
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { parsePretermeExcel, detectAgenceFromFilename } from "@/lib/utils/preterme-parser";
import type { AgenceCode, PretermeB } from "@/types/preterme";

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await verifyAdmin(request);
  if (!auth.valid || !auth.userId) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 403 });
  }

  // ── FormData ──────────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Impossible de lire le formulaire." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const moisKey = (formData.get("moisKey") as string | null)?.trim();
  const agenceParam = (formData.get("agence") as string | null)?.trim() as AgenceCode | null;
  const brancheParam = (formData.get("branche") as string | null)?.trim();
  const branche: PretermeB = brancheParam === "IRD" ? "IRD" : "AUTO";

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  }
  if (!moisKey || !/^\d{4}-\d{2}$/.test(moisKey)) {
    return NextResponse.json({ error: "moisKey invalide (format attendu : YYYY-MM)." }, { status: 400 });
  }
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return NextResponse.json({ error: "Le fichier doit être au format .xlsx ou .xls." }, { status: 400 });
  }

  // ── Détection agence ──────────────────────────────────────────────────────
  const agenceDetectee = detectAgenceFromFilename(file.name);
  const agence: AgenceCode | null = agenceParam ?? agenceDetectee;

  if (!agence) {
    return NextResponse.json(
      {
        error:
          "Impossible de détecter l'agence depuis le nom du fichier. " +
          "Renommez le fichier en incluant 'H91358' ou 'H92083', ou précisez l'agence manuellement.",
        agenceRequise: true,
      },
      { status: 422 }
    );
  }

  // ── Vérifier que la config du mois est validée ────────────────────────────
  const configSnap = await adminDb
    .collection("preterme_configs")
    .where("moisKey", "==", moisKey)
    .where("branche", "==", branche)
    .where("valide", "==", true)
    .limit(1)
    .get();

  if (configSnap.empty) {
    return NextResponse.json(
      {
        error:
          `Aucune configuration validée pour le mois ${moisKey}. ` +
          "Veuillez valider la configuration avant d'importer.",
      },
      { status: 409 }
    );
  }

  // ── Parser le fichier ─────────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  let parseResult;
  try {
    parseResult = await parsePretermeExcel(buffer, file.name);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur lors du parsing du fichier." },
      { status: 422 }
    );
  }

  if (parseResult.rows.length === 0) {
    return NextResponse.json(
      { error: "Le fichier ne contient aucune ligne de données valide." },
      { status: 422 }
    );
  }

  // ── Idempotence : purge de l'import existant ──────────────────────────────
  const existingImportsSnap = await adminDb
    .collection("preterme_imports")
    .where("moisKey", "==", moisKey)
    .where("agence", "==", agence)
    .where("branche", "==", branche)
    .get();

  if (!existingImportsSnap.empty) {
    const batch = adminDb.batch();

    // Purge des clients
    for (const importDoc of existingImportsSnap.docs) {
      const clientsSnap = await adminDb
        .collection("preterme_clients")
        .where("importId", "==", importDoc.id)
        .get();
      clientsSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(importDoc.ref);
    }
    await batch.commit();
  }

  // ── Créer l'import ────────────────────────────────────────────────────────
  const now = Timestamp.now();
  const importRef = adminDb.collection("preterme_imports").doc();
  const importId = importRef.id;

  await importRef.set({
    moisKey,
    agence,
    branche,
    statut: "DRAFT",
    pretermesGlobaux: parseResult.nbLignesValides,
    pretermesConserves: 0, // sera mis à jour en Phase 3 (filtrage)
    seuilEtpApplique: 0,
    seuilVariationApplique: 0,
    nomFichier: file.name,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.userId,
  });

  // ── Créer les clients par batch (max 500 / batch Firestore) ──────────────
  const BATCH_SIZE = 400;
  for (let i = 0; i < parseResult.rows.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    const slice = parseResult.rows.slice(i, i + BATCH_SIZE);

    for (const row of slice) {
      const ref = adminDb.collection("preterme_clients").doc();
      batch.set(ref, {
        importId,
        moisKey,
        agence,
        branche,
        // 20 colonnes
        nomClient:                   row.nomClient,
        numeroContrat:               row.numeroContrat,
        brancheContrat:              row.brancheContrat,
        echeancePrincipale:          row.echeancePrincipale,
        codeProduit:                 row.codeProduit,
        modeReglement:               row.modeReglement,
        codeFractionnement:          row.codeFractionnement,
        primeTTCAnnuellePrecedente:  row.primeTTCAnnuellePrecedente,
        primeTTCAnnuelleActualisee:  row.primeTTCAnnuelleActualisee,
        tauxVariation:               row.tauxVariation,
        surveillancePortefeuille:    row.surveillancePortefeuille,
        avantageClient:              row.avantageClient,
        formule:                     row.formule,
        packs:                       row.packs,
        nbSinistres:                 row.nbSinistres,
        bonusMalus:                  row.bonusMalus,
        etp:                         row.etp,
        codeGestionCentrale:         row.codeGestionCentrale,
        tauxModulationCommission:    row.tauxModulationCommission,
        dateDernierAvenant:          row.dateDernierAvenant,
        // État de traitement initial
        typeEntite:    "a_valider",
        conserve:      false,
        statut:        "EN_ATTENTE",
        createdAt:     now,
        updatedAt:     now,
      });
    }
    await batch.commit();
  }

  // ── Réponse ───────────────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    importId,
    agence,
    agenceDetectee: parseResult.agenceDetectee,
    moisKey,
    nbLignesTotal:   parseResult.nbLignesTotal,
    nbLignesValides: parseResult.nbLignesValides,
    nbErreursParsing: parseResult.erreurs.length,
    erreursParsing:  parseResult.erreurs.slice(0, 10), // max 10 erreurs en réponse
  });
}
