/**
 * Gestion des conversations sauvegardées dans Firestore
 */

import { adminDb } from "@/lib/firebase/admin-config";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // Base64 data URLs
  timestamp: Date;
  sources?: string[];
  sourcesWithScores?: Array<{
    title: string;
    score: number;
    documentId: string;
  }>;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isFavorite?: boolean;
  autoSaved?: boolean; // Indique si la conversation a été sauvegardée automatiquement
  sharedWith?: Array<{
    userId: string;
    permission: "read" | "write";
    sharedAt: Date;
  }>;
  shareToken?: string; // Token unique pour le partage
}

/**
 * Génère un titre automatique à partir du premier message
 */
function generateTitle(firstMessage: string, maxLength: number = 50): string {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return "Nouvelle conversation";
  }

  // Prendre les premiers mots
  const words = firstMessage.trim().split(/\s+/);
  let title = "";
  
  for (const word of words) {
    if (title.length + word.length + 1 > maxLength) {
      break;
    }
    title += (title ? " " : "") + word;
  }

  return title || "Nouvelle conversation";
}

/**
 * Sauvegarde une conversation dans Firestore
 */
export async function saveConversation(
  userId: string,
  messages: ConversationMessage[],
  title?: string,
  tags?: string[],
  autoSaved: boolean = false
): Promise<string> {
  if (messages.length === 0) {
    throw new Error("Impossible de sauvegarder une conversation vide");
  }

  // Générer un titre si non fourni
  const conversationTitle = title || generateTitle(messages[0]?.content || "");

  const conversationData = {
    userId,
    title: conversationTitle,
    messages: messages.map((msg) => {
      // Filtrer les champs undefined pour éviter l'erreur Firestore
      const cleanedMsg: any = {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      };
      
      // Ajouter seulement les champs qui ne sont pas undefined
      if (msg.images !== undefined) cleanedMsg.images = msg.images;
      if (msg.sources !== undefined) cleanedMsg.sources = msg.sources;
      if (msg.sourcesWithScores !== undefined) cleanedMsg.sourcesWithScores = msg.sourcesWithScores;
      
      return cleanedMsg;
    }),
    tags: tags || [],
    isFavorite: false,
    autoSaved: autoSaved,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await adminDb.collection("assistant_conversations").add(conversationData);

  return docRef.id;
}

/**
 * Sauvegarde automatique d'une conversation (appelée périodiquement)
 */
export async function autoSaveConversation(
  userId: string,
  messages: ConversationMessage[],
  conversationId?: string
): Promise<string> {
  if (messages.length === 0) {
    return ""; // Ne pas sauvegarder une conversation vide
  }

  // Si un ID existe, mettre à jour la conversation existante
  if (conversationId) {
    try {
      const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();
      if (doc.exists && doc.data()?.userId === userId) {
        await adminDb.collection("assistant_conversations").doc(conversationId).update({
          messages: messages.map((msg) => {
            // Filtrer les champs undefined pour éviter l'erreur Firestore
            const cleanedMsg: any = {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
            };
            
            // Ajouter seulement les champs qui ne sont pas undefined
            if (msg.images !== undefined) cleanedMsg.images = msg.images;
            if (msg.sources !== undefined) cleanedMsg.sources = msg.sources;
            if (msg.sourcesWithScores !== undefined) cleanedMsg.sourcesWithScores = msg.sourcesWithScores;
            
            return cleanedMsg;
          }),
          autoSaved: true,
          updatedAt: new Date(),
        });
        return conversationId;
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour automatique:", error);
    }
  }

  // Sinon, créer une nouvelle conversation
  return await saveConversation(userId, messages, undefined, undefined, true);
}

/**
 * Marque/démarque une conversation comme favorite
 */
export async function toggleFavorite(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();

  if (!doc.exists) {
    throw new Error("Conversation non trouvée");
  }

  const data = doc.data();
  if (data?.userId !== userId) {
    throw new Error("Accès non autorisé à cette conversation");
  }

  const newIsFavorite = !(data?.isFavorite || false);

  await adminDb.collection("assistant_conversations").doc(conversationId).update({
    isFavorite: newIsFavorite,
    updatedAt: new Date(),
  });

  return newIsFavorite;
}

/**
 * Charge toutes les conversations d'un utilisateur
 */
export async function loadConversations(userId: string): Promise<Conversation[]> {
  try {
    // Essayer d'abord avec orderBy (nécessite un index Firestore)
    let snapshot;
    try {
      snapshot = await adminDb
        .collection("assistant_conversations")
        .where("userId", "==", userId)
        .orderBy("updatedAt", "desc")
        .get();
    } catch (error: any) {
      // Si l'index n'existe pas, récupérer sans orderBy et trier en mémoire
      if (error.code === "failed-precondition" || error.message?.includes("index")) {
        snapshot = await adminDb
          .collection("assistant_conversations")
          .where("userId", "==", userId)
          .get();
      } else {
        throw error;
      }
    }

    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      messages: (doc.data().messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate() || new Date(msg.timestamp),
      })),
    })) as Conversation[];

    // Trier par updatedAt si on n'a pas pu utiliser orderBy
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return conversations;
  } catch (error) {
    console.error("Erreur lors du chargement des conversations:", error);
    throw new Error(
      error instanceof Error 
        ? `Erreur lors du chargement des conversations: ${error.message}`
        : "Erreur inconnue lors du chargement des conversations"
    );
  }
}

