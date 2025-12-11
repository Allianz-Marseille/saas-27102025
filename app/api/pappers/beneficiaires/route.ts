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
  siege?: {
    adresse_ligne_1?: string;
    adresse_ligne_2?: string;
    code_postal?: string;
    ville?: string;
  };
  siren?: string;
  beneficiaires_effectifs?: PappersBeneficiaire[];
}

interface PappersBeneficiaire {
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  date_de_naissance_formatee?: string;
  date_de_naissance_complete_formatee?: string;
  nationalite?: string;
  pourcentage_parts?: number;
  pourcentage_votes?: number;
  pourcentage_parts_directes?: number;
  pourcentage_parts_indirectes?: number;
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
      console.error("Variables d'environnement disponibles:", Object.keys(process.env).filter(k => k.includes('PAPPERS')));
      return NextResponse.json(
        { 
          error: "Configuration API manquante",
          details: "La clé API Pappers n'est pas configurée. Vérifiez que PAPPERS_API_KEY est définie dans .env.local et que le serveur a été redémarré."
        },
        { status: 500 }
      );
    }

    // Appel API Pappers pour les informations de l'entreprise
    // Utilisation du header api-key (recommandé) au lieu du paramètre query api_token (déconseillé)
    const entrepriseUrl = `https://api.pappers.fr/v2/entreprise?siren=${siren}`;
    const entrepriseResponse = await fetch(entrepriseUrl, {
      headers: {
        "api-key": apiKey,
      },
    });

    if (!entrepriseResponse.ok) {
      const errorText = await entrepriseResponse.text();
      console.error("Erreur API Pappers (entreprise):", entrepriseResponse.status, errorText);
      
      if (entrepriseResponse.status === 401 || entrepriseResponse.status === 403) {
        return NextResponse.json(
          { 
            error: "Erreur d'authentification API Pappers",
            details: "Votre clé API est invalide ou votre abonnement Pappers n'est pas actif. Vérifiez votre abonnement sur https://www.pappers.fr"
          },
          { status: 401 }
        );
      }
      
      if (entrepriseResponse.status === 404) {
        return NextResponse.json(
          { error: "Entreprise non trouvée pour ce SIREN" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: "Erreur lors de la récupération des informations de l'entreprise",
          details: `Erreur API Pappers (${entrepriseResponse.status}): ${errorText}`
        },
        { status: entrepriseResponse.status }
      );
    }

    const entrepriseData: PappersEntrepriseResponse = await entrepriseResponse.json();

    // Les bénéficiaires effectifs sont inclus dans la réponse de /entreprise
    // dans le champ beneficiaires_effectifs (nécessite une habilitation pour les données complètes)
    const beneficiaires: PappersBeneficiaire[] = entrepriseData.beneficiaires_effectifs || [];

    // Formater l'adresse (priorité au siège, sinon adresse directe)
    let adresse = "";
    if (entrepriseData.siege) {
      const adresseParts = [
        entrepriseData.siege.adresse_ligne_1,
        entrepriseData.siege.adresse_ligne_2,
        entrepriseData.siege.code_postal,
        entrepriseData.siege.ville,
      ].filter(Boolean);
      adresse = adresseParts.join(" ");
    } else if (entrepriseData.adresse) {
      adresse = [
        entrepriseData.adresse.numero_voie,
        entrepriseData.adresse.type_voie,
        entrepriseData.adresse.libelle_voie,
      ]
        .filter(Boolean)
        .join(" ") +
        (entrepriseData.adresse.code_postal ? " " + entrepriseData.adresse.code_postal : "") +
        (entrepriseData.adresse.ville ? " " + entrepriseData.adresse.ville : "");
    }

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
          nom_complet: b.nom_complet || `${b.prenom || ""} ${b.nom || ""}`.trim() || "Non disponible",
          date_naissance: b.date_de_naissance_complete_formatee || b.date_de_naissance_formatee || "Non disponible",
          nationalite: b.nationalite || "Non disponible",
          pourcentage_parts: b.pourcentage_parts || 0,
          pourcentage_parts_directes: b.pourcentage_parts_directes || 0,
          pourcentage_parts_indirectes: b.pourcentage_parts_indirectes || 0,
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
