/**
 * Configuration RAG par bot : thèmes, mots-clés de détection, docIds obligatoires.
 * Utilisé par le moteur hybride (rag-engine-core) et les modules *-rag.ts.
 * firestoreCollection : source unique dans lib/knowledge/registry.ts (alignement ingest / RAG garanti).
 */

import type { HybridRagConfig, RagChunk, ThemeConfig } from "./rag-engine-core";
import { getFirestoreCollectionForBotId } from "@/lib/knowledge/registry";

export type BotId = "pauline" | "bob" | "sinistro";

export interface RagBotConfig extends HybridRagConfig {
  botId: BotId;
}

export const PAULINE_RAG_CONFIG: RagBotConfig = {
  botId: "pauline",
  firestoreCollection: getFirestoreCollectionForBotId("pauline"),
  embeddingModel: "text-embedding-3-small",
  embeddingField: "embedding",
  topK: 8,
  maxChunksTotal: 10,
  themes: [
    {
      id: "bonus",
      keywords: ["bonus", "malus", "crm", "coefficient"],
      mandatoryDocIds: [
        "16105002-16105003-vademecum_bonus_malus_v04-23",
        "guide-de-souscription-res35901-v0425-bd",
      ],
    },
    {
      id: "personnes_morales",
      keywords: [
        "personne morale",
        "personnes morales",
        "société assurant",
        "première voiture",
        "1ère voiture",
        "sans conducteur désigné",
      ],
      mandatoryDocIds: [
        "16104996-16104997-vademecum_auto-personnes_morales_v04-23",
        "guide-de-souscription-res35901-v0425-bd",
      ],
    },
  ],
  sortChunks: (chunks, userMessage) => {
    if (chunks.length <= 1) return chunks;
    const lower = userMessage.toLowerCase();
    const pmKeywords = [
      "personne morale",
      "personnes morales",
      "société assurant",
      "première voiture",
    ];
    if (!pmKeywords.some((k) => lower.includes(k))) return chunks;
    const pm = (c: RagChunk) =>
      c.title.toLowerCase().includes("personnes_morales") ? 1 : 0;
    return [...chunks].sort((a, b) => pm(b) - pm(a));
  },
};

/** Mots-clés métiers Bob : prioriser les fiches ro_* (bilan TNS / caisse RO). */
const BOB_METIER_KEYWORDS = [
  "dentiste", "sage-femme", "médecin", "kiné", "infirmier", "orthophoniste", "pharmacien", "vétérinaire",
  "expert-comptable", "commissaire aux comptes", "avocat", "notaire", "architecte", "ingénieur", "psychologue",
  "agent général", "assurance", "carmf", "carpimko", "carcdsf", "cavec", "cnbf", "cavp", "carpv", "cipav", "ssi",
];

/** Config Bob : RAG hybride (thèmes vides en v1), tri ro_* en premier si métier mentionné. */
export const BOB_RAG_CONFIG: RagBotConfig = {
  botId: "bob",
  firestoreCollection: getFirestoreCollectionForBotId("bob"),
  embeddingModel: "text-embedding-3-small",
  embeddingField: "embedding",
  topK: 8,
  maxChunksTotal: 10,
  themes: [],
  sortChunks: (chunks, userMessage) => {
    if (chunks.length <= 1) return chunks;
    const lower = userMessage.toLowerCase();
    if (!BOB_METIER_KEYWORDS.some((k) => lower.includes(k))) return chunks;
    const ro = (c: RagChunk) => (c.title.startsWith("ro_") ? 1 : 0);
    return [...chunks].sort((a, b) => ro(b) - ro(a));
  },
};

/** Config par défaut pour Sinistro (v1 : pas de thèmes obligatoires). */
export const SINISTRO_RAG_CONFIG: RagBotConfig = {
  botId: "sinistro",
  firestoreCollection: getFirestoreCollectionForBotId("sinistro"),
  embeddingModel: "text-embedding-3-small",
  embeddingField: "embedding",
  topK: 3,
  maxChunksTotal: 10,
  themes: [],
};

export function getRagConfigForBot(botId: BotId): RagBotConfig {
  switch (botId) {
    case "pauline":
      return PAULINE_RAG_CONFIG;
    case "bob":
      return BOB_RAG_CONFIG;
    case "sinistro":
      return SINISTRO_RAG_CONFIG;
    default:
      throw new Error(`Config RAG inconnue pour le bot : ${botId}`);
  }
}
