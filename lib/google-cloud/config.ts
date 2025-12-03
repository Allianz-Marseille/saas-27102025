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
 * Récupère les credentials depuis les variables d'environnement
 * Supporte deux méthodes :
 * 1. Base64 (ancienne méthode, en fallback)
 * 2. Variables séparées (nouvelle méthode, plus robuste)
 */
function getCredentials() {
  // Méthode 1 : Vérifier si on a la version Base64 (pour compatibilité)
  const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  
  if (base64Credentials) {
    try {
      const jsonString = Buffer.from(base64Credentials, "base64").toString("utf-8");
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn("[Google Cloud] Erreur décodage Base64, tentative avec variables séparées");
    }
  }

  // Méthode 2 : Nouvelle méthode avec variables séparées
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_CLOUD_PROJECT,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com"
  };

  // Vérifier que les champs essentiels sont présents
  if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
    throw new Error(
      "Credentials Google Cloud incomplets. Vérifiez GOOGLE_CLOUD_PROJECT, GOOGLE_PRIVATE_KEY, et GOOGLE_CLIENT_EMAIL"
    );
  }

  return credentials;
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

  // Vérifier soit Base64 soit variables séparées
  const hasBase64 = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  const hasSeparateVars = 
    !!process.env.GOOGLE_CLOUD_PROJECT && 
    !!process.env.GOOGLE_PRIVATE_KEY && 
    !!process.env.GOOGLE_CLIENT_EMAIL;

  if (!hasBase64 && !hasSeparateVars) {
    errors.push("Credentials Google Cloud manquants (Base64 ou variables séparées)");
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

