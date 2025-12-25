/**
 * API Route pour récupérer les conventions collectives selon le code APE/NAF
 * POST : Récupère la convention collective via code APE, SIREN ou SIRET
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * POST /api/conventions-collectives
 * Récupère la convention collective selon :
 * - codeApe : Code APE/NAF (ex: "6201Z")
 * - siren : SIREN de l'entreprise (9 chiffres)
 * - siret : SIRET de l'entreprise (14 chiffres)
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
    const { codeApe, siren, siret } = body;

    // Validation : au moins un paramètre requis
    if (!codeApe && !siren && !siret) {
      return NextResponse.json(
        { error: "Code APE, SIREN ou SIRET requis" },
        { status: 400 }
      );
    }

    // Vérifier la clé API Societe.com
    const apiKey = process.env.SOCIETE_API_KEY;
    if (!apiKey) {
      console.error("SOCIETE_API_KEY manquante dans les variables d'environnement");
      return NextResponse.json(
        { 
          error: "Configuration API manquante",
          details: "La clé API Societe.com n'est pas configurée. Vérifiez que SOCIETE_API_KEY est définie dans .env.local et que le serveur a été redémarré."
        },
        { status: 500 }
      );
    }

    const headers = {
      "X-Authorization": `socapi ${apiKey}`,
    };

    const baseUrl = "https://api.societe.com/api/v1";
    let numId: string | undefined;

    // Si SIREN/SIRET fourni, l'utiliser pour récupérer les infos complètes
    if (siren || siret) {
      const cleaned = (siren || siret).replace(/\s+/g, "").replace(/\D/g, "");
      numId = cleaned.length === 14 ? cleaned.substring(0, 9) : cleaned;
      
      if (!numId || numId.length !== 9) {
        return NextResponse.json(
          { error: "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres" },
          { status: 400 }
        );
      }

      // Appel API Societe.com pour récupérer les infos légales (contient code APE et convention collective)
      try {
        const infosLegalesResponse = await fetch(
          `${baseUrl}/entreprise/${numId}/infoslegales`,
          { headers }
        );

        if (!infosLegalesResponse.ok) {
          if (infosLegalesResponse.status === 401 || infosLegalesResponse.status === 403) {
            return NextResponse.json(
              {
                error: "Erreur d'authentification API Societe.com",
                details: "Vérifiez votre clé API et votre abonnement.",
              },
              { status: 401 }
            );
          }

          if (infosLegalesResponse.status === 404) {
            return NextResponse.json(
              { error: "Entreprise non trouvée pour ce SIREN/SIRET" },
              { status: 404 }
            );
          }

          const errorText = await infosLegalesResponse.text();
          console.error(`Erreur API Societe.com (${infosLegalesResponse.status}):`, errorText);
          
          return NextResponse.json(
            { 
              error: "Erreur lors de la récupération des informations",
              details: `Status: ${infosLegalesResponse.status}`,
            },
            { status: infosLegalesResponse.status }
          );
        }

        const infosLegalesData = await infosLegalesResponse.json();
        const infosLegales = infosLegalesData.infolegales;

        if (!infosLegales) {
          return NextResponse.json(
            { error: "Informations légales non disponibles pour cette entreprise" },
            { status: 404 }
          );
        }

        // Extraire les informations de convention collective
        const codeApeFromApi = infosLegales.nafrcs || infosLegales.code_naf || null;
        const idcc = infosLegales.idcc || null;
        const libidcc = infosLegales.libidcc || infosLegales.libelle_idcc || null;

        return NextResponse.json({
          success: true,
          data: {
            code_ape: codeApeFromApi,
            code_ape_libelle: infosLegales.libnafrcs || infosLegales.libelle_code_naf || null,
            convention_collective: {
              idcc: idcc,
              libelle: libidcc,
            },
            entreprise: {
              siren: numId,
              denomination: infosLegales.denomination || null,
            },
            source: "societe.com",
          },
        });
      } catch (fetchError) {
        console.error("Erreur lors de l'appel API Societe.com:", fetchError);
        return NextResponse.json(
          { 
            error: "Erreur lors de la récupération des informations",
            details: fetchError instanceof Error ? fetchError.message : "Erreur inconnue",
          },
          { status: 500 }
        );
      }
    }

    // Si seulement code APE fourni, on ne peut pas récupérer directement la convention collective
    // car l'API Societe.com nécessite un SIREN. On retourne une erreur explicative.
    if (codeApe && !siren && !siret) {
      return NextResponse.json(
        { 
          error: "Pour récupérer la convention collective, un SIREN ou SIRET est nécessaire",
          details: "L'API Societe.com nécessite un SIREN/SIRET pour récupérer les informations de convention collective. Le code APE seul ne suffit pas.",
          suggestion: "Fournissez un SIREN ou SIRET, ou utilisez l'endpoint /api/societe/entreprise pour récupérer toutes les informations d'une entreprise."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Paramètres invalides" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur POST /api/conventions-collectives:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de la convention collective",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

