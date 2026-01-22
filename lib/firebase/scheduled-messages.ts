/**
 * Utilitaires Firestore pour la gestion des messages programmés
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { AdminMessage, MessageStatus } from "@/types/message";

const MESSAGES_COLLECTION = "admin_messages";

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
 * Récupère tous les messages programmés (ADMIN uniquement)
 */
export async function getScheduledMessages(): Promise<AdminMessage[]> {
  if (!db) throw new Error("Firebase not initialized");

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where("status", "==", "scheduled"),
    orderBy("scheduledAt", "asc")
  );

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
 * Récupère les messages programmés à envoyer (pour cron job/Cloud Function)
 * Messages dont la date de programmation est passée
 */
export async function getMessagesToSend(): Promise<AdminMessage[]> {
  if (!db) throw new Error("Firebase not initialized");

  const now = Timestamp.now();
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where("status", "==", "scheduled"),
    where("scheduledAt", "<=", now),
    orderBy("scheduledAt", "asc")
  );

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
 * Annule un message programmé (ADMIN uniquement)
 * Change le statut de "scheduled" à "archived"
 */
export async function cancelScheduledMessage(messageId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) {
    throw new Error("Message introuvable");
  }

  const messageData = messageDoc.data();
  if (messageData.status !== "scheduled") {
    throw new Error("Ce message n'est pas programmé");
  }

  await updateDoc(messageRef, {
    status: "archived" as MessageStatus,
  });
}

/**
 * Envoie un message programmé (pour cron job/Cloud Function)
 * Change le statut de "scheduled" à "sent" et définit sentAt
 */
export async function sendScheduledMessage(messageId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) {
    throw new Error("Message introuvable");
  }

  const messageData = messageDoc.data();
  if (messageData.status !== "scheduled") {
    throw new Error("Ce message n'est pas programmé");
  }

  const now = Timestamp.now();
  await updateDoc(messageRef, {
    status: "sent" as MessageStatus,
    sentAt: now,
  });
}
