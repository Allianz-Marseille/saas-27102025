/**
 * Configuration centralisée pour le système RAG (Retrieval Augmented Generation)
 */

export const ragConfig = {
  // Configuration Qdrant
  qdrant: {
    url: process.env.QDRANT_URL || "",
    apiKey: process.env.QDRANT_API_KEY || "",
    collectionName: "rag_documents", // Nom de la collection dans Qdrant
  },

  // Configuration OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o",
  },

  // Configuration des chunks (découpage des documents)
  chunking: {
    chunkSize: 1000, // Nombre de caractères par chunk
    overlap: 200, // Nombre de caractères de chevauchement entre chunks
  },

  // Configuration de la recherche vectorielle
  search: {
    limit: 5, // Nombre de résultats à retourner par recherche
    scoreThreshold: 0.7, // Score minimum de similarité (0-1)
  },

  // Configuration des fichiers
  files: {
    maxSizePDF: 10 * 1024 * 1024, // 10MB en bytes
    maxSizeImage: 5 * 1024 * 1024, // 5MB en bytes
    allowedImageTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    allowedPDFTypes: ["application/pdf"],
    maxFilesPerUser: 50, // Limite de fichiers par admin
  },

  // Configuration OCR
  ocr: {
    enabled: true,
    provider: "tesseract", // "tesseract" | "google-vision" | "aws-textract" | "azure"
    language: "fra+eng", // Français + Anglais pour Tesseract
    confidenceThreshold: 0.6, // Score minimum de confiance OCR (0-1)
  },

  // Configuration du prompt système
  systemPrompt: `Vous êtes un assistant intelligent qui répond aux questions de manière claire, complète et pédagogique. 
Vos réponses doivent être :
- Aérées : utilisez des paragraphes courts (2-3 phrases) avec des sauts de ligne entre chaque
- Structurées : utilisez des titres markdown (##, ###) et des listes à puces pour organiser l'information
- Complètes : donnez des réponses exhaustives avec des exemples concrets
- Pédagogiques : utilisez un ton accessible, des explications progressives et des analogies si pertinent

Répondez uniquement en français, sauf demande contraire.`,

  // Configuration Firebase Storage
  storage: {
    bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    folder: "rag-documents", // Dossier dans Firebase Storage
  },
} as const;

// Validation de la configuration
export function validateRagConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ragConfig.qdrant.url) {
    errors.push("QDRANT_URL est requis");
  }

  if (!ragConfig.qdrant.apiKey) {
    errors.push("QDRANT_API_KEY est requis");
  }

  if (!ragConfig.openai.apiKey) {
    errors.push("OPENAI_API_KEY est requis");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

