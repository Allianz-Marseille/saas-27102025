/**
 * Utilitaires pour générer des embeddings avec OpenAI
 */

import OpenAI from "openai";
import { DocumentChunk } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Génère un embedding pour un texte donné
 */
export async function generateEmbedding(
  text: string,
  model: string = "text-embedding-3-small"
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Erreur lors de la génération d'embedding:", error);
    throw new Error("Impossible de générer l'embedding");
  }
}

/**
 * Génère des embeddings pour plusieurs textes en batch
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: string = "text-embedding-3-small"
): Promise<number[][]> {
  try {
    // Validation : vérifier que les chunks ne sont pas vides
    if (!texts || texts.length === 0) {
      throw new Error("Aucun texte fourni pour générer les embeddings");
    }
    
    // Validation : chaque texte doit contenir du contenu
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    if (validTexts.length !== texts.length) {
      throw new Error(`Certains textes sont vides (${validTexts.length}/${texts.length} valides)`);
    }
    
    // Retry logic pour les erreurs temporaires
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await openai.embeddings.create({
          model,
          input: texts,
        });

        // Validation : vérifier que le nombre d'embeddings correspond au nombre de textes
        if (!response.data || response.data.length !== texts.length) {
          throw new Error(
            `Nombre d'embeddings retournés (${response.data?.length || 0}) ne correspond pas au nombre de textes (${texts.length})`
          );
        }

        const embeddings = response.data.map((item) => item.embedding);
        
        // Validation : chaque embedding doit être un tableau non vide
        const validEmbeddings = embeddings.filter(emb => Array.isArray(emb) && emb.length > 0);
        if (validEmbeddings.length !== embeddings.length) {
          throw new Error(
            `Certains embeddings sont invalides (${validEmbeddings.length}/${embeddings.length} valides)`
          );
        }

        return embeddings;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Vérifier si c'est une erreur temporaire (rate limit, timeout, etc.)
        const isTemporaryError = 
          (error as any)?.status === 429 || // Rate limit
          (error as any)?.status === 503 || // Service unavailable
          (error as any)?.code === "ECONNRESET" ||
          (error as any)?.code === "ETIMEDOUT";
        
        if (isTemporaryError && attempt < maxRetries) {
          const waitTime = attempt * 1000; // 1s, 2s, 3s
          console.warn(`⚠️ Erreur temporaire lors de la génération d'embeddings (tentative ${attempt}/${maxRetries}). Nouvelle tentative dans ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Si ce n'est pas une erreur temporaire ou si on a épuisé les tentatives, throw
        throw lastError;
      }
    }
    
    // Ne devrait jamais arriver ici, mais TypeScript le demande
    throw lastError || new Error("Impossible de générer les embeddings après plusieurs tentatives");
  } catch (error) {
    console.error("Erreur lors de la génération d'embeddings batch:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Impossible de générer les embeddings");
  }
}

/**
 * Découpe un texte en chunks de taille raisonnable
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  // Validation : texte ne doit pas être vide
  if (!text || typeof text !== "string") {
    throw new Error("Le texte fourni est vide ou invalide");
  }
  
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw new Error("Le texte fourni ne contient que des espaces");
  }
  
  // Validation : chunkSize doit être positif
  if (chunkSize <= 0) {
    throw new Error("chunkSize doit être supérieur à 0");
  }
  
  // Validation : overlap ne doit pas être supérieur à chunkSize
  if (overlap >= chunkSize) {
    throw new Error("overlap ne peut pas être supérieur ou égal à chunkSize");
  }
  
  const chunks: string[] = [];
  const words = trimmedText.split(/\s+/).filter(word => word.length > 0);
  
  // Validation : au moins un mot doit exister
  if (words.length === 0) {
    throw new Error("Aucun mot valide trouvé dans le texte");
  }
  
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const wordLength = word.length + 1; // +1 pour l'espace

    if (currentLength + wordLength > chunkSize && currentChunk.length > 0) {
      const chunkText = currentChunk.join(" ");
      // Validation : chunk doit contenir au moins 10 caractères
      if (chunkText.trim().length >= 10) {
        chunks.push(chunkText);
      }
      
      // Overlap : garder les derniers mots pour la continuité
      const overlapWords = currentChunk.slice(-Math.min(overlap, currentChunk.length));
      currentChunk = overlapWords;
      currentLength = overlapWords.join(" ").length;
    }

    currentChunk.push(word);
    currentLength += wordLength;
  }

  // Ajouter le dernier chunk s'il est valide
  if (currentChunk.length > 0) {
    const lastChunk = currentChunk.join(" ");
    if (lastChunk.trim().length >= 10) {
      chunks.push(lastChunk);
    }
  }

  // Validation finale : au moins un chunk valide doit être créé
  const validChunks = chunks.filter((chunk) => chunk.trim().length >= 10);
  if (validChunks.length === 0) {
    throw new Error("Aucun chunk valide créé. Le texte pourrait être trop court ou invalide.");
  }

  return validChunks;
}

