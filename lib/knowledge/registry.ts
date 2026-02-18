/**
 * Registre des bases de connaissance RAG.
 * Chaque base est liée à une collection Firestore pour stocker documents et embeddings.
 */

export interface KnowledgeBaseConfig {
  id: string;
  name: string;
  firestoreCollection: string;
}

const KNOWLEDGE_BASES: KnowledgeBaseConfig[] = [
  {
    id: "bob",
    name: "Bob Santé — Prévoyance TNS",
    firestoreCollection: "knowledge_bob_sante",
  },
];

export function getKnowledgeBaseById(id: string): KnowledgeBaseConfig | null {
  return KNOWLEDGE_BASES.find((kb) => kb.id === id) ?? null;
}

export function getAllKnowledgeBases(): KnowledgeBaseConfig[] {
  return [...KNOWLEDGE_BASES];
}
