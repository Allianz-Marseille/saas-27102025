/**
 * API Route pour la recherche d'entreprises par nom via Pappers
 * POST : Recherche des entreprises par nom ou raison sociale
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * POST /api/pappers/recherche
 * Recherche des entreprises par nom
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Récupérer les paramètres depuis le body
    const body = await request.json();
    const { q, par_page = 20, page = 1, precision } = body;

    // Validation
    if (!q || typeof q !== "string" || !q.trim()) {
      return NextResponse.json(
        { error: "Le paramètre de recherche 'q' est requis" },
        { status: 400 }
      );
    }

    // Vérifier la clé API Pappers
    const apiKey = process.env.PAPPERS_API_KEY;
    if (!apiKey) {
      console.error("PAPPERS_API_KEY manquante dans les variables d'environnement");
      return NextResponse.json(
        { 
          error: "Configuration API manquante",
          details: "La clé API Pappers n'est pas configurée. Vérifiez que PAPPERS_API_KEY est définie dans .env.local et que le serveur a été redémarré."
        },
        { status: 500 }
      );
    }

    // Construire l'URL de recherche
    const baseUrl = "https://api.pappers.fr/v2";
    const searchParams = new URLSearchParams({
      q: q.trim(),
      par_page: Math.min(Math.max(1, parseInt(par_page.toString()) || 20), 100).toString(),
      page: Math.max(1, parseInt(page.toString()) || 1).toString(),
    });

    if (precision) {
      searchParams.append("precision", precision.toString());
    }

    const searchUrl = `${baseUrl}/recherche?${searchParams.toString()}`;

    // Utilisation du header api-key (recommandé)
    const headers = {
      "api-key": apiKey,
    };

    try {
      const searchResponse = await fetch(searchUrl, { headers });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error("Erreur API Pappers (recherche):", searchResponse.status, errorText);
        
        if (searchResponse.status === 401 || searchResponse.status === 403) {
          return NextResponse.json(
            { 
              error: "Erreur d'authentification API Pappers",
              details: "Votre clé API est invalide ou votre abonnement Pappers n'est pas actif. La recherche par nom peut nécessiter un abonnement payant."
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { 
            error: "Erreur lors de la recherche",
            details: `Erreur API Pappers (${searchResponse.status}): ${errorText}`
          },
          { status: searchResponse.status }
        );
      }

      const searchData = await searchResponse.json();

      // Formater les résultats
      const results = (searchData.resultats || []).map((result: any) => ({
        siren: result.siren || "Non disponible",
        denomination: result.nom || result.denomination || "Non disponible",
        forme_juridique: result.forme_juridique || null,
        adresse: result.adresse || null,
        code_postal: result.code_postal || null,
        ville: result.ville || null,
        code_naf: result.code_naf || null,
        libelle_code_naf: result.libelle_code_naf || null,
        date_creation: result.date_creation || null,
        statut: result.statut || null,
      }));

      return NextResponse.json({
        success: true,
        searchResults: results,
        total: searchData.total || results.length,
        page: parseInt(page.toString()) || 1,
        totalPages: searchData.total_pages || Math.ceil((searchData.total || results.length) / (parseInt(par_page.toString()) || 20)),
      });
    } catch (fetchError) {
      console.error("Erreur lors de l'appel API Pappers (recherche):", fetchError);
      return NextResponse.json(
        { 
          error: "Erreur lors de la recherche",
          details: fetchError instanceof Error ? fetchError.message : "Erreur inconnue",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur POST /api/pappers/recherche:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la recherche",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

