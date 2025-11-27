import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./config";
import { HealthAct } from "@/types";

// Coefficients par type d'acte selon le document de spécification
export const HEALTH_ACT_COEFFICIENTS: Record<string, number> = {
  AFFAIRE_NOUVELLE: 1.0, // À définir selon les besoins
  REVISION: 0.5, // À définir selon les besoins
  ADHESION_SALARIE: 0.3, // À définir selon les besoins
  COURT_TO_AZ: 0.7, // À définir selon les besoins
  AZ_TO_COURTAGE: 0.5, // Coefficient 50% selon le doc
};

/**
 * Crée un nouvel acte santé individuelle
 */
export const createHealthAct = async (act: Omit<HealthAct, 'id' | 'dateSaisie' | 'moisKey' | 'caPondere'>): Promise<HealthAct> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Vérification de l'unicité du numéro de contrat - UNIQUEMENT pour les AFFAIRE_NOUVELLE
  const trimmedContractNumber = act.numeroContrat?.trim();
  if (act.kind === "AFFAIRE_NOUVELLE" && trimmedContractNumber) {
    const alreadyExists = await healthContractNumberExists(trimmedContractNumber);
    if (alreadyExists) {
      throw new Error('Ce numéro de contrat est déjà enregistré.');
    }
  }
  
  const dateSaisie = new Date();
  const moisKey = dateSaisie.toISOString().slice(0, 7); // YYYY-MM

  // Calcul du CA pondéré
  const coefficient = HEALTH_ACT_COEFFICIENTS[act.kind] || 1.0;
  const caPondere = act.caAnnuel * coefficient;

  const actData = {
    userId: act.userId,
    kind: act.kind,
    clientNom: act.clientNom,
    numeroContrat: act.numeroContrat,
    dateEffet: Timestamp.fromDate(act.dateEffet as Date),
    dateSaisie: Timestamp.fromDate(dateSaisie),
    caAnnuel: act.caAnnuel,
    coefficient,
    caPondere,
    moisKey,
  };

  const docRef = await addDoc(collection(db, "health_acts"), actData);

  return {
    id: docRef.id,
    ...actData,
    dateEffet: act.dateEffet,
    dateSaisie,
  } as HealthAct;
};

/**
 * Récupère les actes santé d'un utilisateur pour un mois donné
 */
export const getHealthActsByMonth = async (userId: string, monthKey: string): Promise<HealthAct[]> => {
  if (!db) return [];
  
  const q = query(
    collection(db, "health_acts"),
    where("userId", "==", userId),
    where("moisKey", "==", monthKey)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HealthAct[];
};

/**
 * Supprime un acte santé
 */
export const deleteHealthAct = async (actId: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  await deleteDoc(doc(db, "health_acts", actId));
};

/**
 * Met à jour un acte santé
 */
export const updateHealthAct = async (actId: string, updates: Partial<HealthAct>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const actRef = doc(db, "health_acts", actId);
  const updateData: Record<string, unknown> = {};
  
  // Convertir les dates en Timestamp si nécessaire
  if (updates.dateEffet && updates.dateEffet instanceof Date) {
    updateData.dateEffet = Timestamp.fromDate(updates.dateEffet);
  }
  
  // Recalculer le CA pondéré si nécessaire
  if (updates.caAnnuel !== undefined || updates.kind !== undefined) {
    const actDoc = await getDoc(actRef);
    if (actDoc.exists()) {
      const actData = actDoc.data();
      const newCaAnnuel = updates.caAnnuel ?? actData.caAnnuel;
      const newKind = updates.kind ?? actData.kind;
      const coefficient = HEALTH_ACT_COEFFICIENTS[newKind] || 1.0;
      updateData.caPondere = newCaAnnuel * coefficient;
      updateData.coefficient = coefficient;
    }
  }
  
  // Ajouter les autres champs
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'dateEffet' && key !== 'dateSaisie' && key !== 'id' && key !== 'caPondere' && key !== 'coefficient' && value !== undefined) {
      updateData[key] = value;
    }
  });
  
  await updateDoc(actRef, updateData);
};

/**
 * Récupère un acte santé par son ID
 */
export const getHealthActById = async (actId: string): Promise<HealthAct | null> => {
  if (!db) return null;
  
  const actDoc = await getDoc(doc(db, "health_acts", actId));
  if (!actDoc.exists()) return null;
  
  return { id: actDoc.id, ...actDoc.data() } as HealthAct;
};

/**
 * Vérifie si un numéro de contrat existe déjà
 */
export const healthContractNumberExists = async (numeroContrat: string): Promise<boolean> => {
  if (!db) return false;

  const normalizedNumber = numeroContrat.trim().toLowerCase();
  if (!normalizedNumber) {
    return false;
  }

  // Récupérer tous les actes pour comparer en minuscules
  const q = query(collection(db, "health_acts"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.some((doc) => {
    const actData = doc.data();
    const existingNumber = actData.numeroContrat?.trim().toLowerCase();
    return existingNumber === normalizedNumber;
  });
};

/**
 * Obtient le libellé d'un type d'acte santé
 */
export function getHealthActKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    AFFAIRE_NOUVELLE: "Affaire Nouvelle",
    REVISION: "Révision",
    ADHESION_SALARIE: "Adhésion salarié",
    COURT_TO_AZ: "COURT → AZ",
    AZ_TO_COURTAGE: "AZ → courtage",
  };
  return labels[kind] || kind;
}

