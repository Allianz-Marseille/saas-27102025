import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    
    // Vérifier que l'utilisateur est admin
    const userRecord = await getAuth(adminApp).getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims;
    
    if (customClaims?.role !== "ADMINISTRATEUR") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // TODO: Récupérer la liste des documents depuis Firestore
    // Pour l'instant, retourner une liste vide
    return NextResponse.json({
      documents: [],
      total: 0,
    });
  } catch (error) {
    console.error("Erreur API documents:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des documents",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

