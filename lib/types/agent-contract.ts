/**
 * Contrat Technique — Échanges UI Next.js ↔ Agents IA (chat)
 *
 * Définit les interfaces entre l'interface de chat et les agents
 * (Bob, Nina, Sinistro, etc.). Cible future : Gemini.
 */

// —————————————————————————————————————————————————————————————————————————————
// BOTS SUPPORTÉS
// —————————————————————————————————————————————————————————————————————————————

/**
 * Identifiants des bots disponibles.
 * Chaque entrée correspond à un bot configuré dans lib/config/agents.ts.
 */
export enum SupportedBots {
  Bob = "bob",
  Nina = "nina",
  Sinistro = "sinistro",
  Pauline = "pauline",
  ExpertRetraite = "expert-retraite",
  ExpertPrevoyanceAgricole = "expert-prevoyance-agricole",
}

/** Type union pour validation stricte du botId */
export type BotId = `${SupportedBots}`;

// —————————————————————————————————————————————————————————————————————————————
// PIÈCES JOINTES (ATTACHMENTS)
// ——————————————————————————————————————————————————————————————————————————————

/** Type de fichier accepté : image (Vision) ou document (OCR) */
export type AttachmentFileType = "image" | "document";

/**
 * Formats MIME supportés pour les pièces jointes.
 * - Images : Vision (screenshots CRM, JPG, PNG)
 * - Documents : OCR (PDF, Word, TXT)
 */
export const SUPPORTED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ] as const,
} as const;

/** Statut de l'extraction OCR/Vision pour une pièce jointe */
export type ExtractionStatus = "pending" | "done" | "failed";

/**
 * Pièce jointe : image ou document à analyser par l'agent.
 * - À l'envoi : data (base64) ou url (lien temporaire vers un stockage)
 * - En retour : extraction_status et extracted_text (optionnel)
 */
export interface ChatAttachment {
  /** Identifiant unique du fichier (généré côté client ou serveur) */
  file_id: string;
  /** Type : image (Vision) ou document (OCR) */
  fileType: AttachmentFileType;
  /** Type MIME (ex: image/png, application/pdf) */
  mimeType: string;
  /**
   * Données du fichier.
   * - Soit data en base64 (pour petits fichiers)
   * - Soit url (lien temporaire Firebase Storage, S3, etc.)
   */
  data?: string;
  url?: string;
  /** Nom du fichier original (optionnel, pour logs) */
  fileName?: string;
  /** Statut de l'extraction (rempli côté serveur après traitement) */
  extraction_status?: ExtractionStatus;
  /** Texte extrait par OCR/Vision (rempli côté serveur) */
  extracted_text?: string;
  /** Score de confiance OCR 0-1 (optionnel) */
  ocr_confidence?: number;
}

// —————————————————————————————————————————————————————————————————————————————
// REQUÊTE CHAT (BOT REQUEST)
// ——————————————————————————————————————————————————————————————————————————————

/**
 * Message d'historique (pour contexte de conversation)
 */
export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Requête envoyée par l'UI vers POST /api/chat.
 * Le body JSON doit respecter cette structure.
 */
export interface BotRequest {
  /** Message texte de l'utilisateur */
  message: string;
  /** Identifiant du bot cible (ex: "bob", "nina") */
  botId: BotId | string;
  /** Historique de la conversation (optionnel, pour contexte) */
  history?: ChatHistoryMessage[];
  /** Pièces jointes : images (Vision) et/ou documents (OCR) */
  attachments?: ChatAttachment[];
  /** Metadata de session (optionnel : dossier client, contexte métier) */
  metadata?: BotMetadata;
}

// —————————————————————————————————————————————————————————————————————————————
// MÉTADONNÉES DE SESSION (BOT METADATA)
// ——————————————————————————————————————————————————————————————————————————————

/** Phase du tunnel de vente ou de suivi */
export type CurrentStep = "decouverte" | "devis" | "m_plus_3";

/**
 * Métadonnées de session injectées dans l'appel API chat.
 * En mode standalone (page Agents IA), client_id et uid_collaborateur peuvent être absents.
 * Depuis un dossier client, ces champs ancrent la conversation.
 */
export interface BotMetadata {
  /** Identifiant du dossier client (optionnel en mode standalone) */
  client_id?: string;
  /** UID du collaborateur connecté */
  uid_collaborateur?: string;
  /** Phase dans le tunnel (découverte, devis, M+3) */
  current_step?: CurrentStep;
  /** Étape précise dans le parcours (ex: "revenus_bnc") */
  step_id?: string;
  /** Statut du client (kiné, médecin, etc.) */
  client_statut?: string;
  /**
   * Contexte métier agrégé : RO, revenus, garanties déjà collectées.
   * Injecté dans le prompt pour aider l'agent à personnaliser sa réponse.
   */
  context_pro?: Record<string, unknown>;
  /** Indique qu'une image/document attend l'analyse Vision/OCR */
  has_uploaded_file?: boolean;
  /**
   * Texte extrait des pièces jointes de la requête courante.
   * Rempli côté serveur après OCR/Vision, injecté dans le prompt.
   */
  extracted_text?: string;
  /**
   * Score de confiance global OCR (0-1) si disponible.
   * Utile pour signaler une extraction de faible qualité.
   */
  ocr_confidence?: number;
}

// —————————————————————————————————————————————————————————————————————————————
// RÉPONSE CHAT (BOT RESPONSE)
// ——————————————————————————————————————————————————————————————————————————————

/**
 * Réponse en mode stream (SSE).
 * Le serveur renvoie un flux text/event-stream.
 * Chaque chunk contient un delta de texte (content partiel).
 */
export interface BotResponseStream {
  /** Contenu streamé (delta par delta) */
  content: string;
}

/**
 * En cas d'erreur, le serveur peut renvoyer un JSON (non-stream) :
 */
export interface BotResponseError {
  error: string;
}

// —————————————————————————————————————————————————————————————————————————————
// UTILITAIRES
// ——————————————————————————————————————————————————————————————————————————————

/** Vérifie si un botId est valide */
export function isValidBotId(botId: string): botId is BotId {
  return Object.values(SupportedBots).includes(botId as SupportedBots);
}