/**
 * Charge une conversation spécifique
 */
export async function loadConversation(conversationId: string, userId: string): Promise<Conversation | null> {
  const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (data?.userId !== userId) {
    throw new Error("Accès non autorisé à cette conversation");
  }

  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate() || new Date(),
    updatedAt: data?.updatedAt?.toDate() || new Date(),
    messages: (data?.messages || []).map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp?.toDate() || new Date(msg.timestamp),
    })),
  } as Conversation;
}

/**
 * Met à jour une conversation
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  updates: {
    title?: string;
    messages?: ConversationMessage[];
    tags?: string[];
  }
): Promise<void> {
  const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();

  if (!doc.exists) {
    throw new Error("Conversation non trouvée");
  }

  const data = doc.data();
  if (data?.userId !== userId) {
    throw new Error("Accès non autorisé à cette conversation");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }

  if (updates.messages !== undefined) {
    updateData.messages = updates.messages.map((msg) => {
      // Filtrer les champs undefined pour éviter l'erreur Firestore
      const cleanedMsg: any = {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      };
      
      // Ajouter seulement les champs qui ne sont pas undefined
      if (msg.images !== undefined) cleanedMsg.images = msg.images;
      if (msg.sources !== undefined) cleanedMsg.sources = msg.sources;
      if (msg.sourcesWithScores !== undefined) cleanedMsg.sourcesWithScores = msg.sourcesWithScores;
      
      return cleanedMsg;
    });
  }

  if (updates.tags !== undefined) {
    updateData.tags = updates.tags;
  }

  await adminDb.collection("assistant_conversations").doc(conversationId).update(updateData);
}

/**
 * Supprime une conversation
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();

  if (!doc.exists) {
    throw new Error("Conversation non trouvée");
  }

  const data = doc.data();
  if (data?.userId !== userId) {
    throw new Error("Accès non autorisé à cette conversation");
  }

  await adminDb.collection("assistant_conversations").doc(conversationId).delete();
}

/**
 * Partage une conversation avec un utilisateur
 */
export async function shareConversation(
  conversationId: string,
  ownerId: string,
  targetUserId: string,
  permission: "read" | "write" = "read"
): Promise<void> {
  const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();

  if (!doc.exists) {
    throw new Error("Conversation non trouvée");
  }

  const data = doc.data();
  if (data?.userId !== ownerId) {
    throw new Error("Accès non autorisé à cette conversation");
  }

  const sharedWith = data?.sharedWith || [];
  
  // Vérifier si l'utilisateur est déjà dans la liste
  const existingIndex = sharedWith.findIndex((s: any) => s.userId === targetUserId);
  
  if (existingIndex >= 0) {
    // Mettre à jour la permission
    sharedWith[existingIndex].permission = permission;
    sharedWith[existingIndex].sharedAt = new Date();
  } else {
    // Ajouter l'utilisateur
    sharedWith.push({
      userId: targetUserId,
      permission,
      sharedAt: new Date(),
    });
  }

  await adminDb.collection("assistant_conversations").doc(conversationId).update({
    sharedWith,
    updatedAt: new Date(),
  });
}

/**
 * Génère un token de partage unique pour une conversation
 */
export async function generateShareToken(conversationId: string, ownerId: string): Promise<string> {
  const doc = await adminDb.collection("assistant_conversations").doc(conversationId).get();

  if (!doc.exists) {
    throw new Error("Conversation non trouvée");
  }

  const data = doc.data();
  if (data?.userId !== ownerId) {
    throw new Error("Accès non autorisé à cette conversation");
  }

  // Générer un token unique
  const token = `${conversationId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  await adminDb.collection("assistant_conversations").doc(conversationId).update({
    shareToken: token,
    updatedAt: new Date(),
  });

  return token;
}

/**
 * Charge une conversation partagée via token
 */
export async function loadSharedConversation(token: string): Promise<Conversation | null> {
  const snapshot = await adminDb
    .collection("assistant_conversations")
    .where("shareToken", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate() || new Date(),
    updatedAt: data?.updatedAt?.toDate() || new Date(),
    messages: (data?.messages || []).map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp?.toDate() || new Date(msg.timestamp),
    })),
  } as Conversation;
}

/**
 * Charge les conversations partagées avec un utilisateur
 * Note: Firestore ne peut pas faire de requête efficace sur des propriétés d'objets dans un tableau
 * Cette fonction récupère toutes les conversations et filtre côté serveur
 */
export async function loadSharedConversations(userId: string): Promise<Conversation[]> {
  try {
    // Récupérer toutes les conversations (limité à un nombre raisonnable pour éviter les problèmes de performance)
    // En production, on pourrait utiliser un index ou une structure de données différente
    const snapshot = await adminDb
      .collection("assistant_conversations")
      .limit(1000)
      .get();

    // Filtrer pour ne garder que celles où l'utilisateur est vraiment partagé
    const conversations = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const sharedWith = data?.sharedWith || [];
        const isShared = Array.isArray(sharedWith) && sharedWith.some((s: any) => s?.userId === userId);
        
        if (!isShared) return null;

        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
          messages: (data?.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(msg.timestamp),
          })),
        } as Conversation;
      })
      .filter((conv): conv is Conversation => conv !== null)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return conversations;
  } catch (error) {
    console.error("Erreur lors du chargement des conversations partagées:", error);
    return [];
  }
}

