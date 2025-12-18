/**
 * Système de rate limiting pour l'assistant IA
 * Limite l'utilisation de l'API OpenAI par utilisateur pour contrôler les coûts
 */

import { adminDb } from "@/lib/firebase/admin-config";

export interface RateLimitConfig {
  textRequests: number; // Requêtes texte par jour
  imageRequests: number; // Requêtes avec images par jour
  fileRequests: number; // Requêtes avec fichiers par jour
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  textRequests: 100, // 100 requêtes texte par jour
  imageRequests: 50, // 50 requêtes avec images par jour (plus coûteux)
  fileRequests: 20, // 20 requêtes avec fichiers par jour (encore plus coûteux)
};

export type RequestType = "text" | "image" | "file";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Vérifie si un utilisateur peut faire une requête selon les limites
 * @param userId ID de l'utilisateur
 * @param type Type de requête (text, image, file)
 * @param customLimits Limites personnalisées (optionnel)
 * @returns Résultat de la vérification
 */
export async function checkRateLimit(
  userId: string,
  type: RequestType,
  customLimits?: RateLimitConfig
): Promise<RateLimitResult> {
  const limits = customLimits || DEFAULT_RATE_LIMITS;
  
  // Déterminer la limite selon le type
  let limit: number;
  switch (type) {
    case "text":
      limit = limits.textRequests;
      break;
    case "image":
      limit = limits.imageRequests;
      break;
    case "file":
      limit = limits.fileRequests;
      break;
  }

  // Date de début du jour (UTC)
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  // Récupérer ou créer le document de rate limit
  const rateLimitRef = adminDb
    .collection("assistant_rate_limits")
    .doc(`${userId}_${type}_${startOfDay.toISOString().split("T")[0]}`);

  const rateLimitDoc = await rateLimitRef.get();

  let count = 0;
  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data();
    count = data?.count || 0;
  }

  // Vérifier si la limite est atteinte
  const allowed = count < limit;
  const remaining = Math.max(0, limit - count);
  const resetAt = endOfDay;

  // Si autorisé, incrémenter le compteur
  if (allowed) {
    await rateLimitRef.set(
      {
        userId,
        type,
        count: count + 1,
        date: startOfDay,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  return {
    allowed,
    remaining,
    resetAt,
    limit,
  };
}

/**
 * Récupère les statistiques de rate limit pour un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Statistiques par type de requête
 */
export async function getRateLimitStats(userId: string): Promise<Record<RequestType, RateLimitResult>> {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const dateStr = startOfDay.toISOString().split("T")[0];
  const types: RequestType[] = ["text", "image", "file"];

  const stats: Record<RequestType, RateLimitResult> = {} as Record<RequestType, RateLimitResult>;

  for (const type of types) {
    const rateLimitRef = adminDb
      .collection("assistant_rate_limits")
      .doc(`${userId}_${type}_${dateStr}`);

    const rateLimitDoc = await rateLimitRef.get();
    let count = 0;
    if (rateLimitDoc.exists) {
      const data = rateLimitDoc.data();
      count = data?.count || 0;
    }

    let limit: number;
    switch (type) {
      case "text":
        limit = DEFAULT_RATE_LIMITS.textRequests;
        break;
      case "image":
        limit = DEFAULT_RATE_LIMITS.imageRequests;
        break;
      case "file":
        limit = DEFAULT_RATE_LIMITS.fileRequests;
        break;
    }

    stats[type] = {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      resetAt: endOfDay,
      limit,
    };
  }

  return stats;
}

/**
 * Détermine le type de requête selon les paramètres
 * @param hasImages Si la requête contient des images
 * @param hasFiles Si la requête contient des fichiers
 * @returns Type de requête
 */
export function determineRequestType(hasImages: boolean, hasFiles: boolean): RequestType {
  if (hasFiles) return "file";
  if (hasImages) return "image";
  return "text";
}

