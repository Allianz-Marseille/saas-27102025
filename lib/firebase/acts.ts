import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc, or, limit } from "firebase/firestore";
import { db } from "./config";

export interface Act {
  id: string;
  userId: string;
  kind: "AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD";
  clientNom: string;
  numeroContrat: string;
  contratType: string;
  compagnie: string;
  dateEffet: Date;
  dateSaisie: Timestamp;
  primeAnnuelle?: number;
  montantVersement?: number;
  commissionPotentielle: number;
  commissionReelle?: number;
  moisKey: string;
  note?: string;
}

export interface CommissionRule {
  id: string;
  contratType: string;
  montant: number;
  pourcentage?: number;
  active: boolean;
}

export const createAct = async (act: any): Promise<Act> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const dateSaisie = new Date();
  const moisKey = dateSaisie.toISOString().slice(0, 7); // YYYY-MM

  // Pour les process (M+3, PRETERME_AUTO, PRETERME_IRD), on n'a pas de commission
  const isProcess = act.kind === "M+3" || act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
  const commissionPotentielle = isProcess ? 0 : calculateCommission(act.contratType, act.primeAnnuelle || 0, act.montantVersement || 0);

  // Construire l'objet avec tous les champs définis (les champs undefined ont été filtrés par le composant)
  const actData: Record<string, any> = {
    userId: act.userId,
    kind: act.kind,
    clientNom: act.clientNom,
    numeroContrat: act.numeroContrat,
    contratType: act.contratType,
    compagnie: act.compagnie,
    dateEffet: Timestamp.fromDate(act.dateEffet),
    dateSaisie: Timestamp.fromDate(dateSaisie),
    moisKey,
    commissionPotentielle,
  };

  // Ajouter les champs optionnels s'ils existent (déjà filtrés par le composant)
  if (act.primeAnnuelle !== undefined) {
    actData.primeAnnuelle = act.primeAnnuelle;
  }
  
  if (act.montantVersement !== undefined) {
    actData.montantVersement = act.montantVersement;
  }
  
  if (act.note !== undefined) {
    actData.note = act.note;
  }

  const docRef = await addDoc(collection(db, "acts"), actData);

  return {
    id: docRef.id,
    ...actData,
    dateEffet: act.dateEffet,
    dateSaisie: actData.dateSaisie,
  } as Act;
};

// Modifier getActsByMonth pour accepter userId optionnel (null = tous les commerciaux)
export const getActsByMonth = async (userId: string | null, monthKey: string): Promise<Act[]> => {
  if (!db) return [];
  
  let q;
  
  if (userId === null) {
    // Récupérer tous les actes du mois (mode admin "Tous")
    q = query(
      collection(db, "acts"),
      where("moisKey", "==", monthKey)
    );
  } else {
    // Récupérer les actes d'un commercial spécifique
    q = query(
      collection(db, "acts"),
      where("userId", "==", userId),
      where("moisKey", "==", monthKey)
    );
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Act[];
};

export const calculateCommission = (
  contratType: string,
  primeAnnuelle: number,
  montantVersement: number
): number => {
  const rules: Record<string, number> = {
    AUTO_MOTO: 10,
    IRD_PART: 20,
    PJ: 30,
    GAV: 40,
    NOP_50_EUR: 10,
    SANTE_PREV: 50,
    VIE_PP: 50,
  };

  // IRD_PRO: 20 € + 10 €/tranche de 1000 € > 999 €
  if (contratType === "IRD_PRO") {
    return 20 + Math.floor((primeAnnuelle - 1000) / 1000) * 10;
  }

  // VIE_PU: 1% du montant versé
  if (contratType === "VIE_PU") {
    return montantVersement * 0.01;
  }

  return rules[contratType] || 0;
};

export const getActsByUser = async (userId: string) => {
  if (!db) return [];
  
  const q = query(collection(db, "acts"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteAct = async (actId: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  await deleteDoc(doc(db, "acts", actId));
};

export const updateAct = async (actId: string, updates: Partial<Act>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const actRef = doc(db, "acts", actId);
  const updateData: Record<string, any> = {};
  
  // Convertir les dates en Timestamp si nécessaire
  if (updates.dateEffet) {
    updateData.dateEffet = Timestamp.fromDate(updates.dateEffet);
  }
  if (updates.dateSaisie) {
    // dateSaisie peut être un Timestamp ou une Date
    const dateSaisie = (updates as any).dateSaisie;
    updateData.dateSaisie = dateSaisie instanceof Timestamp ? dateSaisie : Timestamp.fromDate(dateSaisie);
  }
  
  // Ajouter les autres champs
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'dateEffet' && key !== 'dateSaisie' && value !== undefined) {
      updateData[key] = value;
    }
  });
  
  await updateDoc(actRef, updateData);
};

export const getActById = async (actId: string): Promise<Act | null> => {
  if (!db) return null;
  
  const actDoc = await getDoc(doc(db, "acts", actId));
  if (!actDoc.exists()) return null;
  
  return { id: actDoc.id, ...actDoc.data() } as Act;
};

export const contractNumberExists = async (numeroContrat: string): Promise<boolean> => {
  if (!db) return false;

  const normalizedNumber = numeroContrat.trim();
  if (!normalizedNumber) {
    return false;
  }

  const q = query(
    collection(db, "acts"),
    where("numeroContrat", "==", normalizedNumber),
    limit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
