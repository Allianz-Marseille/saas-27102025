/**
 * API Route pour la recherche d'informations complètes d'entreprise via Societe.com
 * POST : Récupère toutes les informations disponibles sur une entreprise par SIREN/SIRET ou nom
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";

/**
 * POST /api/societe/entreprise
 * Récupère toutes les informations disponibles sur une entreprise
 * Accepte soit un SIREN/SIRET, soit un nom d'entreprise
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
    const { siren, nom } = body;

    // Validation : au moins un paramètre requis
    if (!siren && !nom) {
      return NextResponse.json(
        { error: "SIREN/SIRET ou nom d'entreprise requis" },
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
    let numId: string;

    // Si recherche par nom, d'abord rechercher le SIREN
    if (nom && !siren) {
      // Essayer plusieurs endpoints possibles pour la recherche
      const searchUrls = [
        `${baseUrl}/entreprise/search?nom=${encodeURIComponent(nom)}`,
        `${baseUrl}/societe/search?nom=${encodeURIComponent(nom)}`,
      ];

      let searchData: any = null;
      let lastError: string | null = null;

      for (const searchUrl of searchUrls) {
        try {
          const searchResponse = await fetch(searchUrl, { headers });

          if (!searchResponse.ok) {
            if (searchResponse.status === 401 || searchResponse.status === 403) {
              return NextResponse.json(
                {
                  error: "Erreur d'authentification API Societe.com",
                  details: "Vérifiez votre clé API et votre abonnement. Certaines fonctionnalités peuvent nécessiter un abonnement payant.",
                },
                { status: 401 }
              );
            }
            
            // Si 404, essayer l'autre endpoint
            if (searchResponse.status === 404) {
              lastError = `Endpoint ${searchUrl} retourne 404`;
              continue;
            }

            const errorText = await searchResponse.text();
            console.error(`Erreur recherche Societe.com (${searchResponse.status}):`, errorText);
            
            return NextResponse.json(
              { 
                error: "Erreur lors de la recherche par nom",
                details: `Status: ${searchResponse.status}. Vérifiez votre abonnement API Societe.com.`,
              },
              { status: searchResponse.status }
            );
          }

          const responseText = await searchResponse.text();
          console.log(`Réponse brute recherche Societe.com (${searchUrl}):`, responseText);
          
          try {
            searchData = JSON.parse(responseText);
            console.log("Réponse parsée recherche Societe.com:", JSON.stringify(searchData, null, 2));
          } catch (parseError) {
            console.error("Erreur parsing JSON:", parseError);
            console.error("Réponse texte:", responseText);
            lastError = `Réponse non-JSON de l'API: ${responseText.substring(0, 200)}`;
            continue;
          }
          
          // Si on a des données, sortir de la boucle
          if (searchData) break;
        } catch (err) {
          console.error(`Erreur lors de l'appel à ${searchUrl}:`, err);
          lastError = err instanceof Error ? err.message : "Erreur inconnue";
          continue;
        }
      }

      // Si on a des données de Societe.com, extraire le SIREN
      if (searchData) {
        // Log de la structure complète pour diagnostic
        console.log("Structure complète de searchData:", JSON.stringify(searchData, null, 2));
        
        // Vérifier la structure de la réponse (plusieurs formats possibles)
        let entreprises: any[] = [];
        
        if (searchData.data?.entreprises) {
          entreprises = searchData.data.entreprises;
        } else if (searchData.entreprises) {
          entreprises = searchData.entreprises;
        } else if (Array.isArray(searchData.data)) {
          entreprises = searchData.data;
        } else if (Array.isArray(searchData)) {
          entreprises = searchData;
        }
        
        // Si on a des résultats, prendre le premier
        if (entreprises && entreprises.length > 0) {
          if (entreprises.length > 1) {
            console.log(`${entreprises.length} entreprises trouvées pour "${nom}". Utilisation du premier résultat.`);
          }
          const firstResult = entreprises[0];
          numId = firstResult.siren || firstResult.numid || firstResult.siret?.substring(0, 9);
        }
      }

      // Si aucun résultat via Societe.com, essayer l'API Sirene (gouvernementale) comme fallback
      if (!numId) {
        console.log(`Recherche Societe.com échouée pour "${nom}". Tentative avec l'API Sirene (INSEE)...`);
        
        const sireneApiKey = process.env.SIRENE_API_KEY;
        if (sireneApiKey) {
          try {
            const sireneUrl = `https://api.insee.fr/api-sirene/3.11/siren?q=raisonSociale:${encodeURIComponent(nom)}&nombre=10&debut=0`;
            const sireneResponse = await fetch(sireneUrl, {
              headers: {
                "Authorization": `Bearer ${sireneApiKey}`,
                "Accept": "application/json",
              },
            });

            if (sireneResponse.ok) {
              const sireneData = await sireneResponse.json();
              console.log("Réponse API Sirene:", JSON.stringify(sireneData, null, 2));
              
              if (sireneData.unitesLegales && sireneData.unitesLegales.length > 0) {
                // Prendre le premier résultat
                const firstResult = sireneData.unitesLegales[0];
                const sirenFromSirene = firstResult.siren;
                
                if (sirenFromSirene) {
                  console.log(`✅ SIREN trouvé via API Sirene: ${sirenFromSirene}`);
                  numId = sirenFromSirene;
                  // On continue avec ce SIREN pour récupérer les infos via Societe.com
                } else {
                  console.error("SIREN introuvable dans la réponse Sirene");
                }
              } else {
                console.log("Aucun résultat trouvé via API Sirene");
              }
            } else {
              const errorText = await sireneResponse.text();
              console.error(`Erreur API Sirene (${sireneResponse.status}):`, errorText);
            }
          } catch (sireneError) {
            console.error("Erreur lors de l'appel à l'API Sirene:", sireneError);
          }
        } else {
          console.log("SIRENE_API_KEY non configurée, skip de l'API Sirene");
        }

        // Si toujours pas de SIREN trouvé, retourner une erreur
        if (!numId) {
          console.error(`Aucune donnée trouvée pour "${nom}". Dernière erreur:`, lastError);
          return NextResponse.json(
            { 
              error: `Aucune entreprise trouvée pour le nom "${nom}"`,
              details: lastError || "Vérifiez que la recherche par nom est incluse dans votre abonnement API Societe.com. Cette fonctionnalité peut nécessiter un abonnement payant.",
              suggestion: "Essayez de rechercher par SIREN/SIRET si vous le connaissez. La recherche par SIREN/SIRET est généralement disponible sans abonnement supplémentaire."
            },
            { status: 404 }
          );
        }
      }
    } else {
      // Recherche par SIREN/SIRET
      if (!siren || typeof siren !== "string") {
        return NextResponse.json(
          { error: "SIREN manquant ou invalide" },
          { status: 400 }
        );
      }

      // Validation format SIREN (9 chiffres) ou SIRET (14 chiffres)
      const cleanedSiren = siren.replace(/\s+/g, "").replace(/\D/g, "");
      numId = cleanedSiren.length === 14 ? cleanedSiren : cleanedSiren.substring(0, 9);
      
      if (numId.length !== 9 && cleanedSiren.length !== 14) {
        return NextResponse.json(
          { error: "Le SIREN doit contenir 9 chiffres ou le SIRET 14 chiffres" },
          { status: 400 }
        );
      }
    }

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
