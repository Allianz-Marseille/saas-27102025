import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./config";
import { HealthCollectiveAct, HealthCollectiveActKind, HealthCollectiveActOrigin } from "@/types";

// Coefficients selon l'origine
export const HEALTH_COLLECTIVE_ORIGIN_COEFFICIENTS: Record<HealthCollectiveActOrigin, number> = {
  PROACTIF: 1.0, // 100%
  REACTIF: 0.5, // 50%
  PROSPECTION: 1.25, // 125%
};

// Coefficients selon le type d'acte
export const HEALTH_COLLECTIVE_ACT_COEFFICIENTS: Record<HealthCollectiveActKind, number> = {
  IND_AN_SANTE: 1.0, // 100%
  IND_AN_PREVOYANCE: 1.0, // 100%
  IND_AN_RETRAITE: 1.0, // 100%
  COLL_AN_SANTE: 1.0, // 100%
  COLL_AN_PREVOYANCE: 1.0, // 100%
  COLL_AN_RETRAITE: 1.0, // 100%
  COLL_ADHESION_RENFORT: 1.0, // 100%
  REVISION: 0.75, // 75%
  ADHESION_RENFORT: 0.5, // 50%
  COURTAGE_TO_ALLIANZ: 0.75, // 75%
  ALLIANZ_TO_COURTAGE: 0.5, // 50%
};

/**
 * Calcule le coefficient selon la compagnie
 */
export function getCompanyCoefficient(compagnie: string): number {
  const compagnieLower = compagnie.toLowerCase();
  
  if (compagnieLower === "allianz") {
    return 1.2; // 120%
  }
  
  if (compagnieLower.includes("unim") || compagnieLower.includes("uniced")) {
    return 1.5; // 150%
  }
  
  // Courtage ou autres
  return 1.0; // 100%
}

/**
 * Crée un nouvel acte santé collective
 */
export const createHealthCollectiveAct = async (
  act: Omit<HealthCollectiveAct, 'id' | 'dateSaisie' | 'moisKey' | 'caAnnuel' | 'coefficientOrigine' | 'coefficientTypeActe' | 'coefficientCompagnie' | 'caPondere'>
): Promise<HealthCollectiveAct> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Vérification de l'unicité du numéro de contrat - UNIQUEMENT pour les affaires nouvelles (*_AN_*)
  const trimmedContractNumber = act.numeroContrat?.trim();
  const healthCollectiveANTypes = [
    "IND_AN_SANTE",
    "IND_AN_PREVOYANCE",
    "IND_AN_RETRAITE",
    "COLL_AN_SANTE",
    "COLL_AN_PREVOYANCE",
    "COLL_AN_RETRAITE",
  ];
  
  if (healthCollectiveANTypes.includes(act.kind) && trimmedContractNumber) {
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

  // Calcul des coefficients
  const coefficientOrigine = HEALTH_COLLECTIVE_ORIGIN_COEFFICIENTS[act.origine];
  const coefficientTypeActe = HEALTH_COLLECTIVE_ACT_COEFFICIENTS[act.kind];
  const coefficientCompagnie = getCompanyCoefficient(act.compagnie);
  
  // CA annuel = prime
  const caAnnuel = act.prime;
  
  // Calcul du CA pondéré (arrondi à l'entier)
  const caPondere = Math.round(
    act.prime * coefficientOrigine * coefficientTypeActe * coefficientCompagnie
  );

  const actData = {
    userId: act.userId,
    kind: act.kind,
    origine: act.origine,
    clientNom: act.clientNom,
    numeroContrat: act.numeroContrat,
    compagnie: act.compagnie,
    dateEffet: Timestamp.fromDate(act.dateEffet as Date),
    dateSaisie: Timestamp.fromDate(dateSaisie),
    prime: act.prime,
    caAnnuel,
    coefficientOrigine,
    coefficientTypeActe,
    coefficientCompagnie,
    caPondere,
    moisKey,
  };

  const docRef = await addDoc(collection(db, "health_collective_acts"), actData);

  return {
    id: docRef.id,
    ...actData,
    dateEffet: act.dateEffet,
    dateSaisie,
  } as HealthCollectiveAct;
};

/**
 * Récupère les actes santé collective d'un utilisateur pour un mois donné
 */
