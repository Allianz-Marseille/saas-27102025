/**
 * API Route pour synchroniser les sinistres depuis Google Sheets
 * GET : Récupère les données depuis Google Sheets et les importe
 * 
 * Le Google Sheet doit être publié en CSV pour cette route
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import {
  parseSinistresCSV,
  parseAmount,
  parseDate,
  parseRecourse,
} from "@/lib/utils/csv-parser";
import { CSVImportResult } from "@/types/sinistre";

// URL du Google Sheet publié en CSV
// Format pour un sheet publié: https://docs.google.com/spreadsheets/d/e/{PUBLISH_ID}/pub?output=csv&gid={GID}
const GOOGLE_SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTgYzslcTN4N2XhHqsF3JHyqE6xY-YADCP2uVPzaLwaDdKhd56Yw99GYeC6DiAnRruqof9_FPFYRiHH/pub?output=csv&gid=1700044024";

/**
 * GET /api/sinistres/sync-google-sheets
 * Synchronise les sinistres depuis Google Sheets
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    console.log("📥 Récupération des données depuis Google Sheets...");

    // Récupérer le CSV depuis Google Sheets
    const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération du Google Sheet: ${response.statusText}`
      );
    }

    const csvContent = await response.text();

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Le Google Sheet est vide" },
        { status: 400 }
      );
    }

    console.log(`✅ ${csvContent.split("\n").length} lignes récupérées`);

    // Parser le CSV
    const { lines, errors: parseErrors } = parseSinistresCSV(csvContent);

    if (lines.length === 0) {
      return NextResponse.json(
        {
          error: "Le fichier CSV est vide ou ne contient aucune ligne valide",
          parseErrors,
        },
        { status: 400 }
      );
    }

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

    // Filtrer les nouveaux sinistres (ceux qui n'existent pas déjà)
    const newSinistres = lines.filter(
      (line) => !existingPolicyNumbers.has(line.policyNumber)
    );

    const existingCount = lines.length - newSinistres.length;
    const updatedCount = 0; // Pour l'instant, on ne met à jour que les nouveaux

    // Créer les nouveaux sinistres en batch
    const now = Timestamp.now();
    const csvVersion = `google-sheets-${new Date().toISOString().split("T")[0]}`;
    let imported = 0;
    const importErrors: Array<{ line: number; error: string }> = [];

    // Import par batch (500 max par batch Firestore)
    const BATCH_SIZE = 500;
    for (let i = 0; i < newSinistres.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = newSinistres.slice(i, i + BATCH_SIZE);

      chunk.forEach((line) => {
        try {
          // Calculer les montants
          const amountPaid = parseAmount(line.amountPaid);
          const remainingAmount = parseAmount(line.remainingAmount);
          const totalAmountPaid =
            amountPaid +
            line.partialAmounts.reduce((sum, amt) => sum + amt, 0);
          const totalAmount = totalAmountPaid + remainingAmount;

          // Parser les dates
          const incidentDate = parseDate(line.incidentDate);

          // Créer le document
          const docRef = adminDb.collection("sinistres").doc();
          batch.set(docRef, {
            clientName: line.clientName,
            clientLagonNumber: line.clientLagonNumber,
            policyNumber: line.policyNumber,
            policyCategory: line.policyCategory,
            productType: line.productType,
            claimNumber: line.claimNumber,
            incidentDate: Timestamp.fromDate(incidentDate),
            amountPaid,
            remainingAmount,
            recourse: parseRecourse(line.recourse),
            damagedCoverage: line.damagedCoverage,
            totalAmountPaid,
            totalAmount,
            importDate: now,
            csvVersion,
            createdAt: now,
            updatedAt: now,
            createdBy: auth.userId,
            lastUpdatedBy: auth.userId,
            source: "google-sheets", // Marquer la source
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

    // Construire le résultat
    const result: CSVImportResult = {
      totalLines: lines.length,
      newSinistres: imported,
      existingSinistres: existingCount,
      updatedSinistres: updatedCount,
      errors: [...parseErrors, ...importErrors],
      csvVersion,
      importDate: now.toDate(),
    };

    // Logger la synchronisation
    try {
      await adminDb.collection("logs").add({
        level: "info",
        action: "SINISTRES_GOOGLE_SHEETS_SYNC",
        message: `Synchronisation Google Sheets : ${imported} nouveaux, ${existingCount} existants ignorés`,
        userId: auth.userId,
        metadata: {
          totalLines: lines.length,
          imported,
          existingCount,
          updatedCount,
        },
        timestamp: now,
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Synchronisation terminée",
      result,
    });
  } catch (error) {
    console.error("Erreur GET /api/sinistres/sync-google-sheets:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la synchronisation avec Google Sheets",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

