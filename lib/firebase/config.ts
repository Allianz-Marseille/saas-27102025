import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is valid and in browser
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
  try {
    const hasApiKey = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here');
    const hasProjectId = !!(firebaseConfig.projectId && firebaseConfig.projectId !== 'your_project_id');
    const hasValidConfig = hasApiKey && hasProjectId;

    if (process.env.NODE_ENV === 'development' || !hasValidConfig) {
      const status = {
        apiKey: hasApiKey ? 'ok' : 'manquant ou placeholder',
        projectId: hasProjectId ? 'ok' : 'manquant ou placeholder',
        authDomain: firebaseConfig.authDomain ? 'ok' : 'manquant',
      };
      if (!hasValidConfig) {
        console.warn('[Firebase] Config invalide côté client:', status);
      }
    }

    if (hasValidConfig) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    console.warn('[Firebase] Init échouée:', error);
  }
}

export const isFirebaseAuthReady = (): boolean => !!auth;

export { app, auth, db };
export default app;

