/**
 * Types TypeScript pour le système RAG
 */

import { Timestamp } from "firebase/firestore";

// Types de fichiers supportés
export type FileType = "pdf" | "image";
export type ImageType = "png" | "jpg" | "jpeg" | "webp";

// Document RAG dans Firestore
export interface RAGDocument {
  id: string;
  filename: string;
  fileType: FileType;
  imageType?: ImageType;
  uploadedBy: string; // userId
  uploadedAt: Timestamp;
  fileUrl: string; // Firebase Storage URL
  fileSize: number;
  chunkCount: number;
  qdrantCollectionId: string;
  ocrConfidence?: number; // Score de confiance OCR (si image)
  metadata?: {
    title?: string;
    description?: string;
  };
}

// Chunk de document pour l'indexation
export interface DocumentChunk {
  id: string; // ID unique du chunk
  documentId: string; // ID du document parent
  text: string; // Texte du chunk
  chunkIndex: number; // Index du chunk dans le document
  embedding?: number[]; // Embedding vectoriel (optionnel, stocké dans Qdrant)
  metadata?: {
    pageNumber?: number; // Pour les PDFs
    section?: string; // Section du document
  };
}

// Point vectoriel dans Qdrant
export interface QdrantPoint {
  id: string; // ID du chunk
  vector: number[]; // Embedding vectoriel
  payload: {
    documentId: string;
    chunkIndex: number;
    text: string;
    filename: string;
    fileType: FileType;
    metadata?: Record<string, unknown>;
  };
}

// Résultat de recherche vectorielle
export interface SearchResult {
  id: string; // ID du chunk
  score: number; // Score de similarité (0-1)
  text: string; // Texte du chunk
  documentId: string;
  filename: string;
  fileType: FileType;
  metadata?: Record<string, unknown>;
}

// Message de conversation
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[]; // IDs des documents utilisés
  metadata?: {
    query?: string; // Question originale (pour les messages assistant)
    searchResults?: SearchResult[]; // Résultats de recherche utilisés
  };
}

// Requête de chat
export interface ChatRequest {
  query: string;
  conversationHistory?: ChatMessage[]; // Historique optionnel
  userId: string;
}

// Réponse de chat
export interface ChatResponse {
  message: string;
  sources: string[]; // IDs des documents utilisés
  searchResults?: SearchResult[]; // Résultats de recherche détaillés
  metadata?: {
    model?: string;
    tokensUsed?: number;
    responseTime?: number;
  };
}

// Upload de fichier
export interface FileUpload {
  file: File;
  type: FileType;
  metadata?: {
    title?: string;
    description?: string;
  };
}

// Résultat d'upload
export interface UploadResult {
  documentId: string;
  filename: string;
  fileUrl: string;
  chunkCount: number;
  success: boolean;
  error?: string;
  ocrConfidence?: number;
}

// Configuration OCR
export interface OCRResult {
  text: string;
  confidence: number; // Score de confiance (0-1)
  language?: string;
  metadata?: Record<string, unknown>;
}

// Erreur RAG
export interface RAGError {
  code: string;
  message: string;
  details?: unknown;
}

// Statut de traitement
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

// Job de traitement
export interface ProcessingJob {
  id: string;
  documentId: string;
  status: ProcessingStatus;
  progress?: number; // 0-100
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

