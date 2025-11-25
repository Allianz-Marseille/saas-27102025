import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc, or, limit } from "firebase/firestore";
import { db } from "./config";
import { Act } from "@/types";

export interface CommissionRule {
  id: string;
  contratType: string;
  montant: number;
  pourcentage?: number;
  active: boolean;
}

export const createAct = async (act: any): Promise<Act> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Vérification de l'unicité du numéro de contrat (insensible à la casse) - Protection serveur
  const trimmedContractNumber = act.numeroContrat?.trim();
  if (trimmedContractNumber) {
    const alreadyExists = await contractNumberExists(trimmedContractNumber);
    if (alreadyExists) {
      throw new Error('Ce numéro de contrat est déjà enregistré.');
    }
  }
  
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
    if (primeAnnuelle <= 999) return 20;
    const montantExcedent = primeAnnuelle - 999;
    const tranches = Math.ceil(montantExcedent / 1000);
    return 20 + tranches * 10;
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

export const updateAct = async (actId: string, updates: Record<string, unknown>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const actRef = doc(db, "acts", actId);
  const updateData: Record<string, unknown> = {};
  
  // Convertir les dates en Timestamp si nécessaire
  if (updates.dateEffet && updates.dateEffet instanceof Date) {
    updateData.dateEffet = Timestamp.fromDate(updates.dateEffet);
  }
  
  // dateSaisie ne devrait jamais être modifié lors d'une mise à jour
  // donc on l'ignore si présent dans updates
  
  // Ajouter les autres champs
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'dateEffet' && key !== 'dateSaisie' && key !== 'id' && value !== undefined) {
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

  const normalizedNumber = numeroContrat.trim().toLowerCase();
  if (!normalizedNumber) {
    return false;
  }

  // Récupérer tous les actes pour comparer en minuscules (Firestore ne supporte pas les comparaisons case-insensitive)
  const q = query(collection(db, "acts"));
  const snapshot = await getDocs(q);
  
  // Vérifier si un numéro de contrat existe (comparaison insensible à la casse)
  return snapshot.docs.some((doc) => {
    const actData = doc.data();
    const existingNumber = actData.numeroContrat?.trim().toLowerCase();
    return existingNumber === normalizedNumber;
  });
};
