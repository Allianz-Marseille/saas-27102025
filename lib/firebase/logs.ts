import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./config";

export type LogLevel = "info" | "warning" | "error" | "success";
export type LogAction =
  | "user_login"
  | "user_logout"
  | "act_created"
  | "act_updated"
  | "act_deleted"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "company_updated"
  | "commission_validated"
  | "system_error"
  | "data_export";

export interface LogEntry {
  id?: string;
  timestamp: Date | Timestamp;
  level: LogLevel;
  action: LogAction;
  userId: string;
  userEmail: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

const LOGS_COLLECTION = "logs";

/**
 * Crée une nouvelle entrée de log
 */
export async function createLog(
  logData: Omit<LogEntry, "id" | "timestamp">
): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  
  try {
    const docRef = await addDoc(collection(db, LOGS_COLLECTION), {
      ...logData,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating log:", error);
    throw error;
  }
}

/**
 * Récupère les logs avec filtres optionnels
 */
export async function getLogs(options?: {
  limitCount?: number;
  level?: LogLevel;
  action?: LogAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<LogEntry[]> {
  if (!db) throw new Error("Firestore not initialized");
  
  try {
    const logsRef = collection(db, LOGS_COLLECTION);
    let q = query(logsRef, orderBy("timestamp", "desc"));

    // Appliquer les filtres
    if (options?.level) {
      q = query(q, where("level", "==", options.level));
    }
    if (options?.action) {
      q = query(q, where("action", "==", options.action));
    }
    if (options?.userId) {
      q = query(q, where("userId", "==", options.userId));
    }
    if (options?.startDate) {
      q = query(q, where("timestamp", ">=", Timestamp.fromDate(options.startDate)));
    }
    if (options?.endDate) {
      q = query(q, where("timestamp", "<=", Timestamp.fromDate(options.endDate)));
    }

    // Limite par défaut : 100 logs
    q = query(q, limit(options?.limitCount ?? 100));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as DocumentData;
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
      } as LogEntry;
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    throw error;
  }
}

/**
 * Helper pour logger une connexion utilisateur
 */
export async function logUserLogin(userId: string, userEmail: string): Promise<void> {
  await createLog({
    level: "info",
    action: "user_login",
    userId,
    userEmail,
    description: `Connexion de ${userEmail}`,
  });
}

/**
 * Helper pour logger une déconnexion utilisateur
 */
export async function logUserLogout(
  userId: string,
  userEmail: string,
  customDescription?: string
): Promise<void> {
  await createLog({
    level: "info",
    action: "user_logout",
    userId,
    userEmail,
    description: customDescription || `Déconnexion de ${userEmail}`,
  });
}

/**
 * Helper pour logger la création d'un acte
 */
export async function logActCreated(
  userId: string,
  userEmail: string,
  actData: { clientNom: string; kind: string; contratType?: string }
): Promise<void> {
  await createLog({
    level: "success",
    action: "act_created",
    userId,
    userEmail,
    description: `Création d'un acte ${actData.kind} pour ${actData.clientNom}`,
    metadata: actData,
  });
}

/**
 * Helper pour logger la modification d'un acte
 */
export async function logActUpdated(
  userId: string,
  userEmail: string,
  actId: string,
  clientNom: string
): Promise<void> {
  await createLog({
    level: "info",
    action: "act_updated",
    userId,
    userEmail,
    description: `Modification de l'acte de ${clientNom}`,
    metadata: { actId },
  });
}

/**
 * Helper pour logger la suppression d'un acte
 */
export async function logActDeleted(
  userId: string,
  userEmail: string,
  actId: string,
  clientNom: string
): Promise<void> {
  await createLog({
    level: "warning",
    action: "act_deleted",
    userId,
    userEmail,
    description: `Suppression de l'acte de ${clientNom}`,
    metadata: { actId },
  });
}

/**
 * Helper pour logger une erreur système
 */
export async function logSystemError(
  userId: string,
  userEmail: string,
  errorMessage: string,
  errorDetails?: Record<string, unknown>
): Promise<void> {
  await createLog({
    level: "error",
    action: "system_error",
    userId,
    userEmail,
    description: `Erreur système: ${errorMessage}`,
    metadata: errorDetails,
  });
}

/**
 * Helper pour logger la création d'un utilisateur par un admin
 */
export async function logUserCreated(
  adminUserId: string,
  adminEmail: string,
  newUserEmail: string,
  role: string
): Promise<void> {
  await createLog({
    level: "success",
    action: "user_created",
    userId: adminUserId,
    userEmail: adminEmail,
    description: `Création d'un utilisateur ${newUserEmail} avec le rôle ${role}`,
    metadata: { newUserEmail, role },
  });
}

/**
 * Helper pour logger la modification d'un utilisateur par un admin
 */
export async function logUserUpdated(
  adminUserId: string,
  adminEmail: string,
  targetUserEmail: string,
  changes: Record<string, unknown>
): Promise<void> {
  const changeDescription = Object.entries(changes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
    
  await createLog({
    level: "info",
    action: "user_updated",
    userId: adminUserId,
    userEmail: adminEmail,
    description: `Modification de l'utilisateur ${targetUserEmail} (${changeDescription})`,
    metadata: { targetUserEmail, changes },
  });
}

/**
 * Helper pour logger la suppression d'un utilisateur par un admin
 */
export async function logUserDeleted(
  adminUserId: string,
  adminEmail: string,
  deletedUserEmail: string
): Promise<void> {
  await createLog({
    level: "warning",
    action: "user_deleted",
    userId: adminUserId,
    userEmail: adminEmail,
    description: `Suppression de l'utilisateur ${deletedUserEmail}`,
    metadata: { deletedUserEmail },
  });
}

