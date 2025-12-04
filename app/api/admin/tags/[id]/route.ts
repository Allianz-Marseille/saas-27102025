import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import type { UpdateTagInput } from "@/types/tag";

export const dynamic = "force-dynamic";

/**
 * PATCH - Modifier un tag existant
 * Met à jour automatiquement tous les documents utilisant ce tag
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tagId = params.id;

    // Vérifier que le tag existe
    const tagRef = adminDb.collection("rag_tags").doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    const oldTagData = tagDoc.data()!;
    const oldName = oldTagData.name;

    // Récupérer les données du body
    const body: UpdateTagInput = await request.json();
    const { name, emoji, color } = body;

    // Construire les données de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (emoji !== undefined) {
      if (typeof emoji !== "string" || emoji.trim().length === 0) {
        return NextResponse.json({ error: "Emoji invalide" }, { status: 400 });
      }
      updateData.emoji = emoji.trim();
    }

    if (color !== undefined) {
      if (typeof color !== "string" || color.trim().length === 0) {
        return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
      }
      updateData.color = color.trim();
    }

    let newName = oldName;
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Nom du tag invalide" }, { status: 400 });
      }

      if (name.length > 50) {
        return NextResponse.json(
          { error: "Nom du tag trop long (max 50 caractères)" },
          { status: 400 }
        );
      }

      newName = name.trim().toLowerCase();

      // Vérifier l'unicité si le nom change
      if (newName !== oldName) {
        const existingTagSnapshot = await adminDb
          .collection("rag_tags")
          .where("name", "==", newName)
          .get();

        if (!existingTagSnapshot.empty) {
          return NextResponse.json(
            { error: "Un tag avec ce nom existe déjà" },
            { status: 409 }
          );
        }

        updateData.name = newName;
      }
    }

    // Mettre à jour le tag
    await tagRef.update(updateData);

    // Si le nom a changé, mettre à jour tous les documents
    let documentsUpdated = 0;
    if (newName !== oldName) {
      console.log(`[Tags] Mise à jour en cascade: "${oldName}" → "${newName}"`);

      // Récupérer tous les documents avec l'ancien tag
      const documentsSnapshot = await adminDb
        .collection("rag_documents")
        .where("tags", "array-contains", oldName)
        .get();

      console.log(`[Tags] ${documentsSnapshot.size} document(s) à mettre à jour`);

      // Mettre à jour chaque document
      const batch = adminDb.batch();
      documentsSnapshot.docs.forEach((doc) => {
        const docData = doc.data();
        const tags = docData.tags || [];
        
        // Remplacer l'ancien nom par le nouveau
        const updatedTags = tags.map((tag: string) =>
          tag === oldName ? newName : tag
        );

        batch.update(doc.ref, { tags: updatedTags });
        documentsUpdated++;
      });

      await batch.commit();
      console.log(`[Tags] ${documentsUpdated} document(s) mis à jour avec succès`);
    }

    // Récupérer le tag mis à jour
    const updatedTagDoc = await tagRef.get();
    const updatedTagData = updatedTagDoc.data()!;

    return NextResponse.json({
      tag: {
        id: tagId,
        name: updatedTagData.name,
        emoji: updatedTagData.emoji,
        color: updatedTagData.color,
        createdAt: updatedTagData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: updatedTagData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        usageCount: updatedTagData.usageCount || 0,
      },
      documentsUpdated,
    });
  } catch (error) {
    console.error("Erreur PATCH /api/admin/tags/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du tag" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprimer un tag
 * Retire automatiquement le tag de tous les documents
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tagId = params.id;

    // Vérifier que le tag existe
    const tagRef = adminDb.collection("rag_tags").doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    const tagData = tagDoc.data()!;
    const tagName = tagData.name;

    console.log(`[Tags] Suppression du tag: "${tagName}"`);

    // Récupérer tous les documents avec ce tag
    const documentsSnapshot = await adminDb
      .collection("rag_documents")
      .where("tags", "array-contains", tagName)
      .get();

    console.log(`[Tags] ${documentsSnapshot.size} document(s) à mettre à jour`);

    // Retirer le tag de chaque document
    const batch = adminDb.batch();
    let documentsUpdated = 0;

    documentsSnapshot.docs.forEach((doc) => {
      const docData = doc.data();
      const tags = docData.tags || [];

      // Filtrer pour retirer le tag
      const updatedTags = tags.filter((tag: string) => tag !== tagName);

      batch.update(doc.ref, { tags: updatedTags });
      documentsUpdated++;
    });

    await batch.commit();
    console.log(`[Tags] ${documentsUpdated} document(s) mis à jour`);

    // Supprimer le tag
    await tagRef.delete();
    console.log(`[Tags] Tag "${tagName}" supprimé avec succès`);

    return NextResponse.json({
      message: "Tag supprimé avec succès",
      documentsUpdated,
    });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/tags/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du tag" },
      { status: 500 }
    );
  }
}

