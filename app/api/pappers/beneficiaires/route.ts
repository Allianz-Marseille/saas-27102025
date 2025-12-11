/**
 * API Route pour la recherche de bénéficiaires effectifs via Pappers
 * POST : Recherche les bénéficiaires effectifs d'une entreprise par SIREN
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

interface PappersEntrepriseResponse {
  denomination?: string;
  forme_juridique?: string;
  adresse?: {
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    code_postal?: string;
    ville?: string;
  };
  siren?: string;
}

interface PappersBeneficiaire {
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  nationalite?: string;
  qualite?: string;
  pourcentage_parts?: number;
  pourcentage_votes?: number;
}

interface PappersBeneficiairesResponse {
  beneficiaires?: PappersBeneficiaire[];
}

/**
 * POST /api/pappers/beneficiaires
 * Recherche les bénéficiaires effectifs d'une entreprise
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

    // Validation format SIREN (9 chiffres)
    const sirenRegex = /^\d{9}$/;
    if (!sirenRegex.test(siren)) {
      return NextResponse.json(
        { error: "Le SIREN doit contenir exactement 9 chiffres" },
        { status: 400 }
      );
    }

    // Vérifier la clé API Pappers
    const apiKey = process.env.PAPPERS_API_KEY;
    if (!apiKey) {
      console.error("PAPPERS_API_KEY manquante dans les variables d'environnement");
      return NextResponse.json(
        { error: "Configuration API manquante" },
        { status: 500 }
      );
    }

    // Appel API Pappers pour les informations de l'entreprise
    const entrepriseUrl = `https://api.pappers.fr/v2/entreprise?api_token=${apiKey}&siren=${siren}`;
    const entrepriseResponse = await fetch(entrepriseUrl);

    if (!entrepriseResponse.ok) {
      const errorText = await entrepriseResponse.text();
      console.error("Erreur API Pappers (entreprise):", entrepriseResponse.status, errorText);
      
      if (entrepriseResponse.status === 404) {
        return NextResponse.json(
          { error: "Entreprise non trouvée pour ce SIREN" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Erreur lors de la récupération des informations de l'entreprise" },
        { status: entrepriseResponse.status }
      );
    }

    const entrepriseData: PappersEntrepriseResponse = await entrepriseResponse.json();

    // Appel API Pappers pour les bénéficiaires effectifs
    const beneficiairesUrl = `https://api.pappers.fr/v2/beneficiaires?api_token=${apiKey}&siren=${siren}`;
    const beneficiairesResponse = await fetch(beneficiairesUrl);

    let beneficiaires: PappersBeneficiaire[] = [];

    if (beneficiairesResponse.ok) {
      const beneficiairesData: PappersBeneficiairesResponse = await beneficiairesResponse.json();
      beneficiaires = beneficiairesData.beneficiaires || [];
    } else {
      // Si l'endpoint bénéficiaires n'est pas disponible ou retourne une erreur,
      // on continue avec les données de l'entreprise seulement
      console.warn("Impossible de récupérer les bénéficiaires effectifs:", beneficiairesResponse.status);
    }

    // Formater l'adresse
    const adresse = entrepriseData.adresse
      ? [
          entrepriseData.adresse.numero_voie,
          entrepriseData.adresse.type_voie,
          entrepriseData.adresse.libelle_voie,
        ]
          .filter(Boolean)
          .join(" ") +
        (entrepriseData.adresse.code_postal || "") +
        " " +
        (entrepriseData.adresse.ville || "")
      : "";

    // Retourner les données structurées
    return NextResponse.json({
      success: true,
      data: {
        entreprise: {
          denomination: entrepriseData.denomination || "Non disponible",
          forme_juridique: entrepriseData.forme_juridique || "Non disponible",
          adresse: adresse.trim() || "Non disponible",
          siren: entrepriseData.siren || siren,
        },
        beneficiaires: beneficiaires.map((b) => ({
          nom: b.nom || "Non disponible",
          prenom: b.prenom || "Non disponible",
          date_naissance: b.date_naissance || "Non disponible",
          nationalite: b.nationalite || "Non disponible",
          qualite: b.qualite || "Non disponible",
          pourcentage_parts: b.pourcentage_parts || 0,
          pourcentage_votes: b.pourcentage_votes || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/pappers/beneficiaires:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la recherche des bénéficiaires effectifs",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
