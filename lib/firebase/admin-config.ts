/**
 * Configuration Firebase Admin SDK pour les opérations côté serveur
 * 
 * Ce module initialise Firebase Admin SDK pour une utilisation dans :
 * - Server Actions
 * - API Routes
 * - Scripts Node.js
 * 
 * NE PAS UTILISER côté client ! Pour le client, utilisez lib/firebase/config.ts
 * 
 * Usage:
 * ```typescript
 * import { adminAuth, adminDb } from '@/lib/firebase/admin-config';
 * 
 * // Dans une Server Action ou API Route
 * const users = await adminAuth.listUsers();
 * const doc = await adminDb.collection('users').doc(userId).get();
 * ```
 */

import admin from "firebase-admin";

/**
 * Initialise Firebase Admin SDK de manière paresseuse
 * Utilise les variables d'environnement (Vercel) ou le fichier local (dev)
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  let serviceAccount: admin.ServiceAccount;

  // Option 1 : Base64 — évite les erreurs DECODER sur la clé privée
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    try {
      const json = Buffer.from(base64, "base64").toString("utf8");
      serviceAccount = JSON.parse(json) as admin.ServiceAccount;
    } catch (error) {
      console.error("FIREBASE_SERVICE_ACCOUNT_BASE64 invalid:", error);
      throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is invalid.");
    }
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    // Option 2 : Variables d'environnement (Vercel)
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
  } else {
    // Option 3 : Fichier JSON local (dev)
    try {
      const fs = require("fs");
      const path = require("path");

      const jsonPath = path.join(
        process.cwd(),
        "saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json"
      );
      const jsonData = fs.readFileSync(jsonPath, "utf8");
      serviceAccount = JSON.parse(jsonData);
    } catch (error) {
      console.error("Firebase Admin credentials missing:", error);
      throw new Error(
        "Firebase Admin credentials are missing. Check environment variables or local JSON file."
      );
    }
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Initialiser l'app
initializeFirebaseAdmin();

/**
 * Instance Firebase Auth côté serveur
 * Utilisez ceci pour gérer les utilisateurs depuis le serveur
 */
export const adminAuth = admin.auth();

/**
 * Instance Firestore côté serveur
 * Utilisez ceci pour accéder à Firestore depuis le serveur
 */
export const adminDb = admin.firestore();

/**
 * Instance FieldValue pour les opérations Firestore
 */
export const FieldValue = admin.firestore.FieldValue;

/**
 * Instance Timestamp pour les opérations Firestore
 */
export const Timestamp = admin.firestore.Timestamp;

/**
 * Instance Firebase Storage côté serveur
 * Utilisez ceci pour gérer les fichiers depuis le serveur
 */
export const adminStorage = admin.storage();

/**
 * Obtient le bucket Storage configuré
 * Utilise les variables d'environnement ou le bucket par défaut du projet
 * Priorité au nouveau format Firebase Storage (.firebasestorage.app)
 */
export function getStorageBucket() {
  const bucketName = 
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`;
  
  return adminStorage.bucket(bucketName);
}

/**
 * Vérifie que le bucket Storage est accessible
 * Utile pour le diagnostic
 */
export async function testStorageBucketAccess(): Promise<{ success: boolean; bucketName: string; error?: string }> {
  try {
    const bucket = getStorageBucket();
    const bucketName = bucket.name;
    
    // Vérifier si le bucket existe
    const [exists] = await bucket.exists();
    
    if (!exists) {
      return {
        success: false,
        bucketName,
        error: "Le bucket n'existe pas. Vérifiez qu'il est créé dans Firebase Console.",
      };
    }
    
    // Tester les permissions en listant les fichiers
    try {
      await bucket.getFiles({ maxResults: 1 });
      return {
        success: true,
        bucketName,
      };
    } catch (error: any) {
      return {
        success: false,
        bucketName,
        error: `Permissions insuffisantes (${error.code || error.message}). Vérifiez que le service account a le rôle 'Storage Admin'.`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      bucketName: "unknown",
      error: error.message || "Erreur inconnue lors de l'accès au bucket",
    };
  }
}

export { admin };

