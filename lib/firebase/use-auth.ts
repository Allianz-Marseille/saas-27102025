"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";
import { UserData } from "./auth";
import { logUserLogin } from "./logs";

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
            
            setUserData({
              id: data.id,
              email: data.email,
              role: data.role,
              active: data.active,
              createdAt,
            });

            // Logger la connexion (une seule fois par session)
            if (!hasLoggedLogin.current && data.email) {
              hasLoggedLogin.current = true;
              try {
                await logUserLogin(firebaseUser.uid, data.email);
                console.log("✅ Log de connexion enregistré pour:", data.email);
              } catch (logError) {
                console.error("❌ Erreur lors de l'enregistrement du log de connexion:", logError);
              }
            }
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
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

