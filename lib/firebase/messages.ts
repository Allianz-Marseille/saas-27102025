/**
 * Utilitaires Firestore pour la gestion des messages admin → commerciaux
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "./config";
import {
  AdminMessage,
  MessageRecipient,
  CreateMessageInput,
  MessageStatus,
  MessageTargetType,
} from "@/types/message";
import { UserRole } from "@/lib/utils/roles";
import { UserData, getAllUsers } from "./auth";

const MESSAGES_COLLECTION = "admin_messages";
const RECIPIENTS_COLLECTION = "message_recipients";
const USERS_COLLECTION = "users";

/**
 * Convertit un Timestamp Firestore en Date
 */
function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

/**
 * Convertit une Date en Timestamp Firestore
 */
function toTimestamp(value: Date | Timestamp): Timestamp {
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value);
}

/**
 * Récupère les utilisateurs actifs d'un rôle spécifique
 */
export async function getUsersByRole(role: UserRole): Promise<UserData[]> {
  if (!db) throw new Error("Firebase not initialized");

  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(
    usersRef,
    where("role", "==", role),
    where("active", "==", true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id || doc.id,
      email: data.email,
      role: data.role,
      active: data.active,
      createdAt: toDate(data.createdAt),
    } as UserData;
  });
}

/**
 * Récupère tous les utilisateurs actifs (pour messages globaux)
 */
async function getAllActiveUsers(): Promise<UserData[]> {
  if (!db) throw new Error("Firebase not initialized");

  const allUsers = await getAllUsers();
  return allUsers.filter((user) => user.active && user.role !== "ADMINISTRATEUR");
}

/**
 * Calcule la liste des destinataires selon le type de ciblage
 */
async function calculateRecipients(
  targetType: MessageTargetType,
  targetRole?: UserRole,
  targetUserId?: string
): Promise<UserData[]> {
  switch (targetType) {
    case "global":
      return getAllActiveUsers();
    case "role":
      if (!targetRole) {
        throw new Error("targetRole est requis pour un message par rôle");
      }
      return getUsersByRole(targetRole);
    case "personal":
      if (!targetUserId) {
        throw new Error("targetUserId est requis pour un message personnel");
      }
      const user = await getDoc(doc(db!, USERS_COLLECTION, targetUserId));
      if (!user.exists()) {
        throw new Error("Utilisateur introuvable");
      }
      const userData = user.data();
      if (!userData.active) {
        throw new Error("L'utilisateur n'est pas actif");
      }
      return [
        {
          id: user.id,
          email: userData.email,
          role: userData.role,
          active: userData.active,
          createdAt: toDate(userData.createdAt),
        } as UserData,
      ];
    default:
      throw new Error("Type de ciblage invalide");
  }
}

/**
 * Crée un message et ses recipients (ADMIN uniquement)
 */
export async function createMessage(
  input: CreateMessageInput,
  createdBy: string,
  createdByName?: string
): Promise<AdminMessage> {
  if (!db) throw new Error("Firebase not initialized");

  // Validation
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("Le titre est obligatoire");
  }
  if (input.title.length > 100) {
    throw new Error("Le titre ne peut pas dépasser 100 caractères");
  }
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("Le contenu est obligatoire");
  }

  // Calculer les destinataires
  const recipients = await calculateRecipients(
    input.targetType,
    input.targetRole,
    input.targetUserId
  );

  if (recipients.length === 0) {
    throw new Error("Aucun destinataire trouvé pour ce message");
  }

  const now = Timestamp.now();
  const messageData: Record<string, any> = {
    createdBy,
    title: input.title.trim(),
    content: input.content.trim(),
    priority: input.priority,
    targetType: input.targetType,
    status: input.scheduledAt ? ("scheduled" as MessageStatus) : ("sent" as MessageStatus),
    pinned: false,
    awaitingReply: input.awaitingReply || false,
    totalRecipients: recipients.length,
    readCount: 0,
    unreadCount: recipients.length,
    tags: input.tags || [],
    images: input.images || [],
    videos: input.videos || [],
    attachments: input.attachments || [],
    createdAt: now,
  };

  // Ajouter les champs optionnels seulement s'ils existent
  if (createdByName) {
    messageData.createdByName = createdByName;
  }
  if (input.targetRole) {
    messageData.targetRole = input.targetRole;
  }
  if (input.targetUserId) {
    messageData.targetUserId = input.targetUserId;
  }
  if (!input.scheduledAt) {
    messageData.sentAt = now;
  } else {
    messageData.scheduledAt = toTimestamp(input.scheduledAt);
  }
  if (input.category) {
    messageData.category = input.category;
  }

  // Utiliser un batch pour créer le message et tous les recipients atomiquement
  const batch = writeBatch(db);

  // Créer le message
  const messageRef = doc(collection(db, MESSAGES_COLLECTION));
  batch.set(messageRef, messageData);

  // Créer les recipients
  // Note: On utilise addDoc après le commit pour éviter les problèmes de typage avec batch.set
  // L'atomicité est garantie car on crée d'abord le message, puis tous les recipients
  await batch.commit();

  // Créer les recipients individuellement avec setDoc pour avoir un ID explicite
  if (!db) throw new Error("Firebase not initialized");
  
  const recipientPromises = recipients.map(async (recipient) => {
    if (!db) throw new Error("Firebase not initialized");
    const recipientId = `${recipient.id}_${messageRef.id}`;
    const recipientRef = doc(db, RECIPIENTS_COLLECTION, recipientId);
    const recipientData: Record<string, any> = {
      id: recipientId,
      messageId: messageRef.id,
      userId: recipient.id,
      read: false,
      notified: false,
      createdAt: now,
    };
    await (setDoc as any)(recipientRef, recipientData);
  });

  await Promise.all(recipientPromises);

  // Retourner le message créé
  return {
    id: messageRef.id,
    ...messageData,
    createdAt: toDate(messageData.createdAt),
    sentAt: messageData.sentAt ? toDate(messageData.sentAt) : undefined,
    scheduledAt: messageData.scheduledAt ? toDate(messageData.scheduledAt) : undefined,
  } as AdminMessage;
}

