/**
 * Détection de contradictions entre documents
 * Compare un nouveau document avec les documents existants pour détecter des contradictions
 */

import { adminDb } from "@/lib/firebase/admin-config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Contradiction {
  documentId: string;
  documentTitle: string;
  contradictionText: string;
  severity: "low" | "medium" | "high";
}

/**
 * Détecte les contradictions entre un nouveau document et les documents existants
 */
export async function detectContradictions(
  newDocumentTitle: string,
  newDocumentText: string,
  category?: string
): Promise<Contradiction[]> {
  try {
    // Récupérer les documents existants de la même catégorie (si catégorie fournie)
    let documentsQuery = adminDb
      .collection("rag_documents")
      .where("isActive", "==", true)
      .where("status", "==", "indexed")
      .limit(10); // Limiter à 10 documents pour éviter trop de comparaisons

    if (category) {
      documentsQuery = documentsQuery.where("category", "==", category);
    }

    const existingDocumentsSnapshot = await documentsQuery.get();

    if (existingDocumentsSnapshot.empty) {
      return [];
    }

    const contradictions: Contradiction[] = [];

    // Comparer avec chaque document existant
    for (const doc of existingDocumentsSnapshot.docs) {
      const existingDoc = doc.data();
      
      // Récupérer les chunks du document existant pour reconstituer le texte
      const chunksSnapshot = await adminDb
        .collection("rag_chunks")
        .where("metadata.documentId", "==", doc.id)
        .orderBy("metadata.chunkIndex", "asc")
        .limit(20) // Limiter à 20 chunks pour éviter trop de tokens
        .get();

      if (chunksSnapshot.empty) {
        continue;
      }

      const existingText = chunksSnapshot.docs
        .map((chunk) => (chunk.data() as any).content)
        .join("\n\n")
        .substring(0, 2000); // Limiter la longueur

      // Utiliser OpenAI pour détecter les contradictions
      const contradiction = await detectContradictionWithAI(
        newDocumentTitle,
        newDocumentText.substring(0, 2000),
        existingDoc.title,
        existingText
      );

      if (contradiction) {
        contradictions.push({
          documentId: doc.id,
          documentTitle: existingDoc.title,
          contradictionText: contradiction.text,
          severity: contradiction.severity,
        });
      }
    }

    return contradictions;
  } catch (error) {
    console.error("Erreur lors de la détection de contradictions:", error);
    return [];
  }
}

/**
 * Utilise OpenAI pour détecter une contradiction entre deux documents
 */
async function detectContradictionWithAI(
  doc1Title: string,
  doc1Text: string,
  doc2Title: string,
  doc2Text: string
): Promise<{ text: string; severity: "low" | "medium" | "high" } | null> {
  try {
    const prompt = `Compare ces deux documents d'assurance et détecte s'il y a des contradictions importantes.

Document 1 - ${doc1Title}:
${doc1Text}

Document 2 - ${doc2Title}:
${doc2Text}

Analyse s'il y a des contradictions sur :
- Les garanties proposées
- Les conditions d'application
- Les exclusions
- Les montants ou pourcentages
- Les procédures

Si tu détectes une contradiction, réponds au format JSON :
{
  "hasContradiction": true,
  "text": "Description de la contradiction",
  "severity": "low|medium|high"
}

Si pas de contradiction, réponds :
{
  "hasContradiction": false
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const result = JSON.parse(content);

    if (result.hasContradiction && result.text) {
      return {
        text: result.text,
        severity: result.severity || "medium",
      };
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la détection de contradiction avec AI:", error);
    return null;
  }
}

