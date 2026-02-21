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
 * Fallback : vérifie le token via l'API REST Firebase lorsque Admin SDK échoue.
 * Utilise accounts:lookup qui valide le token et retourne les infos utilisateur.
 */
async function verifyIdTokenViaRestApi(idToken: string): Promise<AuthResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: Array<{ localId: string; email?: string }> };
    const user = data.users?.[0];
    if (!user?.localId) return null;
    return {
      valid: true,
      userId: user.localId,
      userEmail: user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Vérifie qu'un utilisateur est authentifié.
 * Utilise Admin SDK en priorité ; fallback sur l'API REST si Firebase Admin échoue (ex. clé mal formatée).
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Token manquant" };
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return { valid: false, error: "Token manquant" };

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      valid: true,
      userId: decodedToken.uid,
      userEmail: decodedToken.email ?? undefined,
    };
  } catch (adminError) {
    console.error("Erreur vérification auth (Admin SDK):", adminError);

    const restResult = await verifyIdTokenViaRestApi(token);
    if (restResult?.valid) {
      console.warn("Auth récupérée via fallback REST API (Admin SDK avait échoué)");
      return restResult;
    }

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

