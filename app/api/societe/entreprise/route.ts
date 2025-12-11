/**
 * API Route pour la recherche d'informations complètes d'entreprise via Societe.com
 * POST : Récupère toutes les informations disponibles sur une entreprise par SIREN/SIRET
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * POST /api/societe/entreprise
 * Récupère toutes les informations disponibles sur une entreprise
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Récupérer le SIREN depuis le body
    const body = await request.json();
    const { siren } = body;

    // Validation du SIREN
    if (!siren || typeof siren !== "string") {
      return NextResponse.json(
        { error: "SIREN manquant ou invalide" },
        { status: 400 }
      );
    }

    // Validation format SIREN (9 chiffres) ou SIRET (14 chiffres)
    const cleanedSiren = siren.replace(/\s+/g, "").replace(/\D/g, "");
    const numId = cleanedSiren.length === 14 ? cleanedSiren : cleanedSiren.substring(0, 9);
    
    if (numId.length !== 9 && cleanedSiren.length !== 14) {
      return NextResponse.json(
        { error: "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres" },
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

    // Utilisation du header X-Authorization (recommandé)
    const headers = {
      "X-Authorization": `socapi ${apiKey}`,
    };

    const baseUrl = "https://api.societe.com/api/v1";

    // Appels API en parallèle pour toutes les informations
    const [
      existenceResponse,
      infosLegalesResponse,
      dirigeantsResponse,
      bilansResponse,
      etablissementsResponse,
      proceduresResponse,
      evenementsResponse,
      scoringResponse,
      contactResponse,
      marquesResponse,
      documentsResponse,
    ] = await Promise.allSettled([
      fetch(`${baseUrl}/entreprise/${numId}/exist`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/infoslegales`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/dirigeants`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/bilans`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/etablissements`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/procedurescollectives`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/evenements`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/scoring`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/contact`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/marques`, { headers }),
      fetch(`${baseUrl}/entreprise/${numId}/documents-officiels`, { headers }),
    ]);

    // Traitement des réponses
    const processResponse = async (response: PromiseSettledResult<Response>, name: string) => {
      if (response.status === "fulfilled" && response.value.ok) {
        try {
          return await response.value.json();
        } catch {
          return null;
        }
      } else if (response.status === "fulfilled") {
        const status = response.value.status;
        if (status === 401 || status === 403) {
          // Erreur d'authentification - on la propage pour l'afficher à l'utilisateur
          throw new Error(`Erreur d'authentification API Societe.com pour ${name}. Vérifiez votre clé API et votre abonnement.`);
        } else if (status === 404) {
          return null; // Données non disponibles, pas une erreur
        } else {
          console.warn(`Erreur lors de la récupération de ${name}:`, status);
          return null;
        }
      } else {
        console.warn(`Erreur lors de la récupération de ${name}:`, response.reason);
        return null;
      }
    };

    let existence, infosLegales, dirigeants, bilans, etablissements, procedures, evenements, scoring, contact, marques, documents;

    try {
      [
        existence,
        infosLegales,
        dirigeants,
        bilans,
        etablissements,
        procedures,
        evenements,
        scoring,
        contact,
        marques,
        documents,
      ] = await Promise.all([
        processResponse(existenceResponse, "existence"),
        processResponse(infosLegalesResponse, "infosLegales"),
        processResponse(dirigeantsResponse, "dirigeants"),
        processResponse(bilansResponse, "bilans"),
        processResponse(etablissementsResponse, "etablissements"),
        processResponse(proceduresResponse, "procedures"),
        processResponse(evenementsResponse, "evenements"),
        processResponse(scoringResponse, "scoring"),
        processResponse(contactResponse, "contact"),
        processResponse(marquesResponse, "marques"),
        processResponse(documentsResponse, "documents"),
      ]);
    } catch (authError) {
      // Erreur d'authentification détectée
      if (authError instanceof Error && authError.message.includes("authentification")) {
        return NextResponse.json(
          {
            error: "Erreur d'authentification API Societe.com",
            details: authError.message,
          },
          { status: 401 }
        );
      }
      throw authError; // Re-lancer les autres erreurs
    }

    // Vérifier qu'on a au moins les informations de base
    if (!existence && !infosLegales) {
      return NextResponse.json(
        { error: "Entreprise non trouvée pour ce SIREN/SIRET" },
        { status: 404 }
      );
    }

    // Retourner toutes les données structurées
    return NextResponse.json({
      success: true,
      data: {
        existence: existence?.common || null,
        infosLegales: infosLegales?.infolegales || null,
        dirigeants: dirigeants?.data || null,
        bilans: bilans?.data || null,
        etablissements: etablissements?.data || null,
        procedures: procedures?.data || null,
        evenements: evenements?.data || null,
        scoring: scoring?.data || null,
        contact: contact?.data?.contact || null,
        marques: marques?.data || null,
        documents: documents?.data?.doc_officiel || null,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/societe/entreprise:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la recherche des informations de l'entreprise",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
