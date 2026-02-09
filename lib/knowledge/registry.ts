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

/**
 * Retourne la collection Firestore pour un bot (source unique de vérité).
 * Utilisée par l'ingest et par les configs RAG pour garantir que le même document est lu/écrit.
 * @throws si le botId n'est pas enregistré
 */
export function getFirestoreCollectionForBotId(botId: string): string {
  const base = KNOWLEDGE_BASES.find((b) => b.botId === botId || b.id === botId);
  if (!base) {
    throw new Error(`Base de connaissance inconnue pour le bot : ${botId}. Enregistrer dans lib/knowledge/registry.ts.`);
  }
  return base.firestoreCollection;
}
