/**
 * Script pour indexer des documents dans la base RAG
 * Génère les embeddings et les stocke dans Firestore
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";
import { chunkText, generateEmbeddingsBatch } from "../lib/assistant/embeddings";
import { DocumentChunk } from "../lib/assistant/types";
import * as path from "path";
import * as fs from "fs";

// Charger les variables d'environnement
dotenv.config({ path: ".env.local" });

// Initialiser Firebase Admin
if (getApps().length === 0) {
  const serviceAccountPath = path.join(
    __dirname,
    "../saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
  );
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

interface DocumentToIndex {
  title: string;
  content: string;
  type: string;
  source?: string;
  tags?: string[];
}

/**
 * Indexe un document dans la base RAG
 */
async function indexDocument(document: DocumentToIndex): Promise<void> {
  console.log(`Indexation du document: ${document.title}`);

  // Découper le document en chunks
  const chunks = chunkText(document.content, 500, 50);
  console.log(`  → ${chunks.length} chunks créés`);

  // Générer les embeddings pour tous les chunks
  console.log("  → Génération des embeddings...");
  const embeddings = await generateEmbeddingsBatch(chunks);

  // Stocker chaque chunk dans Firestore
  const batch = db.batch();
  const documentRef = db.collection("rag_documents").doc();

  // Créer le document principal
  batch.set(documentRef, {
    title: document.title,
    type: document.type,
    source: document.source || "",
    tags: document.tags || [],
    createdAt: FieldValue.serverTimestamp(),
    chunkCount: chunks.length,
  });

  // Créer les chunks avec leurs embeddings
  for (let i = 0; i < chunks.length; i++) {
    const chunkRef = db.collection("rag_chunks").doc();
    const chunkData: DocumentChunk = {
      id: chunkRef.id,
      content: chunks[i],
      embedding: embeddings[i],
      metadata: {
        documentId: documentRef.id,
        documentTitle: document.title,
        documentType: document.type,
        chunkIndex: i,
        createdAt: new Date(),
        source: document.source,
        tags: document.tags,
      },
    };

    batch.set(chunkRef, chunkData);
  }

  await batch.commit();
  console.log(`  ✅ Document indexé avec succès (${chunks.length} chunks)`);
}

/**
 * Exemple d'utilisation
 */
async function main() {
  const documents: DocumentToIndex[] = [
    {
      title: "Guide des procédures d'assurance",
      content: `Ce guide explique les procédures standard pour souscrire une assurance.
      Les étapes principales sont :
      1. Analyse des besoins du client
      2. Proposition de solutions adaptées
      3. Signature du contrat
      4. Suivi et gestion des sinistres`,
      type: "guide",
      source: "Documentation interne",
      tags: ["procédures", "assurance"],
    },
    {
      title: "FAQ Assurance Auto",
      content: `Questions fréquentes sur l'assurance automobile :
      Q: Quelle est la couverture minimale requise ?
      R: L'assurance au tiers est obligatoire en France.
      
      Q: Comment déclarer un sinistre ?
      R: Contactez votre assureur dans les 5 jours ouvrés suivant l'incident.`,
      type: "faq",
      source: "Documentation client",
      tags: ["auto", "faq"],
    },
  ];

  console.log(`Indexation de ${documents.length} documents...\n`);

  for (const doc of documents) {
    try {
      await indexDocument(doc);
    } catch (error) {
      console.error(`Erreur lors de l'indexation de "${doc.title}":`, error);
    }
  }

  console.log("\n✅ Indexation terminée !");
  process.exit(0);
}

// Exécuter le script
main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});

export { indexDocument };

