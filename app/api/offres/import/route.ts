/**
 * API Route pour l'import en masse d'offres commerciales
 * POST : Import depuis JSON (admin uniquement)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { createOffre } from "@/lib/firebase/offres";
import { OffreCommercialeInput } from "@/types/offre";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";

interface OffreJSON {
  segment: string;
  sous_segment: string;
  offre: string;
  code?: string;
  conditions?: string;
  categorie_client: string;
  periode: string;
}

/**
 * POST /api/offres/import
 * Import en masse d'offres depuis JSON (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    // Récupérer les données du body
    const body = await request.json();

    // Validation
    if (!Array.isArray(body.offres)) {
      return NextResponse.json(
        { error: "Le champ 'offres' doit être un tableau" },
        { status: 400 }
      );
    }

    const offres: OffreJSON[] = body.offres;
    const replaceAll = body.replaceAll === true; // Si true, supprime toutes les offres existantes

    if (offres.length === 0) {
      return NextResponse.json(
        { error: "Le tableau d'offres est vide" },
        { status: 400 }
      );
    }

    // Validation des offres
    const validCategories = ["particulier", "professionnel", "entreprise", "TNS", "agriculteur", "viticulteur"];
    const errors: string[] = [];

    offres.forEach((offre, index) => {
      if (!offre.segment || offre.segment.trim() === "") {
        errors.push(`Offre ${index + 1}: segment manquant`);
      }
      if (!offre.sous_segment || offre.sous_segment.trim() === "") {
        errors.push(`Offre ${index + 1}: sous_segment manquant`);
      }
      if (!offre.offre || offre.offre.trim() === "") {
        errors.push(`Offre ${index + 1}: offre manquante`);
      }
      if (!offre.categorie_client || !validCategories.includes(offre.categorie_client)) {
        errors.push(`Offre ${index + 1}: categorie_client invalide`);
      }
      if (!offre.periode || offre.periode.trim() === "") {
        errors.push(`Offre ${index + 1}: periode manquante`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Erreurs de validation",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Supprimer les offres existantes si demandé
    if (replaceAll) {
      const existingSnapshot = await adminDb.collection("offres_commerciales").get();
      
      if (existingSnapshot.size > 0) {
        const batch = adminDb.batch();
        existingSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    }

    // Importer les nouvelles offres
    const now = Timestamp.now();
    let imported = 0;
    let failed = 0;
    const failedOffres: Array<{ index: number; error: string }> = [];

    // Import par batch (500 max par batch)
    const BATCH_SIZE = 500;
    for (let i = 0; i < offres.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = offres.slice(i, i + BATCH_SIZE);

      chunk.forEach((offre, chunkIndex) => {
        try {
          const docRef = adminDb.collection("offres_commerciales").doc();
          batch.set(docRef, {
            segment: offre.segment.trim(),
            sous_segment: offre.sous_segment.trim(),
            offre: offre.offre.trim(),
            code: offre.code?.trim() || "",
            conditions: offre.conditions?.trim() || "",
            categorie_client: offre.categorie_client,
            periode: offre.periode.trim(),
            createdAt: now,
            updatedAt: now,
          });
          imported++;
        } catch (error) {
          failed++;
          failedOffres.push({
            index: i + chunkIndex + 1,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      });

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: "Import terminé",
      stats: {
        total: offres.length,
        imported,
        failed,
        replacedExisting: replaceAll,
      },
      failedOffres: failedOffres.length > 0 ? failedOffres : undefined,
    });
  } catch (error) {
    console.error("Erreur POST /api/offres/import:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'import des offres",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

