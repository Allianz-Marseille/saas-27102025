/**
 * Types pour le système RAG (Retrieval-Augmented Generation)
 */

export type DocumentStatus = 
  | "uploaded" 
  | "processing" 
  | "ocr_processing"
  | "ocr_done"
  | "indexed" 
  | "error";

export interface RAGDocument {
  id: string;
  title: string;
  type: string;
  category?: string;
  source: string;
  storagePath?: string;
  tags: string[];
  status: DocumentStatus;
  isActive: boolean;
  uploadedBy: string;
  chunkCount: number;
  createdAt: Date | any; // Firestore Timestamp
  updatedAt: Date | any; // Firestore Timestamp
  errorMessage?: string;
  version?: number;
  previousVersionId?: string;
  summary?: string;
  ocrEngine?: "openai_vision" | "none";
  ocrPageCount?: number;
  ocrAt?: Date | any;
  extractionMethod?: "pdf-parse" | "ocr";
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  tokenCount?: number;
  embeddingModel?: string;
  metadata: {
    documentId: string;
    documentTitle: string;
    documentType: string;
    chunkIndex: number;
    createdAt: Date;
    source?: string;
    tags?: string[];
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface RAGContext {
  chunks: DocumentChunk[];
  query: string;
  sources: string[];
}

export interface RAGConfig {
  topK: number;
  minScore: number;
  embeddingModel: string;
}

