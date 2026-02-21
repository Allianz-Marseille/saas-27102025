/**
 * Configuration Firebase Admin SDK pour les opérations côté serveur
 *
 * Ce module utilise une initialisation LAZY : aucune initialisation au chargement.
 * getFirestore() / getAdminDb() / getAdminAuth() initialisent à la première utilisation.
 *
 * NE PAS UTILISER côté client ! Pour le client, utilisez lib/firebase/config.ts
 *
 * Usage:
 * ```typescript
 * import { adminDb, adminAuth } from '@/lib/firebase/admin-config';
 * const users = await adminAuth.listUsers();
 * const doc = await adminDb.collection('users').doc(userId).get();
 * ```
 */

import admin from "firebase-admin";
import { Timestamp as FirestoreTimestamp } from "firebase-admin/firestore";

/**
 * Nettoie et valide la clé privée Firebase pour éviter l'erreur DECODER routines::unsupported.
 * Gère : \n textuels → vrais sauts de ligne, guillemets superflus, format PEM.
 */
export function getSafePrivateKey(key: string): string {
  if (!key || typeof key !== "string") return key;
  let k = key
    .replace(/\\n/g, "\n")
    .replace(/"/g, "")
    .trim();
  if (!k.startsWith("-----BEGIN PRIVATE KEY-----")) {
    console.warn(
      "FIREBASE_PRIVATE_KEY: format suspect (pas de -----BEGIN PRIVATE KEY-----)"
    );
  }
  return k;
}

let appInstance: admin.app.App | null = null;
let initError: Error | null = null;

/**
 * Initialise Firebase Admin de manière paresseuse.
 * Ne lance AUCUNE initialisation au chargement du module.
 */
function initializeFirebaseAdmin(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }
  if (initError) {
    throw initError;
  }

  try {
    let serviceAccount: admin.ServiceAccount;

    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64) {
      const json = Buffer.from(base64, "base64").toString("utf8");
      const parsed = JSON.parse(json) as admin.ServiceAccount & {
        private_key?: string;
      };
      if (parsed.private_key) {
        parsed.private_key = getSafePrivateKey(parsed.private_key);
      }
      serviceAccount = parsed;
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: getSafePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
    } else {
      const fs = require("fs");
      const path = require("path");
      const jsonPath = path.join(
        process.cwd(),
        "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
      );
      const jsonData = fs.readFileSync(jsonPath, "utf8");
      const parsed = JSON.parse(jsonData) as admin.ServiceAccount & {
        private_key?: string;
      };
      if (parsed.private_key) {
        parsed.private_key = getSafePrivateKey(parsed.private_key);
      }
      serviceAccount = parsed;
    }

    appInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return appInstance;
  } catch (e) {
    initError = e instanceof Error ? e : new Error(String(e));
    console.error("Firebase Admin init fail:", initError);
    throw initError;
  }
}

/**
 * Retourne Firestore. Initialise si nécessaire (lazy).
 * Lance une erreur si l'initialisation échoue.
 */
export function getFirestore(): admin.firestore.Firestore {
  const app = appInstance ?? initializeFirebaseAdmin();
  if (!app) throw new Error("Firebase Admin non initialisé");
  return app.firestore();
}

/**
 * Retourne Firestore ou null si initialisation impossible.
 * Utile pour les routes qui peuvent continuer sans persistance.
 */
export function getAdminDbOrNull(): admin.firestore.Firestore | null {
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

/**
 * Retourne Auth. Initialise si nécessaire (lazy).
 */
export function getAdminAuth(): admin.auth.Auth {
  const app = appInstance ?? initializeFirebaseAdmin();
  if (!app) throw new Error("Firebase Admin non initialisé");
  return app.auth();
}

/** Proxy pour rétrocompatibilité — adminDb (lazy) */
function getAdminDbOrThrow(): admin.firestore.Firestore {
  return getFirestore();
}

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_, prop: string) {
    const db = getAdminDbOrThrow();
    const val = (db as unknown as Record<string, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(db) : val;
  },
});

/** Proxy pour rétrocompatibilité — adminAuth (lazy) */
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_, prop: string) {
    const auth = getAdminAuth();
    const val = (auth as unknown as Record<string, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(auth) : val;
  },
});

/** Timestamp Firestore — utilisable sans init */
export const Timestamp = FirestoreTimestamp;

/**
 * Instance Storage côté serveur (lazy)
 */
export function getAdminStorage(): admin.storage.Storage {
  const app = appInstance ?? initializeFirebaseAdmin();
  if (!app) throw new Error("Firebase Admin non initialisé");
  return app.storage();
}

/** Proxy pour rétrocompatibilité — adminStorage */
export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_, prop: string) {
    const storage = getAdminStorage();
    const val = (storage as unknown as Record<string, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(storage) : val;
  },
});

export const FieldValue = admin.firestore.FieldValue;

export function getStorageBucket() {
  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`;
  return getAdminStorage().bucket(bucketName);
}

export async function testStorageBucketAccess(): Promise<{
  success: boolean;
  bucketName: string;
  error?: string;
}> {
  try {
    const bucket = getStorageBucket();
    const bucketName = bucket.name;
    const [exists] = await bucket.exists();
    if (!exists) {
      return {
        success: false,
        bucketName,
        error:
          "Le bucket n'existe pas. Vérifiez qu'il est créé dans Firebase Console.",
      };
    }
    try {
      await bucket.getFiles({ maxResults: 1 });
      return { success: true, bucketName };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      return {
        success: false,
        bucketName,
        error: `Permissions insuffisantes (${err.code ?? err.message}).`,
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      bucketName: "unknown",
      error: err.message ?? "Erreur inconnue lors de l'accès au bucket",
    };
  }
}

export { admin };
