/**
 * Utilitaires Firestore pour les préférences utilisateur de messages
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { UserMessagePreferences } from "@/types/message";

const PREFERENCES_COLLECTION = "user_message_preferences";

/**
 * Convertit un Timestamp Firestore en Date
 */
function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

/**
 * Convertit une Date en Timestamp Firestore
 */
function toTimestamp(value: Date | Timestamp): Timestamp {
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value instanceof Date ? value : new Date());
}

/**
 * Récupère les préférences d'un utilisateur (ou crée des valeurs par défaut)
 */
export async function getUserPreferences(
  userId: string
): Promise<UserMessagePreferences> {
  if (!db) throw new Error("Firebase not initialized");

  const prefRef = doc(db, PREFERENCES_COLLECTION, userId);
  const prefDoc = await getDoc(prefRef);

  if (prefDoc.exists()) {
    const data = prefDoc.data();
    return {
      userId: data.userId,
      soundNotifications: data.soundNotifications ?? true,
      reminderFrequency: data.reminderFrequency ?? "daily",
      defaultViewMode: data.defaultViewMode ?? "list",
      updatedAt: toDate(data.updatedAt),
    } as UserMessagePreferences;
  }

  // Valeurs par défaut
  const defaultPrefs: UserMessagePreferences = {
    userId,
    soundNotifications: true,
    reminderFrequency: "daily",
    defaultViewMode: "list",
    updatedAt: new Date(),
  };

  // Créer les préférences par défaut
  await setDoc(prefRef, {
    ...defaultPrefs,
    updatedAt: toTimestamp(defaultPrefs.updatedAt),
  });

  return defaultPrefs;
}

/**
 * Met à jour les préférences d'un utilisateur
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserMessagePreferences, "userId" | "updatedAt">>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const prefRef = doc(db, PREFERENCES_COLLECTION, userId);
  await updateDoc(prefRef, {
    ...updates,
    updatedAt: toTimestamp(new Date()),
  });
}
