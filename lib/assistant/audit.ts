/**
 * Système d'audit trail pour l'assistant IA
 * Log toutes les actions importantes pour traçabilité et sécurité
 */

import { adminDb } from "@/lib/firebase/admin-config";

export type AuditAction =
  | "conversation_created"
  | "conversation_updated"
  | "conversation_deleted"
  | "conversation_shared"
  | "message_sent"
  | "file_uploaded"
  | "file_deleted"
  | "export_generated"
  | "template_created"
  | "template_deleted"
  | "rag_document_uploaded"
  | "rag_document_deleted"
  | "budget_config_updated";

export interface AuditLog {
  userId: string;
  timestamp: Date;
  action: AuditAction;
  metadata: {
    conversationId?: string;
    documentId?: string;
    templateId?: string;
    fileType?: string;
    fileName?: string;
    exportFormat?: string;
    // Pas de contenu sensible (pas de messages, pas de contenu de fichiers)
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log une action dans l'audit trail
 */
export async function logAction(
  userId: string,
  action: AuditAction,
  metadata: AuditLog["metadata"] = {},
  request?: { ip?: string; userAgent?: string }
): Promise<void> {
  const metadataClean = Object.fromEntries(
    Object.entries(metadata).filter(([, v]) => v !== undefined)
  ) as AuditLog["metadata"];

  const log: Record<string, unknown> = {
    userId,
    timestamp: new Date(),
    action,
    metadata: metadataClean,
  };
  if (request?.ip !== undefined && request?.ip !== "") {
    log.ipAddress = request.ip;
  }
  if (request?.userAgent !== undefined && request?.userAgent !== "") {
    log.userAgent = request.userAgent;
  }

  await adminDb.collection("assistant_audit_logs").add(log);
}

/**
 * Récupère les logs d'audit pour un utilisateur
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection("assistant_audit_logs")
    .where("userId", "==", userId)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as AuditLog[];
}

/**
 * Récupère tous les logs d'audit (admin uniquement)
 */
export async function getAllAuditLogs(
  limit: number = 1000,
  startDate?: Date,
  endDate?: Date
): Promise<AuditLog[]> {
  let query = adminDb
    .collection("assistant_audit_logs")
    .orderBy("timestamp", "desc")
    .limit(limit);

  if (startDate) {
    query = query.where("timestamp", ">=", startDate) as any;
  }
  if (endDate) {
    query = query.where("timestamp", "<=", endDate) as any;
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as AuditLog[];
}

/**
 * Récupère les logs d'audit filtrés par action
 */
export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 100
): Promise<AuditLog[]> {
  const snapshot = await adminDb
    .collection("assistant_audit_logs")
    .where("action", "==", action)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  })) as AuditLog[];
}

