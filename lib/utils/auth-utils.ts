/**
 * Utilitaires d'authentification pour les API routes
 */

import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin-config";

interface AuthResult {
  valid: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}

/**
 * Vérifie qu'un utilisateur est authentifié
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "Token manquant" };
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    return {
      valid: true,
      userId: decodedToken.uid,
      userEmail: decodedToken.email,
    };
  } catch (error) {
    console.error("Erreur vérification auth:", error);
    return { valid: false, error: "Token invalide" };
  }
}

/**
 * Vérifie qu'un utilisateur est authentifié ET administrateur
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.valid || !authResult.userId) {
      return authResult;
    }

    // Vérifier le rôle dans Firestore
    const userDoc = await adminDb.collection("users").doc(authResult.userId).get();
    
    if (!userDoc.exists) {
      return { valid: false, error: "Utilisateur non trouvé" };
    }

    const userData = userDoc.data();
    
    if (userData?.role !== "ADMINISTRATEUR") {
      return { valid: false, error: "Accès administrateur requis" };
    }

    return authResult;
  } catch (error) {
    console.error("Erreur vérification admin:", error);
    return { valid: false, error: "Erreur de vérification" };
  }
}

