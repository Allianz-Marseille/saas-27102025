/**
 * Tracking de l'utilisation des sources RAG
 * Enregistre quelles sources sont utilisées dans les réponses
 */

import { adminDb, Timestamp } from "@/lib/firebase/admin-config";

export interface SourceUsage {
  documentId: string;
  userId: string;
  timestamp: Date | any; // Firestore Timestamp
  query: string;
  score?: number; // Score de similarité si disponible
}

/**
 * Enregistre l'utilisation d'une source
 */
export async function trackSourceUsage(
  documentId: string,
  userId: string,
  query: string,
  score?: number
): Promise<void> {
  try {
    await adminDb.collection("rag_source_usage").add({
      documentId,
      userId,
      query: query.substring(0, 500), // Limiter la longueur de la requête
      score,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Erreur lors du tracking de l'utilisation:", error);
    // Ne pas faire échouer la requête si le tracking échoue
  }
}

/**
 * Enregistre l'utilisation de plusieurs sources
 */
export async function trackMultipleSourceUsage(
  usages: Array<{ documentId: string; score?: number }>,
  userId: string,
  query: string
): Promise<void> {
  try {
    const batch = adminDb.batch();
    const timestamp = Timestamp.now();

    usages.forEach((usage) => {
      const ref = adminDb.collection("rag_source_usage").doc();
      batch.set(ref, {
        documentId: usage.documentId,
        userId,
        query: query.substring(0, 500),
        score: usage.score,
        timestamp,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Erreur lors du tracking de l'utilisation multiple:", error);
  }
}

/**
 * Récupère les statistiques d'utilisation d'un document
 */
export async function getDocumentUsageStats(documentId: string): Promise<{
  totalUses: number;
  uniqueUsers: number;
  lastUsed?: Date;
  averageScore?: number;
}> {
  try {
    const usageSnapshot = await adminDb
      .collection("rag_source_usage")
      .where("documentId", "==", documentId)
      .orderBy("timestamp", "desc")
      .get();

    const totalUses = usageSnapshot.size;
    const userIds = new Set<string>();
    let lastUsed: Date | undefined;
    let totalScore = 0;
    let scoreCount = 0;

    usageSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      userIds.add(data.userId);
      
      if (data.timestamp) {
        const timestamp = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (!lastUsed || timestamp > lastUsed) {
          lastUsed = timestamp;
        }
      }
      
      if (data.score !== undefined && data.score !== null) {
        totalScore += data.score;
        scoreCount++;
      }
    });

    return {
      totalUses,
      uniqueUsers: userIds.size,
      lastUsed,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : undefined,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return {
      totalUses: 0,
      uniqueUsers: 0,
    };
  }
}

