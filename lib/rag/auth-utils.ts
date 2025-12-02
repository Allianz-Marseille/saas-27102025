/**
 * Utilitaires d'authentification pour les routes API RAG
 */

import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";

/**
 * Vérifie l'authentification et retourne les informations utilisateur
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ valid: boolean; uid?: string; email?: string; role?: string; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "Non authentifié" };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return { valid: false, error: "Utilisateur non trouvé" };
    }

    const userData = userDoc.data();
    if (!userData?.active) {
      return { valid: false, error: "Compte désactivé" };
    }

    return {
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email,
      role: userData.role,
    };
  } catch (error) {
    console.error("Erreur de vérification d'authentification:", error);
    return { valid: false, error: "Token invalide" };
  }
}

/**
 * Vérifie que l'utilisateur est admin
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<{ valid: boolean; uid?: string; email?: string; error?: string }> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.valid) {
    return authResult;
  }

  if (authResult.role !== "ADMINISTRATEUR") {
    return { valid: false, error: "Accès refusé : Admin requis" };
  }

  return {
    valid: true,
    uid: authResult.uid,
    email: authResult.email,
  };
}