export const getHealthCollectiveActsByMonth = async (userId: string, monthKey: string): Promise<HealthCollectiveAct[]> => {
  if (!db) return [];
  
  const q = query(
    collection(db, "health_collective_acts"),
    where("userId", "==", userId),
    where("moisKey", "==", monthKey)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HealthCollectiveAct[];
};

/**
 * Récupère les actes santé collective pour un mois donné, avec filtre utilisateur optionnel
 * @param userId - ID de l'utilisateur ou null pour tous les utilisateurs
 * @param monthKey - Clé du mois au format "yyyy-MM"
 */
export const getHealthCollectiveActsByMonthFiltered = async (userId: string | null, monthKey: string): Promise<HealthCollectiveAct[]> => {
  if (!db) return [];
  
  let q;
  if (userId === null) {
    // Récupérer tous les actes du mois
    q = query(
      collection(db, "health_collective_acts"),
      where("moisKey", "==", monthKey)
    );
  } else {
    // Récupérer les actes d'un utilisateur spécifique
    q = query(
      collection(db, "health_collective_acts"),
      where("userId", "==", userId),
      where("moisKey", "==", monthKey)
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HealthCollectiveAct[];
};

/**
 * Supprime un acte santé collective
 */
export const deleteHealthCollectiveAct = async (actId: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  await deleteDoc(doc(db, "health_collective_acts", actId));
};

/**
 * Met à jour un acte santé collective
 */
export const updateHealthCollectiveAct = async (actId: string, updates: Partial<HealthCollectiveAct>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const actRef = doc(db, "health_collective_acts", actId);
  const updateData: Record<string, unknown> = {};
  
  // Convertir les dates en Timestamp si nécessaire
  if (updates.dateEffet && updates.dateEffet instanceof Date) {
    updateData.dateEffet = Timestamp.fromDate(updates.dateEffet);
  }
  
  // Recalculer le CA pondéré si nécessaire
  if (updates.prime !== undefined || updates.origine !== undefined || updates.kind !== undefined || updates.compagnie !== undefined) {
    const actDoc = await getDoc(actRef);
    if (actDoc.exists()) {
      const actData = actDoc.data();
      const newPrime = updates.prime ?? actData.prime;
      const newOrigine = updates.origine ?? actData.origine;
      const newKind = updates.kind ?? actData.kind;
      const newCompagnie = updates.compagnie ?? actData.compagnie;
      
      const coefficientOrigine = HEALTH_COLLECTIVE_ORIGIN_COEFFICIENTS[newOrigine as HealthCollectiveActOrigin];
      const coefficientTypeActe = HEALTH_COLLECTIVE_ACT_COEFFICIENTS[newKind as HealthCollectiveActKind];
      const coefficientCompagnie = getCompanyCoefficient(newCompagnie);
      
      updateData.caAnnuel = newPrime;
      updateData.caPondere = Math.round(newPrime * coefficientOrigine * coefficientTypeActe * coefficientCompagnie);
      updateData.coefficientOrigine = coefficientOrigine;
      updateData.coefficientTypeActe = coefficientTypeActe;
      updateData.coefficientCompagnie = coefficientCompagnie;
    }
  }
  
  // Ajouter les autres champs
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'dateEffet' && key !== 'dateSaisie' && key !== 'id' && 
        key !== 'caPondere' && key !== 'caAnnuel' && 
        key !== 'coefficientOrigine' && key !== 'coefficientTypeActe' && key !== 'coefficientCompagnie' && 
        value !== undefined) {
      updateData[key] = value;
    }
  });
  
  await updateDoc(actRef, updateData);
};

/**
 * Récupère un acte santé collective par son ID
 */
export const getHealthCollectiveActById = async (actId: string): Promise<HealthCollectiveAct | null> => {
  if (!db) return null;
  
  const actDoc = await getDoc(doc(db, "health_collective_acts", actId));
  if (!actDoc.exists()) return null;
  
  return { id: actDoc.id, ...actDoc.data() } as HealthCollectiveAct;
};

/**
 * Obtient le libellé d'un type d'acte santé collective
 */
export function getHealthCollectiveActKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    IND_AN_SANTE: "Ind AN Santé",
    IND_AN_PREVOYANCE: "Ind AN Prévoyance",
    IND_AN_RETRAITE: "Ind AN Retraite",
    COLL_AN_SANTE: "Coll AN Santé",
    COLL_AN_PREVOYANCE: "Coll AN Prévoyance",
    COLL_AN_RETRAITE: "Coll AN Retraite",
    COLL_ADHESION_RENFORT: "Coll Adhésion/Renfort",
    REVISION: "Révision",
    ADHESION_RENFORT: "Adhésion/Renfort",
    COURTAGE_TO_ALLIANZ: "Courtage → Allianz",
    ALLIANZ_TO_COURTAGE: "Allianz → Courtage",
  };
  return labels[kind] || kind;
}

/**
 * Obtient le libellé d'une origine
 */
export function getHealthCollectiveActOriginLabel(origine: string): string {
  const labels: Record<string, string> = {
    PROACTIF: "Proactif",
    REACTIF: "Réactif",
    PROSPECTION: "Prospection",
  };
  return labels[origine] || origine;
}

