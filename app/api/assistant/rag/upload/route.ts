/**
 * API Route pour l'upload de PDF dans la base RAG (Admin uniquement)
 * POST : Upload et indexation d'un PDF dans la base de connaissances
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { chunkText, generateEmbeddingsBatch } from "@/lib/assistant/embeddings";
import { adminDb } from "@/lib/firebase/admin-config";
import { DocumentChunk } from "@/lib/assistant/types";

/**
 * POST /api/assistant/rag/upload
 * Upload et indexation d'un PDF dans la base RAG (admin uniquement)
 */
export async function POST(request: NextRequest) {
  console.log("POST /api/assistant/rag/upload - Début");
  try {
    // Vérifier l'authentification ET le rôle administrateur
    console.log("Vérification de l'authentification admin...");
    const auth = await verifyAdmin(request);
    console.log("Résultat auth:", { valid: auth.valid, error: auth.error });
    if (!auth.valid) {
      console.error("Accès refusé - pas admin");
      return NextResponse.json(
        {
          error: auth.error || "Accès administrateur requis",
          details: "L'upload de documents dans la base RAG est réservé aux administrateurs uniquement",
        },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("Authentification OK, utilisateur admin");

    // Récupérer le fichier depuis le FormData
    console.log("Récupération du FormData...");
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const documentType = (formData.get("type") as string) || "document";
    const tags = formData.get("tags") ? (formData.get("tags") as string).split(",") : [];

    console.log("Fichier reçu:", file ? { name: file.name, type: file.type, size: file.size } : "null");

    if (!file) {
      console.error("Aucun fichier fourni");
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Vérifier que c'est un PDF
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Le fichier doit être un PDF" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Vérifier la taille (max 20 MB)
    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (maximum 20 MB)" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Lire le contenu du PDF
    console.log("Lecture du contenu du PDF...");
    const arrayBuffer = await file.arrayBuffer();
    console.log("Taille du buffer:", arrayBuffer.byteLength);
    // Convertir en Uint8Array pour pdf-parse (la classe PDFParse accepte ArrayBuffer, TypedArray ou Buffer)
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let text: string;
    try {
      // Utiliser pdf-parse avec Buffer (meilleure compatibilité Node.js)
      console.log("Import de pdf-parse...");
      const pdfParseModule = await import("pdf-parse");
      
      // Convertir Uint8Array en Buffer pour pdf-parse
      const Buffer = (await import("buffer")).Buffer;
      const pdfBuffer = Buffer.from(uint8Array);
      
      // pdf-parse peut être exporté comme default ou comme export nommé
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      console.log("Extraction du texte avec pdf-parse...");
      const pdfData = await pdfParse(pdfBuffer);
      
      text = pdfData.text;
      console.log(`Texte extrait: ${text.length} caractères`);
      
      if (!text || text.trim().length === 0) {
        throw new Error("Aucun texte extrait du PDF");
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction du texte PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("Détails de l'erreur:", errorMessage);
      if (errorStack) {
        console.error("Stack trace:", errorStack);
      }
      return NextResponse.json(
        { 
          error: "Impossible d'extraire le texte du PDF",
          message: errorMessage,
          details: process.env.NODE_ENV === "development" ? errorStack : undefined
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Le PDF ne contient pas de texte extractible" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Découper le texte en chunks
    const chunks = chunkText(text, 500, 50);
    console.log(`  → ${chunks.length} chunks créés`);

    // Générer les embeddings pour tous les chunks
    console.log("  → Génération des embeddings...");
    const embeddings = await generateEmbeddingsBatch(chunks);

    // Stocker chaque chunk dans Firestore
    const batch = adminDb.batch();
    const documentRef = adminDb.collection("rag_documents").doc();

    const documentTitle = title || file.name.replace(".pdf", "");

    // Créer le document principal
    batch.set(documentRef, {
      title: documentTitle,
      type: documentType,
      source: file.name,
      tags: tags,
      createdAt: new Date(),
      chunkCount: chunks.length,
      uploadedBy: auth.userId,
    });

    // Créer les chunks avec leurs embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunkRef = adminDb.collection("rag_chunks").doc();
      const chunkData: DocumentChunk = {
        id: chunkRef.id,
        content: chunks[i],
        embedding: embeddings[i],
        metadata: {
          documentId: documentRef.id,
          documentTitle: documentTitle,
          documentType: documentType,
          chunkIndex: i,
          createdAt: new Date(),
          source: file.name,
          tags: tags,
        },
      };

      batch.set(chunkRef, chunkData);
    }

    await batch.commit();

    console.log("Upload terminé avec succès");
    return NextResponse.json(
      {
        success: true,
        message: "Document indexé avec succès",
        documentId: documentRef.id,
        title: documentTitle,
        chunkCount: chunks.length,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erreur POST /api/assistant/rag/upload:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");

    // TOUJOURS renvoyer un JSON, même en cas d'erreur
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Erreur lors de l'upload et de l'indexation du document",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

