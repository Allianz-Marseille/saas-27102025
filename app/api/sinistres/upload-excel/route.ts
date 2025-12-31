/**
 * API Route pour uploader et importer un fichier Excel de sinistres
 * POST : Reçoit un fichier Excel, le parse et importe les nouveaux sinistres dans Firestore
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { parseSinistresExcel, convertParsedLineToSinistre } from "@/lib/utils/excel-parser";
import { ExcelImportResult } from "@/types/sinistre";

/**
 * Helper pour parser un montant
 */
function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }

  let cleaned = String(value).trim();
  if (!cleaned || cleaned === "") {
    return 0;
  }

  cleaned = cleaned.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * POST /api/sinistres/upload-excel
 * Upload et import d'un fichier Excel de sinistres
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const auth = await verifyAdmin(request);
    if (!auth.valid || !auth.userId) {
      return NextResponse.json({ error: auth.error || "Non autorisé" }, { status: 403 });
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le format du fichier
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Le fichier doit être au format Excel (.xlsx ou .xls)" },
        { status: 400 }
      );
    }

    console.log(`📥 Import du fichier Excel: ${file.name}`);

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parser le fichier Excel
    const { lines, errors: parseErrors } = await parseSinistresExcel(buffer);

    if (lines.length === 0) {
      return NextResponse.json(
        {
          error: "Le fichier Excel est vide ou ne contient aucune ligne valide",
          parseErrors,
        },
        { status: 400 }
      );
    }

    console.log(`✅ ${lines.length} lignes parsées, ${parseErrors.length} erreurs de parsing`);

    // Récupérer tous les numéros de police existants pour déduplication
    const existingSinistres = await adminDb
      .collection("sinistres")
      .select("policyNumber")
      .get();

    const existingPolicyNumbers = new Set<string>();
    existingSinistres.docs.forEach((doc) => {
      const data = doc.data();
      if (data.policyNumber) {
        existingPolicyNumbers.add(data.policyNumber);
      }
    });

    // Séparer les nouveaux sinistres et ceux à mettre à jour
    const newSinistres: typeof lines = [];
    const sinistresToUpdate: Array<{ docId: string; line: typeof lines[0] }> = [];

    for (const line of lines) {
      if (existingPolicyNumbers.has(line.policyNumber)) {
        // Sinistre existant : vérifier si des données doivent être mises à jour
        const existingDoc = existingSinistres.docs.find(
          (doc) => doc.data().policyNumber === line.policyNumber
        );
        
        if (existingDoc) {
          // Mettre à jour uniquement les champs liés aux montants si nécessaire
          // Ne pas écraser les modifications manuelles (route, statut, notes, etc.)
          const existingData = existingDoc.data();
          const newAmountPaid = parseAmount(line.amountPaid) + line.partialAmounts.reduce((sum, amt) => sum + amt, 0);
          const newRemainingAmount = parseAmount(line.remainingAmount);
          
          // Mettre à jour seulement si les montants ont changé
          if (
            existingData.amountPaid !== newAmountPaid ||
            existingData.remainingAmount !== newRemainingAmount
          ) {
            sinistresToUpdate.push({
              docId: existingDoc.id,
              line,
            });
          }
        }
      } else {
        // Nouveau sinistre
        newSinistres.push(line);
      }
    }

    const existingCount = lines.length - newSinistres.length - sinistresToUpdate.length;
    const excelVersion = file.name;
    const now = Timestamp.now();
    let imported = 0;
    let updated = 0;
    const importErrors: Array<{ line: number; error: string }> = [];

    // Créer les nouveaux sinistres en batch
    const BATCH_SIZE = 500;
    for (let i = 0; i < newSinistres.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = newSinistres.slice(i, i + BATCH_SIZE);

      chunk.forEach((line) => {
        try {
          const sinistreData = convertParsedLineToSinistre(line, excelVersion, auth.userId);
          
          // Convertir les dates en Timestamp
          const docRef = adminDb.collection("sinistres").doc();
          batch.set(docRef, {
            ...sinistreData,
            incidentDate: Timestamp.fromDate(sinistreData.incidentDate),
            importDate: Timestamp.fromDate(sinistreData.importDate),
            createdAt: Timestamp.fromDate(sinistreData.createdAt),
            updatedAt: Timestamp.fromDate(sinistreData.updatedAt),
          });

          imported++;
        } catch (error) {
          importErrors.push({
            line: line.lineIndex,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      });

      await batch.commit();
    }

    // Mettre à jour les sinistres existants (uniquement les montants)
    for (const { docId, line } of sinistresToUpdate) {
      try {
        const newAmountPaid = parseAmount(line.amountPaid) + line.partialAmounts.reduce((sum, amt) => sum + amt, 0);
        const newRemainingAmount = parseAmount(line.remainingAmount);
        const newTotalAmountPaid = newAmountPaid;
        const newTotalAmount = newTotalAmountPaid + newRemainingAmount;

        await adminDb.collection("sinistres").doc(docId).update({
          amountPaid: newAmountPaid,
          remainingAmount: newRemainingAmount,
          totalAmountPaid: newTotalAmountPaid,
          totalAmount: newTotalAmount,
          excelVersion,
          importDate: now,
          updatedAt: now,
          lastUpdatedBy: auth.userId,
        });

        updated++;
      } catch (error) {
        importErrors.push({
          line: line.lineIndex,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    // Enregistrer les métadonnées du dernier import
    const lastImportRef = adminDb.collection("sinistres_metadata").doc("lastImport");
    await lastImportRef.set({
      importDate: now,
      excelVersion,
      newSinistres: imported,
      totalLines: lines.length,
      updatedSinistres: updated,
      existingSinistres: existingCount,
    }, { merge: true });

    // Construire le résultat
    const result: ExcelImportResult = {
      totalLines: lines.length,
      newSinistres: imported,
      existingSinistres: existingCount,
      updatedSinistres: updated,
      errors: [...parseErrors, ...importErrors],
      excelVersion,
      importDate: now.toDate(),
    };

    // Logger l'import dans la collection logs
    try {
      await adminDb.collection("logs").add({
        level: "info",
        action: "SINISTRES_EXCEL_IMPORT",
        message: `Import Excel : ${imported} nouveaux, ${updated} mis à jour, ${existingCount} existants ignorés`,
        userId: auth.userId,
        metadata: {
          excelVersion,
          totalLines: lines.length,
          imported,
          updated,
          existingCount,
        },
        timestamp: now,
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    console.log(`✅ Import terminé : ${imported} nouveaux, ${updated} mis à jour, ${existingCount} existants ignorés`);

    return NextResponse.json({
      success: true,
      message: "Import terminé avec succès",
      result,
    });
  } catch (error) {
    console.error("Erreur POST /api/sinistres/upload-excel:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'import du fichier Excel",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

