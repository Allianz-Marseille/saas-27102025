import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { ImageAnnotatorClient } from "@google-cloud/vision";

/**
 * Configuration Google Cloud
 */
export const googleConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "",
  documentAI: {
    processorId: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || "",
    location: process.env.GOOGLE_DOCUMENT_AI_LOCATION || "eu",
  },
};

/**
 * Récupère les credentials depuis la variable d'environnement
 */
function getCredentials() {
  const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

  if (!base64Credentials) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_BASE64 n'est pas définie dans les variables d'environnement"
    );
  }

  try {
    const jsonString = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Impossible de décoder les credentials Google Cloud: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`
    );
  }
}

/**
 * Client Document AI pour l'extraction de texte PDF (Admin - Vectorisation)
 */
export function getDocumentAIClient(): DocumentProcessorServiceClient {
  try {
    const credentials = getCredentials();
    return new DocumentProcessorServiceClient({ credentials });
  } catch (error) {
    console.error("[Google Cloud] Erreur initialisation Document AI:", error);
    throw error;
  }
}

/**
 * Client Vision AI pour l'analyse ponctuelle d'images/PDFs (Chatbot)
 */
export function getVisionClient(): ImageAnnotatorClient {
  try {
    const credentials = getCredentials();
    return new ImageAnnotatorClient({ credentials });
  } catch (error) {
    console.error("[Google Cloud] Erreur initialisation Vision AI:", error);
    throw error;
  }
}

/**
 * Vérifie que la configuration Google Cloud est valide
 */
export function validateGoogleCloudConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    errors.push("GOOGLE_APPLICATION_CREDENTIALS_BASE64 est requis");
  }

  if (!googleConfig.projectId) {
    errors.push("GOOGLE_CLOUD_PROJECT est requis");
  }

  if (!googleConfig.documentAI.processorId) {
    errors.push("GOOGLE_DOCUMENT_AI_PROCESSOR_ID est requis");
  }

  if (!googleConfig.documentAI.location) {
    errors.push("GOOGLE_DOCUMENT_AI_LOCATION est requis");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

