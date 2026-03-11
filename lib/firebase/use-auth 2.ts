"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { UserData } from "./auth";
import { logUserLogin } from "./logs";
import { retryAsync, isFirebaseRetryableError } from "@/lib/utils/retry";

export interface AuthState {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
}

type ValidRole = UserData["role"];

const VALID_ROLES: ValidRole[] = [
  "ADMINISTRATEUR",
  "CDC_COMMERCIAL",
  "COMMERCIAL_SANTE_INDIVIDUEL",
  "COMMERCIAL_SANTE_COLLECTIVE",
  "GESTIONNAIRE_SINISTRE",
];

/** Convertit un champ createdAt Firestore en Date JS. */
function parseCreatedAt(value: unknown): Date {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (value) return new Date(value as string);
  return new Date();
}

/**
 * Construit un UserData à partir des données Firestore brutes.
 * Retourne null si les données sont incohérentes (rôle absent/invalide, id ou email manquant).
 */
function buildUserData(
  data: Record<string, unknown>,
  fallbackUid: string,
  fallbackEmail: string | null
): UserData | null {
  const id = String(data.id || fallbackUid);
  const email = String(data.email || fallbackEmail || "");

  if (!id || !email) {
    console.error("❌ Données minimales manquantes (id ou email) pour:", fallbackUid);
    return null;
  }

  const roleString = String(data.role || "");
  if (!VALID_ROLES.includes(roleString as ValidRole)) {
    console.error(
      `❌ Rôle absent ou invalide pour: ${fallbackUid} (valeur: "${roleString}") — accès refusé.`
    );
    return null;
  }

  return {
    id,
    email,
    role: roleString as ValidRole,
    active: typeof data.active === "boolean" ? data.active : true,
    createdAt: parseCreatedAt(data.createdAt),
  };
}

/**
 * Lance le log de connexion en fire-and-forget.
 * N'attend pas la résolution pour ne pas bloquer le chargement de l'UI.
 */
function fireAndForgetLogin(
  uid: string,
  email: string,
  loginRef: { current: boolean }
): void {
  if (loginRef.current || !email) return;
  loginRef.current = true;
  retryAsync(() => logUserLogin(uid, email), {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    shouldRetry: isFirebaseRetryableError,
    onRetry: (attempt, error) => {
      console.warn(
        `⚠️ Échec log connexion (tentative ${attempt}/3):`,
        error instanceof Error ? error.message : error
      );
    },
  }).catch((logError) => {
    console.error(
      "❌ Échec définitif du log de connexion après 3 tentatives:",
      logError instanceof Error ? logError.message : logError
    );
  });
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoggedLogin = useRef(false);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && db) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            console.error("❌ Document Firestore introuvable pour:", firebaseUser.uid);
            setUserData(null);
            setLoading(false);
            return;
          }

          const data = userDocSnap.data() as Record<string, unknown>;
          const parsed = buildUserData(data, firebaseUser.uid, firebaseUser.email);

          setUserData(parsed);
          setLoading(false); // débloque l'UI immédiatement, sans attendre le log

          // Log de connexion en arrière-plan (ne bloque pas le rendu)
          if (parsed) {
            fireAndForgetLogin(firebaseUser.uid, parsed.email, hasLoggedLogin);
          }
        } catch (error) {
          const firebaseError = error as { code?: string; message?: string };
          const errorCode = firebaseError?.code ?? "unknown";
          const errorMessage =
            firebaseError?.message ?? (error instanceof Error ? error.message : String(error));

          console.error(`❌ Erreur récupération données utilisateur [${errorCode}]: ${errorMessage}`);

          if (errorCode === "permission-denied") {
            console.error(
              `   → Vérifiez que users/${firebaseUser.uid} existe et que les règles Firestore autorisent la lecture.`
            );
          }

          setUserData(null);
          setLoading(false);
        }
      } else {
        setUserData(null);
        hasLoggedLogin.current = false;
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}
