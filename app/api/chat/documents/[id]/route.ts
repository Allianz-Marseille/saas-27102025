import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage, adminDb } from "@/lib/firebase/admin-config";
import { ragConfig } from "@/lib/config/rag-config";
import { deleteDocumentVectors, checkQdrantHealth } from "@/lib/rag/qdrant-client";

export const dynamic = "force-dynamic";

/**
 * Génère un ID de trace unique pour le logging
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log structuré avec trace ID
 */
function logWithTrace(traceId: string, message: string, data?: Record<string, unknown>) {
  console.log(`[${traceId}] ${message}`, data || {});
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const traceId = generateTraceId();
  const startTime = Date.now();
  let qdrantDeleted = false;
  let storageDeleted = false;
  let firestoreDeleted = false;
  let documentData: any = null;
  let storagePath: string | null = null;

  try {
    logWithTrace(traceId, "Début suppression document");

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
    
    // Vérifier que l'utilisateur est admin (rôle stocké dans Firestore, pas customClaims)
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData?.active) {
      return NextResponse.json(
        { error: "Compte désactivé" },
        { status: 403 }
      );
    }

    if (userData?.role !== "ADMINISTRATEUR") {
      return NextResponse.json(
        { error: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    // Dans Next.js 16, params est une Promise
    const params = await context.params;
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    logWithTrace(traceId, "Document ID reçu", { documentId });

    // Vérification préalable : santé de Qdrant
    logWithTrace(traceId, "Vérification santé Qdrant...");
    const qdrantHealth = await checkQdrantHealth();
    if (!qdrantHealth.healthy) {
      logWithTrace(traceId, "Qdrant non disponible", { error: qdrantHealth.error });
      // On continue quand même, on peut supprimer Storage et Firestore
    }

    // Récupérer les métadonnées du document depuis Firestore
    const docRef = adminDb.collection("rag_documents").doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: "Document non trouvé dans Firestore" },
        { status: 404 }
      );
    }

    documentData = docSnapshot.data();
    if (!documentData) {
      return NextResponse.json(
        { error: "Données du document invalides" },
        { status: 400 }
      );
    }

    logWithTrace(traceId, "Document trouvé", {
      filename: documentData.filename,
      fileUrl: documentData.fileUrl,
    });

    // Extraire le chemin Storage
    const fileUrl = documentData.fileUrl as string;
    if (fileUrl) {
      const urlParts = fileUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      storagePath = `${ragConfig.storage.folder}/${fileName}`;
    }

    // Supprimer dans l'ordre : Qdrant, Storage, Firestore
    const errors: string[] = [];

    // 1. Supprimer les vecteurs de Qdrant
    logWithTrace(traceId, "Étape 1/3: Suppression vecteurs Qdrant");
    try {
      await deleteDocumentVectors(documentId);
      qdrantDeleted = true;
      logWithTrace(traceId, "Vecteurs Qdrant supprimés");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur suppression Qdrant", { error: errorMessage });
      errors.push(`Qdrant: ${errorMessage}`);
    }

    // 2. Supprimer le fichier de Firebase Storage
    logWithTrace(traceId, "Étape 2/3: Suppression fichier Storage");
    if (storagePath && ragConfig.storage.bucket) {
      try {
        const bucket = adminStorage.bucket(ragConfig.storage.bucket);
        const fileRef = bucket.file(storagePath);
        
        // Vérifier que le fichier existe avant de le supprimer
        const [exists] = await fileRef.exists();
        if (exists) {
          await fileRef.delete();
          storageDeleted = true;
          logWithTrace(traceId, "Fichier Storage supprimé");
        } else {
          logWithTrace(traceId, "Fichier Storage n'existe pas (déjà supprimé?)");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        logWithTrace(traceId, "Erreur suppression Storage", { error: errorMessage });
        errors.push(`Storage: ${errorMessage}`);
      }
    } else {
      logWithTrace(traceId, "Pas de chemin Storage disponible");
    }

    // 3. Supprimer les métadonnées de Firestore
    logWithTrace(traceId, "Étape 3/3: Suppression métadonnées Firestore");
    try {
      await docRef.delete();
      firestoreDeleted = true;
      logWithTrace(traceId, "Métadonnées Firestore supprimées");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      logWithTrace(traceId, "Erreur suppression Firestore", { error: errorMessage });
      errors.push(`Firestore: ${errorMessage}`);
    }

    // Si toutes les suppressions ont échoué, retourner une erreur
    if (errors.length === 3) {
      const totalTime = Date.now() - startTime;
      logWithTrace(traceId, "Toutes les suppressions ont échoué", { totalTime, errors });
      return NextResponse.json(
        {
          error: "Erreur lors de la suppression du document",
          details: errors.join("; "),
          traceId,
        },
        { status: 500 }
      );
    }

    // Rollback si erreur partielle (si Qdrant a réussi mais Storage/Firestore ont échoué)
    if (qdrantDeleted && (!storageDeleted || !firestoreDeleted)) {
      logWithTrace(traceId, "Rollback: restauration Qdrant nécessaire", {
        qdrantDeleted,
        storageDeleted,
        firestoreDeleted,
      });
      // Note: On ne peut pas restaurer les vecteurs Qdrant facilement, donc on log juste
      // En production, on pourrait avoir un mécanisme de restauration depuis Firestore
    }

    const totalTime = Date.now() - startTime;
    logWithTrace(traceId, "Suppression terminée", {
      totalTime,
      qdrantDeleted,
      storageDeleted,
      firestoreDeleted,
      warnings: errors.length > 0 ? errors : undefined,
    });

    // Si au moins une suppression a réussi, retourner un succès avec warnings
    return NextResponse.json({
      message: "Document supprimé avec succès",
      documentId: documentId,
      warnings: errors.length > 0 ? errors : undefined,
      traceId,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    logWithTrace(traceId, "Erreur lors de la suppression", {
      error: errorMessage,
      totalTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Rollback si erreur partielle
    if (qdrantDeleted && !firestoreDeleted && documentData) {
      logWithTrace(traceId, "Rollback: restauration partielle nécessaire");
      // On ne peut pas facilement restaurer, mais on log pour debugging
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du document",
        details: errorMessage,
        traceId,
      },
      { status: 500 }
    );
  }
}

