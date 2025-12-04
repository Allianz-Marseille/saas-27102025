import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  orderBy,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { OffreCommerciale, OffreCommercialeInput, OffreFilter } from "@/types/offre";

const COLLECTION_NAME = "offres_commerciales";

/**
 * Crée une nouvelle offre commerciale
 */
export const createOffre = async (offre: OffreCommercialeInput): Promise<OffreCommerciale> => {
  if (!db) throw new Error("Firebase not initialized");

  const now = Timestamp.now();

  const offreData = {
    ...offre,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), offreData);

  return {
    id: docRef.id,
    ...offre,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
};

/**
 * Récupère toutes les offres avec filtres optionnels
 */
export const getOffres = async (filters?: OffreFilter): Promise<OffreCommerciale[]> => {
  if (!db) throw new Error("Firebase not initialized");

  let q: Query<DocumentData> = collection(db, COLLECTION_NAME);

  // Application des filtres
  if (filters?.segment) {
    q = query(q, where("segment", "==", filters.segment));
  }

  if (filters?.categorie_client) {
    q = query(q, where("categorie_client", "==", filters.categorie_client));
  }

  if (filters?.periode) {
    q = query(q, where("periode", "==", filters.periode));
  }

  // Tri par segment puis sous_segment
  q = query(q, orderBy("segment", "asc"), orderBy("sous_segment", "asc"));

  const snapshot = await getDocs(q);

  let offres = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      segment: data.segment,
      sous_segment: data.sous_segment,
      offre: data.offre,
      code: data.code,
      conditions: data.conditions,
      categorie_client: data.categorie_client,
      periode: data.periode,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as OffreCommerciale;
  });

  // Filtrage côté client pour la recherche textuelle
  if (filters?.search && filters.search.trim() !== "") {
    const searchLower = filters.search.toLowerCase();
    offres = offres.filter(
      (offre) =>
        offre.offre.toLowerCase().includes(searchLower) ||
        offre.code.toLowerCase().includes(searchLower) ||
        offre.segment.toLowerCase().includes(searchLower) ||
        offre.sous_segment.toLowerCase().includes(searchLower) ||
        offre.conditions.toLowerCase().includes(searchLower)
    );
  }

  return offres;
};

/**
 * Récupère une offre par son ID
 */
export const getOffreById = async (id: string): Promise<OffreCommerciale | null> => {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    segment: data.segment,
    sous_segment: data.sous_segment,
    offre: data.offre,
    code: data.code,
    conditions: data.conditions,
    categorie_client: data.categorie_client,
    periode: data.periode,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

/**
 * Met à jour une offre existante
 */
export const updateOffre = async (
  id: string,
  offre: Partial<OffreCommercialeInput>
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);

  const updateData = {
    ...offre,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, updateData);
};

/**
 * Supprime une offre
 */
export const deleteOffre = async (id: string): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

/**
 * Récupère toutes les valeurs uniques pour un champ donné
 */
export const getUniqueValues = async (field: keyof OffreCommerciale): Promise<string[]> => {
  if (!db) throw new Error("Firebase not initialized");

  const offres = await getOffres();
  const values = new Set(offres.map((offre) => String(offre[field])));
  return Array.from(values).sort();
};

/**
 * Compte le nombre total d'offres
 */
export const countOffres = async (): Promise<number> => {
  if (!db) throw new Error("Firebase not initialized");

  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.size;
};