/**
 * Récupère tous les messages (ADMIN uniquement)
 */
export async function getAllMessages(): Promise<AdminMessage[]> {
  if (!db) throw new Error("Firebase not initialized");

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(messagesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetType: data.targetType,
      targetRole: data.targetRole,
      targetUserId: data.targetUserId,
      status: data.status,
      sentAt: data.sentAt ? toDate(data.sentAt) : undefined,
      scheduledAt: data.scheduledAt ? toDate(data.scheduledAt) : undefined,
      pinned: data.pinned || false,
      awaitingReply: data.awaitingReply || false,
      totalRecipients: data.totalRecipients || 0,
      readCount: data.readCount || 0,
      unreadCount: data.unreadCount || 0,
      category: data.category,
      tags: data.tags || [],
      images: data.images || [],
      videos: data.videos || [],
      attachments: data.attachments || [],
      averageReadTime: data.averageReadTime,
      clickCount: data.clickCount,
      completionRate: data.completionRate,
      createdAt: toDate(data.createdAt),
    } as AdminMessage;
  });
}

/**
 * Récupère les messages d'un utilisateur (tous rôles sauf admin)
 */
export async function getMessagesByUser(userId: string): Promise<AdminMessage[]> {
  if (!db) throw new Error("Firebase not initialized");

  // Récupérer tous les recipients de l'utilisateur
  const recipientsRef = collection(db, RECIPIENTS_COLLECTION);
  const q = query(
    recipientsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const recipientsSnapshot = await getDocs(q);
  const messageIds = recipientsSnapshot.docs.map((doc) => doc.data().messageId);

  if (messageIds.length === 0) {
    return [];
  }

  // Récupérer les messages correspondants un par un
  // Note: On utilise Promise.all pour récupérer tous les messages en parallèle
  const messagePromises = messageIds.map((messageId) =>
    getMessageById(messageId)
  );

  const messages = await Promise.all(messagePromises);

  // Filtrer les null et trier par date de création (plus récent en premier)
  return messages
    .filter((msg): msg is AdminMessage => msg !== null)
    .sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : toDate(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : toDate(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
}

/**
 * Marque un message comme lu (utilisateur récepteur uniquement)
 */
export async function markAsRead(
  messageId: string,
  userId: string
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  // Trouver le recipient correspondant
  const recipientsRef = collection(db, RECIPIENTS_COLLECTION);
  const q = query(
    recipientsRef,
    where("messageId", "==", messageId),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("Message introuvable pour cet utilisateur");
  }

  const recipientDoc = snapshot.docs[0];
  const recipientData = recipientDoc.data();

  // Si déjà lu, ne rien faire
  if (recipientData.read) {
    return;
  }

  const now = Timestamp.now();
  const batch = writeBatch(db);

  // Mettre à jour le recipient
  batch.update(recipientDoc.ref, {
    read: true,
    readAt: now,
  });

  // Mettre à jour les statistiques du message
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageDoc = await getDoc(messageRef);

  if (messageDoc.exists()) {
    const messageData = messageDoc.data();
    const newReadCount = (messageData.readCount || 0) + 1;
    const newUnreadCount = Math.max((messageData.unreadCount || 0) - 1, 0);

    batch.update(messageRef, {
      readCount: newReadCount,
      unreadCount: newUnreadCount,
    });
  }

  await batch.commit();
}

/**
 * Compte les messages non lus d'un utilisateur (tous rôles sauf admin)
 */
export async function getUnreadCount(userId: string): Promise<number> {
  if (!db) throw new Error("Firebase not initialized");

  const recipientsRef = collection(db, RECIPIENTS_COLLECTION);
  const q = query(
    recipientsRef,
    where("userId", "==", userId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Récupère les destinataires d'un message (ADMIN uniquement)
 */
export async function getRecipientsByMessage(
  messageId: string
): Promise<MessageRecipient[]> {
  if (!db) throw new Error("Firebase not initialized");

  const recipientsRef = collection(db, RECIPIENTS_COLLECTION);
  const q = query(
    recipientsRef,
    where("messageId", "==", messageId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id || doc.id,
      messageId: data.messageId,
      userId: data.userId,
      read: data.read || false,
      readAt: data.readAt ? toDate(data.readAt) : undefined,
      notified: data.notified || false,
      notifiedAt: data.notifiedAt ? toDate(data.notifiedAt) : undefined,
      createdAt: toDate(data.createdAt),
      readTime: data.readTime,
      readProgress: data.readProgress,
    } as MessageRecipient;
  });
}

/**
 * Met à jour les statistiques d'un message (ADMIN uniquement)
 */
export async function updateMessageStats(messageId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const recipients = await getRecipientsByMessage(messageId);
  const readCount = recipients.filter((r) => r.read).length;
  const unreadCount = recipients.length - readCount;

  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  await updateDoc(messageRef, {
    readCount,
    unreadCount,
    totalRecipients: recipients.length,
  });
}

/**
 * Récupère un message par son ID
 */
export async function getMessageById(messageId: string): Promise<AdminMessage | null> {
  if (!db) throw new Error("Firebase not initialized");

  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) {
    return null;
  }

  const data = messageDoc.data();
  return {
    id: messageDoc.id,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    title: data.title,
    content: data.content,
    priority: data.priority,
    targetType: data.targetType,
    targetRole: data.targetRole,
    targetUserId: data.targetUserId,
    status: data.status,
    sentAt: data.sentAt ? toDate(data.sentAt) : undefined,
    scheduledAt: data.scheduledAt ? toDate(data.scheduledAt) : undefined,
    pinned: data.pinned || false,
    awaitingReply: data.awaitingReply || false,
    totalRecipients: data.totalRecipients || 0,
    readCount: data.readCount || 0,
    unreadCount: data.unreadCount || 0,
    category: data.category,
    tags: data.tags || [],
    images: data.images || [],
    videos: data.videos || [],
    attachments: data.attachments || [],
    averageReadTime: data.averageReadTime,
    clickCount: data.clickCount,
    completionRate: data.completionRate,
    createdAt: toDate(data.createdAt),
  } as AdminMessage;
}

/**
 * Récupère un recipient spécifique
 */
export async function getRecipient(
  messageId: string,
  userId: string
): Promise<MessageRecipient | null> {
  if (!db) throw new Error("Firebase not initialized");

  const recipientsRef = collection(db, RECIPIENTS_COLLECTION);
  const q = query(
    recipientsRef,
    where("messageId", "==", messageId),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: data.id || doc.id,
    messageId: data.messageId,
    userId: data.userId,
    read: data.read || false,
    readAt: data.readAt ? toDate(data.readAt) : undefined,
    notified: data.notified || false,
    notifiedAt: data.notifiedAt ? toDate(data.notifiedAt) : undefined,
    createdAt: toDate(data.createdAt),
    readTime: data.readTime,
    readProgress: data.readProgress,
  } as MessageRecipient;
}

/**
 * Récupère tous les destinataires d'un utilisateur
 */
export async function getRecipientsByUser(userId: string): Promise<MessageRecipient[]> {
  if (!db) throw new Error("Firebase not initialized");

  const recipientsRef = collection(db, RECIPIENTS_COLLECTION);
  const q = query(recipientsRef, where("userId", "==", userId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id || doc.id,
      messageId: data.messageId,
      userId: data.userId,
      read: data.read || false,
      readAt: data.readAt ? toDate(data.readAt) : undefined,
      notified: data.notified || false,
      notifiedAt: data.notifiedAt ? toDate(data.notifiedAt) : undefined,
      createdAt: toDate(data.createdAt),
      readTime: data.readTime,
      readProgress: data.readProgress,
    } as MessageRecipient;
  });
}

/**
 * Compte le nombre de messages épinglés (ADMIN uniquement)
 */
export async function getPinnedMessagesCount(): Promise<number> {
  if (!db) throw new Error("Firebase not initialized");

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(messagesRef, where("pinned", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Épingle ou désépingle un message (ADMIN uniquement)
 * Limite : maximum 5 messages épinglés
 */
export async function togglePinMessage(
  messageId: string,
  pin: boolean
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  // Si on essaie d'épingler, vérifier la limite
  if (pin) {
    const pinnedCount = await getPinnedMessagesCount();
    const message = await getMessageById(messageId);
    
    // Si le message n'est pas déjà épinglé et qu'on atteint la limite
    if (!message?.pinned && pinnedCount >= 5) {
      throw new Error("Limite de 5 messages épinglés atteinte. Veuillez désépingler un message avant d'en épingler un autre.");
    }
  }

  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  await updateDoc(messageRef, {
    pinned: pin,
  });
}
