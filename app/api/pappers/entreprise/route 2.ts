/**
 * API Route pour la recherche d'informations complètes d'entreprise via Pappers
 * POST : Récupère toutes les informations disponibles sur une entreprise par SIREN/SIRET
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * POST /api/pappers/entreprise
 * Récupère toutes les informations disponibles sur une entreprise
 * Accepte soit un SIREN/SIRET
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
    const { siren, selectedSiren } = body;

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

    // Utilisation du header api-key (recommandé)
    const headers = {
      "api-key": apiKey,
    };

    const baseUrl = "https://api.pappers.fr/v2";
    let numId: string | undefined;

    // Si un SIREN a été sélectionné depuis les résultats de recherche, l'utiliser
    if (selectedSiren) {
      const cleanedSiren = selectedSiren.replace(/\s+/g, "").replace(/\D/g, "");
      const extractedSiren = cleanedSiren.length === 14 ? cleanedSiren.substring(0, 9) : cleanedSiren;
      
      if (extractedSiren.length !== 9) {
        return NextResponse.json(
          { error: "Le SIREN sélectionné est invalide" },
          { status: 400 }
        );
      }
      
      numId = extractedSiren;
    }
    // Si recherche par SIREN/SIRET
    else if (siren) {
      // Validation format SIREN (9 chiffres) ou SIRET (14 chiffres)
      const cleanedSiren = siren.replace(/\s+/g, "").replace(/\D/g, "");
      const extractedSiren = cleanedSiren.length === 14 ? cleanedSiren.substring(0, 9) : cleanedSiren;
      
      if (extractedSiren.length !== 9 && cleanedSiren.length !== 14) {
        return NextResponse.json(
          { error: "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres" },
          { status: 400 }
        );
      }
      
      numId = extractedSiren;
    }
    // Validation : au moins un paramètre requis
    else {
      return NextResponse.json(
        { error: "SIREN/SIRET requis" },
        { status: 400 }
      );
    }

    // Si numId n'est pas défini à ce stade, c'est une erreur
    if (!numId) {
      return NextResponse.json(
        { error: "SIREN/SIRET manquant ou invalide" },
        { status: 400 }
      );
    }

    // Appel API Pappers pour toutes les informations de l'entreprise
    // L'endpoint /entreprise retourne toutes les données en une seule requête
    const entrepriseUrl = `${baseUrl}/entreprise?siren=${numId}`;
    
    try {
      const entrepriseResponse = await fetch(entrepriseUrl, { headers });

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

      const entrepriseData = await entrepriseResponse.json();

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

      // Structurer les données pour le frontend
      return NextResponse.json({
        success: true,
        data: {
          // Informations de base
          entreprise: {
            denomination: entrepriseData.denomination || "Non disponible",
            sigle: entrepriseData.sigle || null,
            forme_juridique: entrepriseData.forme_juridique || "Non disponible",
            adresse: adresse.trim() || "Non disponible",
            siren: entrepriseData.siren || numId,
            siret_siege: entrepriseData.siret_siege || null,
            rcs: entrepriseData.rcs || null,
            num_tva_intracommunautaire: entrepriseData.num_tva_intracommunautaire || null,
            code_naf: entrepriseData.code_naf || null,
            libelle_code_naf: entrepriseData.libelle_code_naf || null,
            date_creation: entrepriseData.date_creation || null,
            date_creation_formatee: entrepriseData.date_creation_formatee || null,
            duree_personne_morale: entrepriseData.duree_personne_morale || null,
            date_cloture: entrepriseData.date_cloture || null,
            date_cloture_formatee: entrepriseData.date_cloture_formatee || null,
            statut: entrepriseData.statut || null,
            capital: entrepriseData.capital || null,
            capital_formate: entrepriseData.capital_formate || null,
            devise_capital: entrepriseData.devise_capital || null,
            tranche_effectif: entrepriseData.tranche_effectif || null,
            effectif: entrepriseData.effectif || null,
            effectif_min: entrepriseData.effectif_min || null,
            effectif_max: entrepriseData.effectif_max || null,
            annee_effectif: entrepriseData.annee_effectif || null,
            // Coordonnées géographiques
            latitude: entrepriseData.latitude || null,
            longitude: entrepriseData.longitude || null,
            // Adresse détaillée
            adresse_complete: entrepriseData.adresse || entrepriseData.siege || null,
            siege: entrepriseData.siege || null,
          },
          // Bénéficiaires effectifs
          beneficiaires_effectifs: (entrepriseData.beneficiaires_effectifs || []).map((b: any) => ({
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
          // Dirigeants
          dirigeants: (entrepriseData.dirigeants || []).map((d: any) => ({
            nom: d.nom || "Non disponible",
            prenom: d.prenom || "Non disponible",
            nom_complet: d.nom_complet || `${d.prenom || ""} ${d.nom || ""}`.trim() || "Non disponible",
            date_naissance: d.date_de_naissance_formatee || d.date_de_naissance_complete_formatee || null,
            nationalite: d.nationalite || null,
            fonction: d.fonction || d.qualite || "Non disponible",
            date_debut: d.date_debut || null,
            date_debut_formatee: d.date_debut_formatee || null,
            date_fin: d.date_fin || null,
            date_fin_formatee: d.date_fin_formatee || null,
            pourcentage_parts: d.pourcentage_parts || null,
          })),
          // Bilans
          bilans: (entrepriseData.bilans || []).map((b: any) => ({
            annee: b.annee || b.annee_bilan || null,
            date_cloture: b.date_cloture || b.date_cloture_exercice || null,
            date_cloture_formatee: b.date_cloture_formatee || null,
            type_bilan: b.type_bilan || null,
            chiffre_affaires: b.chiffre_affaires || b.ca || null,
            resultat_net: b.resultat_net || null,
            actif_total: b.actif_total || null,
            passif_total: b.passif_total || null,
            effectif: b.effectif || null,
            devise: b.devise || "EUR",
          })),
          // Établissements
          etablissements: (entrepriseData.etablissements || []).map((e: any) => ({
            siret: e.siret || "Non disponible",
            denomination: e.denomination || "Non disponible",
            adresse: e.adresse || null,
            adresse_ligne_1: e.adresse_ligne_1 || null,
            adresse_ligne_2: e.adresse_ligne_2 || null,
            code_postal: e.code_postal || null,
            ville: e.ville || null,
            code_naf: e.code_naf || null,
            libelle_code_naf: e.libelle_code_naf || null,
            type: e.type || null,
            date_creation: e.date_creation || null,
            date_creation_formatee: e.date_creation_formatee || null,
            statut: e.statut || null,
          })),
          // Procédures collectives
          procedures_collectives: (entrepriseData.procedures_collectives || []).map((p: any) => ({
            type: p.type || p.type_procedure || "Non disponible",
            date_ouverture: p.date_ouverture || p.date_debut || null,
            date_ouverture_formatee: p.date_ouverture_formatee || null,
            date_cloture: p.date_cloture || p.date_fin || null,
            date_cloture_formatee: p.date_cloture_formatee || null,
            tribunal: p.tribunal || null,
            administrateur: p.administrateur || p.nom_administrateur || null,
            statut: p.statut || null,
          })),
          // Événements
          evenements: (entrepriseData.evenements || []).map((e: any) => ({
            date: e.date || e.date_evenement || null,
            date_formatee: e.date_formatee || e.date_evenement_formatee || null,
            libelle: e.libelle || e.label || "Non disponible",
            type: e.type || e.type_evenement || null,
          })),
          // Filiales et participations
          filiales: (entrepriseData.filiales || []).map((f: any) => ({
            siren: f.siren || "Non disponible",
            denomination: f.denomination || "Non disponible",
            pourcentage: f.pourcentage || f.pourcentage_detention || null,
            type: f.type || null,
          })),
          participations: (entrepriseData.participations || []).map((p: any) => ({
            siren: p.siren || "Non disponible",
            denomination: p.denomination || "Non disponible",
            pourcentage: p.pourcentage || p.pourcentage_detention || null,
            type: p.type || null,
          })),
          // Marques
          marques: (entrepriseData.marques || []).map((m: any) => ({
            nom: m.nom || "Non disponible",
            numero: m.numero || m.numero_enregistrement || null,
            date_depot: m.date_depot || null,
            date_depot_formatee: m.date_depot_formatee || null,
            date_expiration: m.date_expiration || null,
            date_expiration_formatee: m.date_expiration_formatee || null,
            statut: m.statut || null,
            en_vigueur: m.en_vigueur || m.isvigueur || false,
          })),
          // Documents (si disponibles)
          documents: entrepriseData.documents || [],
        },
      });
    } catch (fetchError) {
      console.error("Erreur lors de l'appel API Pappers:", fetchError);
      return NextResponse.json(
        { 
          error: "Erreur lors de la récupération des informations",
          details: fetchError instanceof Error ? fetchError.message : "Erreur inconnue",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur POST /api/pappers/entreprise:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la recherche des informations de l'entreprise",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

