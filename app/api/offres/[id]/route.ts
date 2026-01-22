/**
 * API Route pour la gestion d'une offre spécifique
 * GET : Récupération d'une offre
 * PUT : Mise à jour d'une offre (admin uniquement)
 * DELETE : Suppression d'une offre (admin uniquement)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, verifyAdmin } from "@/lib/utils/auth-utils";
import { getOffreById, updateOffre, deleteOffre } from "@/lib/firebase/offres";
import { OffreCommercialeInput } from "@/types/offre";

/**
 * GET /api/offres/[id]
 * Récupération d'une offre par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Récupérer l'offre
    const offre = await getOffreById(id);

    if (!offre) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: offre,
    });
  } catch (error) {
    console.error("Erreur GET /api/offres/[id]:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'offre",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/offres/[id]
 * Mise à jour d'une offre (admin uniquement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier que l'utilisateur est admin
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    // Vérifier que l'offre existe
    const existingOffre = await getOffreById(id);
    if (!existingOffre) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Récupérer les données du body
    const body = await request.json();

    // Validation de la catégorie client si fournie
    if (body.categorie_client) {
      const validCategories = ["particulier", "professionnel", "entreprise", "TNS", "agriculteur", "viticulteur"];
      if (!validCategories.includes(body.categorie_client)) {
        return NextResponse.json(
          { error: `Catégorie client invalide. Valeurs acceptées: ${validCategories.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: Partial<OffreCommercialeInput> = {};

    if (body.segment) updateData.segment = body.segment.trim();
    if (body.sous_segment) updateData.sous_segment = body.sous_segment.trim();
    if (body.offre) updateData.offre = body.offre.trim();
    if (body.code !== undefined) updateData.code = body.code.trim();
    if (body.conditions !== undefined) updateData.conditions = body.conditions.trim();
    if (body.categorie_client) updateData.categorie_client = body.categorie_client;
    if (body.periode) updateData.periode = body.periode.trim();

    // Mettre à jour l'offre
    await updateOffre(id, updateData);

    // Récupérer l'offre mise à jour
    const updatedOffre = await getOffreById(id);

    return NextResponse.json({
      success: true,
      data: updatedOffre,
      message: "Offre mise à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur PUT /api/offres/[id]:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de l'offre",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/offres/[id]
 * Suppression d'une offre (admin uniquement)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier que l'utilisateur est admin
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    // Vérifier que l'offre existe
    const existingOffre = await getOffreById(id);
    if (!existingOffre) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Supprimer l'offre
    await deleteOffre(id);

    return NextResponse.json({
      success: true,
      message: "Offre supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/offres/[id]:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'offre",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

