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
          // Récupérer les données utilisateur depuis Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log("📋 Données Firestore récupérées pour:", {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              hasData: !!data,
              dataKeys: data ? Object.keys(data) : [],
              dataId: data?.id,
              dataEmail: data?.email,
              dataRole: data?.role,
              dataActive: data?.active,
            });
            
            // Valider que tous les champs requis sont présents
            if (!data.id || !data.email || !data.role || data.active === undefined) {
              console.error("❌ Données utilisateur incomplètes dans Firestore:", {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                hasId: !!data.id,
                hasEmail: !!data.email,
                hasRole: !!data.role,
                hasActive: data.active !== undefined,
                dataKeys: Object.keys(data),
                fullData: data,
              });
              
              // Essayer de récupérer les données manquantes depuis Firebase Auth
              const authEmail = firebaseUser.email;
              const authUid = firebaseUser.uid;
              
              // Si email manque, utiliser celui de Firebase Auth
              const email = data.email || authEmail || "";
              // Si id manque, utiliser l'uid
              const id = data.id || authUid;
              // Si role manque, utiliser une valeur par défaut
              const role = data.role || "CDC_COMMERCIAL";
              // Si active manque, utiliser true par défaut
              const active = data.active !== undefined ? data.active : true;
              
              // Si on a au moins un email et un id, on peut continuer
              if (email && id) {
                console.warn("⚠️ Utilisation de valeurs par défaut pour les champs manquants:", {
                  email,
                  id,
                  role,
                  active,
                });
                
                // Gérer createdAt
                let createdAt: Date;
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                  createdAt = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                  createdAt = data.createdAt;
                } else if (data.createdAt) {
                  createdAt = new Date(data.createdAt);
                } else {
                  createdAt = new Date();
                }
                
                // Valider et typer le rôle
                type ValidRole = UserData["role"];
                const validRoles: ValidRole[] = [
                  "ADMINISTRATEUR",
                  "CDC_COMMERCIAL",
                  "COMMERCIAL_SANTE_INDIVIDUEL",
                  "COMMERCIAL_SANTE_COLLECTIVE",
                  "GESTIONNAIRE_SINISTRE",
                ];
                const roleString = String(role);
                const validRole: ValidRole = validRoles.includes(roleString as ValidRole)
                  ? (roleString as ValidRole)
                  : "CDC_COMMERCIAL";
                
                setUserData({
                  id: String(id),
                  email: String(email),
                  role: validRole,
                  active: typeof active === 'boolean' ? active : true,
                  createdAt,
                });
                
                // Logger la connexion (une seule fois par session) avec retry automatique
                if (!hasLoggedLogin.current && email) {
                  hasLoggedLogin.current = true;
                  
                  // Utiliser retryAsync pour gérer les échecs réseau temporaires
                  await retryAsync(
                    () => logUserLogin(firebaseUser.uid, email),
                    {
                      maxAttempts: 3,
                      initialDelay: 1000,
                      backoffFactor: 2,
                      shouldRetry: isFirebaseRetryableError,
                      onRetry: (attempt, error) => {
                        console.warn(
                          `⚠️ Échec de l'enregistrement du log (tentative ${attempt}/3):`,
                          error instanceof Error ? error.message : error
                        );
                      },
                    }
                  )
                    .then(() => {
                      console.log("✅ Log de connexion enregistré pour:", email);
                    })
                    .catch((logError) => {
                      // Après 3 tentatives, l'erreur est définitive
                      console.error(
                        "❌ Échec définitif de l'enregistrement du log de connexion après 3 tentatives:",
                        logError instanceof Error ? logError.message : logError
                      );
                      console.error(
                        "   Ceci peut indiquer un problème de connexion réseau ou de configuration Firestore."
                      );
                    });
                }
              } else {
                console.error("❌ Impossible de récupérer les données minimales. Données utilisateur:", data);
                setUserData(null);
                setLoading(false);
                return;
              }
            } else {
              // Données complètes - traitement normal
              // Gérer createdAt : soit un Timestamp Firebase, soit déjà une Date
              let createdAt: Date;
              if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
              } else if (data.createdAt) {
                createdAt = new Date(data.createdAt);
              } else {
                createdAt = new Date();
              }
              
              // S'assurer que active est un booléen
              const active = typeof data.active === 'boolean' ? data.active : true;
              
              // Valider et typer le rôle
              type ValidRole = UserData["role"];
              const validRoles: ValidRole[] = [
                "ADMINISTRATEUR",
                "CDC_COMMERCIAL",
                "COMMERCIAL_SANTE_INDIVIDUEL",
                "COMMERCIAL_SANTE_COLLECTIVE",
                "GESTIONNAIRE_SINISTRE",
              ];
              const roleString = String(data.role);
              const role: ValidRole = validRoles.includes(roleString as ValidRole)
                ? (roleString as ValidRole)
                : "CDC_COMMERCIAL"; // Valeur par défaut si le rôle n'est pas valide
              
              setUserData({
                id: String(data.id),
                email: String(data.email),
                role: role,
                active,
                createdAt,
              });

              // Logger la connexion (une seule fois par session) avec retry automatique
              if (!hasLoggedLogin.current && data.email) {
              hasLoggedLogin.current = true;
              
              // Utiliser retryAsync pour gérer les échecs réseau temporaires
              await retryAsync(
                () => logUserLogin(firebaseUser.uid, data.email),
                {
                  maxAttempts: 3,
                  initialDelay: 1000,
                  backoffFactor: 2,
                  shouldRetry: isFirebaseRetryableError,
                  onRetry: (attempt, error) => {
                    console.warn(
                      `⚠️ Échec de l'enregistrement du log (tentative ${attempt}/3):`,
                      error instanceof Error ? error.message : error
                    );
                  },
                }
              )
                .then(() => {
                  console.log("✅ Log de connexion enregistré pour:", data.email);
                })
                .catch((logError) => {
                  // Après 3 tentatives, l'erreur est définitive
                  console.error(
                    "❌ Échec définitif de l'enregistrement du log de connexion après 3 tentatives:",
                    logError instanceof Error ? logError.message : logError
                  );
                  console.error(
                    "   Ceci peut indiquer un problème de connexion réseau ou de configuration Firestore."
                  );
                });
              }
            }
          } else {
            console.error("❌ Document Firestore n'existe pas pour l'utilisateur:", {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            });
            setUserData(null);
          }
        } catch (error) {
          console.error("❌ Erreur lors de la récupération des données utilisateur:", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          });
          setUserData(null);
        }
      } else {
        setUserData(null);
        hasLoggedLogin.current = false; // Reset pour la prochaine connexion
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}

