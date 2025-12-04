import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID du document
    const { id: documentId } = await context.params;

    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Vérifier que l'utilisateur est admin
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData?.active || userData?.role !== "ADMINISTRATEUR") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // Récupérer les tags depuis le body
    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Le champ 'tags' doit être un tableau" },
        { status: 400 }
      );
    }

    // Valider que tous les tags sont des strings
    if (!tags.every((tag) => typeof tag === "string")) {
      return NextResponse.json(
        { error: "Tous les tags doivent être des chaînes de caractères" },
        { status: 400 }
      );
    }

    // Vérifier que le document existe
    const docRef = adminDb.collection("rag_documents").doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour les tags (si vide, on supprime le champ)
    if (tags.length > 0) {
      await docRef.update({ tags });
    } else {
      // Supprimer le champ tags s'il est vide
      const data = docSnapshot.data();
      if (data?.tags) {
        await docRef.update({ tags: [] }); // On garde un tableau vide plutôt que de supprimer
      }
    }

    return NextResponse.json({
      success: true,
      documentId,
      tags,
      message: "Tags mis à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur mise à jour tags:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour des tags",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

