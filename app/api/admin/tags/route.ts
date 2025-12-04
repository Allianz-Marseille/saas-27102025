import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import type { Tag, CreateTagInput } from "@/types/tag";

export const dynamic = "force-dynamic";

/**
 * GET - Récupérer tous les tags
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Vérifier le rôle admin
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer tous les tags
    const tagsSnapshot = await adminDb
      .collection("rag_tags")
      .orderBy("name", "asc")
      .get();

    const tags: Tag[] = tagsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        usageCount: data.usageCount || 0,
      };
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Erreur GET /api/admin/tags:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tags" },
      { status: 500 }
    );
  }
}

/**
 * POST - Créer un nouveau tag
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Vérifier le rôle admin
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData?.role !== "ADMINISTRATEUR") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les données du body
    const body: CreateTagInput = await request.json();
    const { name, emoji, color } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nom du tag requis" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "Nom du tag trop long (max 50 caractères)" }, { status: 400 });
    }

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "Emoji requis" }, { status: 400 });
    }

    if (!color || typeof color !== "string") {
      return NextResponse.json({ error: "Couleur requise" }, { status: 400 });
    }

    // Vérifier l'unicité du nom (case-insensitive)
    const existingTagSnapshot = await adminDb
      .collection("rag_tags")
      .where("name", "==", name.trim().toLowerCase())
      .get();

    if (!existingTagSnapshot.empty) {
      return NextResponse.json(
        { error: "Un tag avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Créer le tag
    const now = new Date();
    const tagData = {
      name: name.trim().toLowerCase(),
      emoji: emoji.trim(),
      color: color.trim(),
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    };

    const tagRef = await adminDb.collection("rag_tags").add(tagData);

    const newTag: Tag = {
      id: tagRef.id,
      name: tagData.name,
      emoji: tagData.emoji,
      color: tagData.color,
      createdAt: tagData.createdAt.toISOString(),
      updatedAt: tagData.updatedAt.toISOString(),
      usageCount: tagData.usageCount,
    };

    return NextResponse.json({ tag: newTag }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/admin/tags:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du tag" },
      { status: 500 }
    );
  }
}

