/**
 * Utilitaires Firestore pour les statistiques de messages
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { AdminMessage } from "@/types/message";

const MESSAGES_COLLECTION = "admin_messages";
const RECIPIENTS_COLLECTION = "message_recipients";

/**
 * Convertit un Timestamp Firestore en Date
 */
function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

export interface MessageStatistics {
  totalMessages: number;
  totalRecipients: number;
  totalRead: number;
  averageReadRate: number;
  averageReadTime: number;
  messagesByPeriod: Array<{ period: string; count: number }>;
  readRateByMessage: Array<{ messageId: string; title: string; readRate: number }>;
  messagesByPriority: Record<string, number>;
}

/**
 * Calcule les statistiques globales des messages (ADMIN uniquement)
 */
export async function getMessageStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<MessageStatistics> {
  if (!db) throw new Error("Firebase not initialized");

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  let q = query(messagesRef, orderBy("createdAt", "desc"));

  // Filtrer par période si fournie
  if (startDate) {
    q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
  }
  if (endDate) {
    q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
  }

  const snapshot = await getDocs(q);
  const messages: AdminMessage[] = snapshot.docs.map((doc) => {
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

  // Calculer les statistiques
  const totalMessages = messages.length;
  let totalRecipients = 0;
  let totalRead = 0;
  let totalReadTime = 0;
  let messagesWithReadTime = 0;

  const messagesByPriority: Record<string, number> = {};
  const readRateByMessage: Array<{ messageId: string; title: string; readRate: number }> = [];

  for (const message of messages) {
    totalRecipients += message.totalRecipients || 0;
    totalRead += message.readCount || 0;

    if (message.averageReadTime) {
      totalReadTime += message.averageReadTime;
      messagesWithReadTime++;
    }

    // Par priorité
    const priority = message.priority || "normal";
    messagesByPriority[priority] = (messagesByPriority[priority] || 0) + 1;

    // Taux de lecture par message
    if (message.totalRecipients > 0) {
      const readRate = (message.readCount || 0) / message.totalRecipients;
      readRateByMessage.push({
        messageId: message.id,
        title: message.title,
        readRate,
      });
    }
  }

  // Trier par taux de lecture décroissant
  readRateByMessage.sort((a, b) => b.readRate - a.readRate);

  // Messages par période (jour)
  const messagesByPeriodMap = new Map<string, number>();
  messages.forEach((msg) => {
    const dateKey = toDate(msg.createdAt).toISOString().split("T")[0];
    messagesByPeriodMap.set(dateKey, (messagesByPeriodMap.get(dateKey) || 0) + 1);
  });

  const messagesByPeriod = Array.from(messagesByPeriodMap.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return {
    totalMessages,
    totalRecipients,
    totalRead,
    averageReadRate: totalRecipients > 0 ? totalRead / totalRecipients : 0,
    averageReadTime: messagesWithReadTime > 0 ? totalReadTime / messagesWithReadTime : 0,
    messagesByPeriod,
    readRateByMessage: readRateByMessage.slice(0, 10), // Top 10
    messagesByPriority,
  };
}
