/**
 * Utilitaires Firestore pour les filtres sauvegardés de messages
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { SavedFilter } from "@/types/message";

const SAVED_FILTERS_COLLECTION = "saved_message_filters";

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
 * Crée un filtre sauvegardé
 */
export async function createSavedFilter(
  userId: string,
  filter: Omit<SavedFilter, "id" | "userId" | "createdAt">
): Promise<SavedFilter> {
  if (!db) throw new Error("Firebase not initialized");

  const filtersRef = collection(db, SAVED_FILTERS_COLLECTION);
  const docRef = await addDoc(filtersRef, {
    userId,
    name: filter.name,
    description: filter.description,
    status: filter.status || [],
    priority: filter.priority || [],
    category: filter.category || [],
    tags: filter.tags || [],
    sortBy: filter.sortBy,
    sortOrder: filter.sortOrder,
    createdAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    userId,
    name: filter.name,
    description: filter.description,
    status: filter.status,
    priority: filter.priority,
    category: filter.category,
    tags: filter.tags,
    sortBy: filter.sortBy,
    sortOrder: filter.sortOrder,
    createdAt: new Date(),
  } as SavedFilter;
}

/**
 * Récupère tous les filtres sauvegardés d'un utilisateur
 */
export async function getSavedFilters(userId: string): Promise<SavedFilter[]> {
  if (!db) throw new Error("Firebase not initialized");

  const filtersRef = collection(db, SAVED_FILTERS_COLLECTION);
  const q = query(
    filtersRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      status: data.status || [],
      priority: data.priority || [],
      category: data.category || [],
      tags: data.tags || [],
      sortBy: data.sortBy,
      sortOrder: data.sortOrder,
      createdAt: toDate(data.createdAt),
    } as SavedFilter;
  });
}

/**
 * Récupère un filtre sauvegardé par son ID
 */
export async function getSavedFilterById(filterId: string): Promise<SavedFilter | null> {
  if (!db) throw new Error("Firebase not initialized");

  const filterRef = doc(db, SAVED_FILTERS_COLLECTION, filterId);
  const filterDoc = await getDoc(filterRef);

  if (!filterDoc.exists()) {
    return null;
  }

  const data = filterDoc.data();
  return {
    id: filterDoc.id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    status: data.status || [],
    priority: data.priority || [],
    category: data.category || [],
    tags: data.tags || [],
    sortBy: data.sortBy,
    sortOrder: data.sortOrder,
    createdAt: toDate(data.createdAt),
  } as SavedFilter;
}

/**
 * Met à jour un filtre sauvegardé
 */
export async function updateSavedFilter(
  filterId: string,
  updates: Partial<Omit<SavedFilter, "id" | "userId" | "createdAt">>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const filterRef = doc(db, SAVED_FILTERS_COLLECTION, filterId);
  await updateDoc(filterRef, updates);
}

/**
 * Supprime un filtre sauvegardé
 */
export async function deleteSavedFilter(filterId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const filterRef = doc(db, SAVED_FILTERS_COLLECTION, filterId);
  await deleteDoc(filterRef);
}
