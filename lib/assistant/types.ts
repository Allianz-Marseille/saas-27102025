/**
 * Types pour le système RAG (Retrieval-Augmented Generation)
 */

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
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

