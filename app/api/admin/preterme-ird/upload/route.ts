/**
 * POST /api/admin/preterme-ird/upload
 *
 * Reçoit un fichier Excel préterme IARD, le parse, l'identifie (agence),
 * purge l'import précédent pour le même couple mois/agence/IRD,
 * et stocke les clients dans Firestore (preterme_iard_clients).
 *
 * FormData attendu :
 *   - file      : File (xlsx/xls)
 *   - moisKey   : string  (ex: "2026-04")
 *   - agence    : string? (ex: "H91358") — optionnel si détectable via nom de fichier
 *
 * Note ETP : les valeurs IRD sont en décimal (1.20 = 20%). Stockées telles quelles.
 * La comparaison seuil en Phase 3 utilisera seuilEtp / 100.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { parsePretermeIrdExcel, detectAgenceFromFilename } from "@/lib/utils/preterme-ird-parser";
import type { AgenceCode } from "@/types/preterme";

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

  const file       = formData.get("file") as File | null;
  const moisKey    = (formData.get("moisKey") as string | null)?.trim();
  const agenceParam = (formData.get("agence") as string | null)?.trim() as AgenceCode | null;

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

  // ── Vérifier que la période est confirmée (config IRD existe pour ce mois) ─
  const configSnap = await adminDb
    .collection("preterme_iard_configs")
    .where("moisKey", "==", moisKey)
    .limit(1)
    .get();

  if (configSnap.empty) {
    return NextResponse.json(
      {
        error:
          `Aucune configuration IARD pour le mois ${moisKey}. ` +
          "Veuillez confirmer la période avant d'importer.",
      },
      { status: 409 }
    );
  }

  // ── Parser le fichier ─────────────────────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  let parseResult;
  try {
    parseResult = await parsePretermeIrdExcel(buffer, file.name);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur lors du parsing du fichier IARD." },
      { status: 422 }
    );
  }

  if (parseResult.rows.length === 0) {
    return NextResponse.json(
      { error: "Le fichier ne contient aucune ligne de données valide." },
      { status: 422 }
    );
  }

  // ── Idempotence : purge de l'import existant (même mois/agence/IRD) ───────
  const existingImportsSnap = await adminDb
    .collection("preterme_iard_imports")
    .where("moisKey", "==", moisKey)
    .where("agence", "==", agence)
    .get();

  if (!existingImportsSnap.empty) {
    const batch = adminDb.batch();
    for (const importDoc of existingImportsSnap.docs) {
      const clientsSnap = await adminDb
        .collection("preterme_iard_clients")
        .where("importId", "==", importDoc.id)
        .get();
      clientsSnap.docs.forEach((d) => batch.delete(d.ref));
      // Purge des logs Trello associés
      const logsSnap = await adminDb
        .collection("preterme_iard_trello_logs")
        .where("importId", "==", importDoc.id)
        .get();
      logsSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(importDoc.ref);
    }
    await batch.commit();
  }

  // ── Créer l'import ────────────────────────────────────────────────────────
  const now = Timestamp.now();
  const importRef = adminDb.collection("preterme_iard_imports").doc();
  const importId  = importRef.id;

  await importRef.set({
    moisKey,
    agence,
    branche: "IRD",
    statut: "DRAFT",
    pretermesGlobaux:    parseResult.nbLignesValides,
    pretermesConserves:  0,
    seuilEtpApplique:    0,
    seuilVariationApplique: 0,
    nomFichier:          file.name,
    createdAt:           now,
    updatedAt:           now,
    createdBy:           auth.userId,
  });

  // ── Créer les clients par batch (max 500 / batch Firestore) ──────────────
  const BATCH_SIZE = 400;
  for (let i = 0; i < parseResult.rows.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    const slice = parseResult.rows.slice(i, i + BATCH_SIZE);

    for (const row of slice) {
      const ref = adminDb.collection("preterme_iard_clients").doc();
      batch.set(ref, {
        importId,
        moisKey,
        agence,
        branche: "IRD",
        // 19 colonnes IRD
        nomClient:                  row.nomClient,
        numeroContrat:              row.numeroContrat,
        brancheContrat:             row.brancheContrat,
        echeancePrincipale:         row.echeancePrincipale,
        codeProduit:                row.codeProduit,
        modeReglement:              row.modeReglement,
        codeFractionnement:         row.codeFractionnement,
        primeTTCAnnuellePrecedente: row.primeTTCAnnuellePrecedente,
        primeTTCAnnuelleActualisee: row.primeTTCAnnuelleActualisee,
        tauxVariation:              row.tauxVariation,
        surveillancePortefeuille:   row.surveillancePortefeuille,
        tauxAugmentationIndice:     row.tauxAugmentationIndice,
        formule:                    row.formule,
        packs:                      row.packs,
        codeGestionCentrale:        row.codeGestionCentrale,
        tauxModulationCommission:   row.tauxModulationCommission,
        dateDernierAvenant:         row.dateDernierAvenant,
        avantageClient:             row.avantageClient,
        etp:                        row.etp, // décimal : 1.20 = 20%
        // État initial
        typeEntite: "a_valider",
        conserve:   false,
        statut:     "EN_ATTENTE",
        createdAt:  now,
        updatedAt:  now,
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
    nbLignesTotal:    parseResult.nbLignesTotal,
    nbLignesValides:  parseResult.nbLignesValides,
    nbErreursParsing: parseResult.erreurs.length,
    erreursParsing:   parseResult.erreurs.slice(0, 10),
  });
}
