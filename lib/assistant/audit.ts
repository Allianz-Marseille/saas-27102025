/**
 * Système d'audit trail pour l'assistant IA
 * Log toutes les actions importantes pour traçabilité et sécurité
 */

import { adminDb } from "@/lib/firebase/admin-config";
import { Timestamp } from "firebase-admin/firestore";

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
 * Construit un objet propre pour Firestore : aucune clé avec valeur undefined,
 * uniquement des types valides (string, number, boolean, null, Date/Timestamp, objets plats).
 */
function toFirestoreData(
  userId: string,
  action: AuditAction,
  metadata: AuditLog["metadata"],
  request?: { ip?: string; userAgent?: string }
): Record<string, unknown> {
  const metadataClean: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v !== undefined && v !== null && typeof v === "string") {
      metadataClean[k] = v;
    }
  }

  const data: Record<string, unknown> = {
    userId: String(userId),
    timestamp: Timestamp.fromDate(new Date()),
    action: String(action),
    metadata: metadataClean,
  };

  const ip = request?.ip;
  if (typeof ip === "string" && ip.trim() !== "") {
    data.ipAddress = ip.trim();
  }
  const ua = request?.userAgent;
  if (typeof ua === "string" && ua.trim() !== "") {
    data.userAgent = ua.trim();
  }

  return data;
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
  const data = toFirestoreData(userId, action, metadata, request);
  await adminDb.collection("assistant_audit_logs").add(data);
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

