/**
 * API Route pour la gestion des offres commerciales
 * GET : Liste des offres avec filtres
 * POST : Création d'une nouvelle offre (admin uniquement)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, verifyAdmin } from "@/lib/utils/auth-utils";
import { getOffres, createOffre } from "@/lib/firebase/offres";
import { OffreCommercialeInput, OffreFilter } from "@/types/offre";

/**
 * GET /api/offres
 * Liste des offres avec filtres optionnels
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Récupérer les paramètres de recherche
    const searchParams = request.nextUrl.searchParams;
    const filters: OffreFilter = {
      segment: searchParams.get("segment") || undefined,
      categorie_client: searchParams.get("categorie_client") || undefined,
      periode: searchParams.get("periode") || undefined,
      search: searchParams.get("search") || undefined,
    };

    // Récupérer les offres
    const offres = await getOffres(filters);

    return NextResponse.json({
      success: true,
      data: offres,
      count: offres.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/offres:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des offres",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/offres
 * Création d'une nouvelle offre (admin uniquement)
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

    // Validation des champs requis
    if (!body.segment || !body.sous_segment || !body.offre || !body.categorie_client || !body.periode) {
      return NextResponse.json(
        { error: "Champs requis manquants : segment, sous_segment, offre, categorie_client, periode" },
        { status: 400 }
      );
    }

    // Validation de la catégorie client
    const validCategories = ["particulier", "professionnel", "entreprise", "TNS", "agriculteur", "viticulteur"];
    if (!validCategories.includes(body.categorie_client)) {
      return NextResponse.json(
        { error: `Catégorie client invalide. Valeurs acceptées: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Préparer les données
    const offreData: OffreCommercialeInput = {
      segment: body.segment.trim(),
      sous_segment: body.sous_segment.trim(),
      offre: body.offre.trim(),
      code: body.code?.trim() || "",
      conditions: body.conditions?.trim() || "",
      categorie_client: body.categorie_client,
      periode: body.periode.trim(),
    };

    // Créer l'offre
    const newOffre = await createOffre(offreData);

    return NextResponse.json(
      {
        success: true,
        data: newOffre,
        message: "Offre créée avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/offres:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'offre",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

