/**
 * Registre centralisé des bases de connaissance RAG.
 * Extensible : ajouter une entrée + index Firestore pour un nouveau bot.
 */

export interface KnowledgeBaseConfig {
  id: string;
  name: string;
  firestoreCollection: string;
  botId?: string;
}

export const KNOWLEDGE_BASES: KnowledgeBaseConfig[] = [
  {
    id: "pauline",
    name: "Pauline — Produits Particuliers",
    firestoreCollection: "pauline_knowledge",
    botId: "pauline",
  },
  {
    id: "bob",
    name: "Bob — Santé & Prévoyance",
    firestoreCollection: "bob_knowledge",
    botId: "bob",
  },
  {
    id: "sinistro",
    name: "Sinistro — Sinistres",
    firestoreCollection: "sinistro_knowledge",
    botId: "sinistro",
  },
];

export function getKnowledgeBases(): KnowledgeBaseConfig[] {
  return [...KNOWLEDGE_BASES];
}

export function getKnowledgeBaseById(id: string): KnowledgeBaseConfig | undefined {
  return KNOWLEDGE_BASES.find((b) => b.id === id);
}
