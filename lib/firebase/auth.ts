import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "./config";

export interface UserRole {
  ADMINISTRATEUR: "ADMINISTRATEUR";
  CDC_COMMERCIAL: "CDC_COMMERCIAL";
}

export const ROLES = {
  ADMINISTRATEUR: "ADMINISTRATEUR",
  CDC_COMMERCIAL: "CDC_COMMERCIAL",
} as const;

export interface UserData {
  id: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL" | "COMMERCIAL_SANTE_INDIVIDUEL" | "COMMERCIAL_SANTE_COLLECTIVE" | "GESTIONNAIRE_SINISTRE";
  active: boolean;
  createdAt: Date;
}

const ALLOWED_DOMAINS = ["@allianz-nogaro.fr"];

export const login = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not initialized');
  
  const isValidDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
  if (!isValidDomain) {
    throw new Error(`Email doit se terminer par ${ALLOWED_DOMAINS.join(' ou ')}`);
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const register = async (
  email: string,
  password: string,
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL"
) => {
  if (!auth || !db) throw new Error('Firebase not initialized');
  
  const isValidDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
  if (!isValidDomain) {
    throw new Error(`Email doit se terminer par ${ALLOWED_DOMAINS.join(' ou ')}`);
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Créer le profil utilisateur dans Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    id: userCredential.user.uid,
    email,
    role,
    active: true,
    createdAt: new Date(),
  });

  return userCredential.user;
};

export const logout = async () => {
  if (!auth) throw new Error('Firebase not initialized');
  await signOut(auth);
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  if (!db) return null;
  
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      active: data.active,
      createdAt: data.createdAt.toDate(),
    };
  }

  return null;
};

export const getAllCommercials = async (): Promise<UserData[]> => {
  if (!db) return [];
  
  const querySnapshot = await getDocs(collection(db, "users"));
  const users = querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        active: data.active,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as UserData;
    })
    .filter((user) => user.role === "CDC_COMMERCIAL" && user.active);
  
  return users;
};

export const getAllUsers = async (): Promise<UserData[]> => {
  if (!db) return [];
  
  const querySnapshot = await getDocs(collection(db, "users"));
  const users = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      active: data.active,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as UserData;
  });
  
  return users;
};

export const updateUserRole = async (
  userId: string,
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL"
): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { role }, { merge: true });
};

export const toggleUserActive = async (
  userId: string,
  active: boolean
): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { active }, { merge: true });
};

