/**
 * Utilitaires Firestore pour les réponses aux messages
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { MessageReply } from "@/types/message";

const REPLIES_COLLECTION = "message_replies";
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
 * Convertit une Date en Timestamp Firestore
 */
function toTimestamp(value: Date | Timestamp): Timestamp {
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value instanceof Date ? value : new Date());
}

/**
 * Crée une réponse à un message
 */
export async function createReply(
  messageId: string,
  userId: string,
  userName: string | undefined,
  userEmail: string | undefined,
  content: string
): Promise<MessageReply> {
  if (!db) throw new Error("Firebase not initialized");

  // Créer la réponse
  const repliesRef = collection(db, REPLIES_COLLECTION);
  const docRef = await addDoc(repliesRef, {
    messageId,
    userId,
    userName,
    userEmail,
    content,
    readByAdmin: false,
    createdAt: Timestamp.now(),
  });

  // Mettre à jour le message pour indiquer qu'une réponse est attendue
  const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
  await updateDoc(messageRef, {
    awaitingReply: true,
  });

  return {
    id: docRef.id,
    messageId,
    userId,
    userName,
    userEmail,
    content,
    readByAdmin: false,
    createdAt: new Date(),
  } as MessageReply;
}

/**
 * Récupère toutes les réponses d'un message
 */
export async function getRepliesByMessage(messageId: string): Promise<MessageReply[]> {
  if (!db) throw new Error("Firebase not initialized");

  const repliesRef = collection(db, REPLIES_COLLECTION);
  const q = query(
    repliesRef,
    where("messageId", "==", messageId),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      messageId: data.messageId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      content: data.content,
      readByAdmin: data.readByAdmin || false,
      readByAdminAt: data.readByAdminAt ? toDate(data.readByAdminAt) : undefined,
      createdAt: toDate(data.createdAt),
    } as MessageReply;
  });
}

/**
 * Récupère toutes les réponses non lues par l'admin
 */
export async function getUnreadReplies(): Promise<MessageReply[]> {
  if (!db) throw new Error("Firebase not initialized");

  const repliesRef = collection(db, REPLIES_COLLECTION);
  const q = query(
    repliesRef,
    where("readByAdmin", "==", false),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      messageId: data.messageId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      content: data.content,
      readByAdmin: data.readByAdmin || false,
      readByAdminAt: data.readByAdminAt ? toDate(data.readByAdminAt) : undefined,
      createdAt: toDate(data.createdAt),
    } as MessageReply;
  });
}

/**
 * Marque une réponse comme lue par l'admin
 */
export async function markReplyAsRead(replyId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const replyRef = doc(db, REPLIES_COLLECTION, replyId);
  await updateDoc(replyRef, {
    readByAdmin: true,
    readByAdminAt: Timestamp.now(),
  });
}

/**
 * Marque toutes les réponses d'un message comme lues par l'admin
 */
export async function markAllRepliesAsRead(messageId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const replies = await getRepliesByMessage(messageId);
  const unreadReplies = replies.filter((r) => !r.readByAdmin);

  if (unreadReplies.length === 0) return;

  const batch = unreadReplies.map((reply) => markReplyAsRead(reply.id));
  await Promise.all(batch);

  // Vérifier s'il reste des réponses non lues pour ce message
  const allReplies = await getRepliesByMessage(messageId);
  const stillUnread = allReplies.some((r) => !r.readByAdmin);

  // Si toutes les réponses sont lues, on peut optionnellement retirer awaitingReply
  // Mais on le laisse pour que l'admin puisse voir qu'il y a eu des réponses
}
