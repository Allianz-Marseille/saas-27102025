import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./config";
import { HealthAct } from "@/types";

// Coefficients par type d'acte selon le document de spécification
export const HEALTH_ACT_COEFFICIENTS: Record<string, number> = {
  AFFAIRE_NOUVELLE: 1.0, // 100% - À définir selon les besoins
  REVISION: 0.5, // 50% - À définir selon les besoins
  ADHESION_SALARIE: 0.5, // 50% - Adhésion salarié / Renforts
  COURT_TO_AZ: 0.75, // 75% - Courtage → Allianz
  AZ_TO_COURTAGE: 0.5, // 50% - Allianz → Courtage
};

/**
 * Crée un nouvel acte santé individuelle
 */
export const createHealthAct = async (act: Omit<HealthAct, 'id' | 'dateSaisie' | 'moisKey' | 'caPondere'>): Promise<HealthAct> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Vérification de l'unicité du numéro de contrat - UNIQUEMENT pour les AFFAIRE_NOUVELLE
  const trimmedContractNumber = act.numeroContrat?.trim();
  if (act.kind === "AFFAIRE_NOUVELLE" && trimmedContractNumber) {
    try {
      const response = await fetch("/api/health-acts/check-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numeroContrat: trimmedContractNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la vérification du numéro de contrat");
      }

      const data = await response.json();
      
      if (data.exists) {
        throw new Error('Ce numéro de contrat est déjà enregistré.');
      }
    } catch (error) {
      // Si c'est déjà une Error avec un message, la relancer
      if (error instanceof Error) {
        throw error;
      }
      // Sinon, envelopper dans une nouvelle Error
      throw new Error('Erreur lors de la vérification du numéro de contrat.');
    }
  }
  
  const dateSaisie = new Date();
  const moisKey = dateSaisie.toISOString().slice(0, 7); // YYYY-MM

  // Calcul du CA pondéré (arrondi à l'entier)
  const coefficient = HEALTH_ACT_COEFFICIENTS[act.kind] || 1.0;
  const caPondere = Math.round(act.caAnnuel * coefficient);

  const actData = {
    userId: act.userId,
    kind: act.kind,
    clientNom: act.clientNom,
    numeroContrat: act.numeroContrat,
    compagnie: act.compagnie,
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
 * Récupère les actes santé pour un mois donné, avec filtre utilisateur optionnel
 * @param userId - ID de l'utilisateur ou null pour tous les utilisateurs
 * @param monthKey - Clé du mois au format "yyyy-MM"
 */
export const getHealthActsByMonthFiltered = async (userId: string | null, monthKey: string): Promise<HealthAct[]> => {
  if (!db) return [];
  
  let q;
  if (userId === null) {
    // Récupérer tous les actes du mois
    q = query(
      collection(db, "health_acts"),
      where("moisKey", "==", monthKey)
    );
  } else {
    // Récupérer les actes d'un utilisateur spécifique
    q = query(
      collection(db, "health_acts"),
      where("userId", "==", userId),
      where("moisKey", "==", monthKey)
    );
  }

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
      updateData.caPondere = Math.round(newCaAnnuel * coefficient);
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
 * Vérifie si un numéro de contrat existe déjà pour un utilisateur donné
 * @param numeroContrat - Le numéro de contrat à vérifier
 * @param userId - L'ID de l'utilisateur (obligatoire pour respecter les règles Firestore)
 */
export const healthContractNumberExists = async (numeroContrat: string, userId: string): Promise<boolean> => {
  if (!db) return false;

  const normalizedNumber = numeroContrat.trim().toLowerCase();
  if (!normalizedNumber) {
    return false;
  }

  // Filtrer par userId pour respecter les règles Firestore
  // Les commerciaux santé individuelle ne peuvent accéder qu'à leurs propres actes
  const q = query(
    collection(db, "health_acts"),
    where("userId", "==", userId)
  );
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

