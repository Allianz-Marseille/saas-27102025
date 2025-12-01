import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc, or, limit } from "firebase/firestore";
import { db } from "./config";
import { Act } from "@/types";

// Réexporter Act pour compatibilité avec les imports existants
export type { Act };

export interface CommissionRule {
  id: string;
  contratType: string;
  montant: number;
  pourcentage?: number;
  active: boolean;
}

export const createAct = async (act: any): Promise<Act> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Identification des types d'actes
  const isAN = act.kind === "AN";
  const isPreterme = act.kind === "PRETERME_AUTO" || act.kind === "PRETERME_IRD";
  const isM3 = act.kind === "M+3";
  const isProcess = isM3 || isPreterme;
  
  // Vérification de l'unicité du numéro de contrat - UNIQUEMENT pour les AN
  // AN : Le numéro de contrat DOIT être unique dans toute la base
  // PRETERME : Le même numéro peut exister plusieurs fois (suivi temporel)
  // M+3 : Pas de numéro de contrat (utilise "-")
  const trimmedContractNumber = act.numeroContrat?.trim();
  
  // Validation : Pour les prétermes, le numéro de contrat est obligatoire
  if (isPreterme) {
    if (!trimmedContractNumber || trimmedContractNumber === "" || trimmedContractNumber === "-") {
      throw new Error('Le numéro de contrat est obligatoire pour les prétermes.');
    }
  }
  
  // Vérification d'unicité uniquement pour les AN
  if (isAN && trimmedContractNumber) {
    const alreadyExists = await contractNumberExists(trimmedContractNumber);
    if (alreadyExists) {
      throw new Error('Ce numéro de contrat est déjà enregistré.');
    }
  }
  
  const dateSaisie = new Date();
  const moisKey = dateSaisie.toISOString().slice(0, 7); // YYYY-MM

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

  // Ajouter les tags de suivi (obligatoires pour M+3 et PRETERME, pas pour AN)
  if (isM3) {
    // Pour M+3, les tags sont obligatoires
    if (!act.m3Suivi || typeof act.m3Suivi !== 'object' || Object.keys(act.m3Suivi).length === 0) {
      throw new Error('Les tags de suivi sont obligatoires pour les actes M+3.');
    }
    actData.m3Suivi = act.m3Suivi;
  } else if (isPreterme) {
    // Pour PRETERME, les tags sont obligatoires
    if (!act.pretermeSuivi || typeof act.pretermeSuivi !== 'object' || Object.keys(act.pretermeSuivi).length === 0) {
      throw new Error('Les tags de suivi sont obligatoires pour les prétermes.');
    }
    actData.pretermeSuivi = act.pretermeSuivi;
  }
  // Pour AN, pas de tags de suivi

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
  
  // Les tags de suivi sont déjà inclus dans updates via anSuivi, m3Suivi, pretermeSuivi
  // Ils seront automatiquement ajoutés à updateData par la boucle ci-dessus
  
  await updateDoc(actRef, updateData);
};

export const getActById = async (actId: string): Promise<Act | null> => {
  if (!db) return null;
  
  const actDoc = await getDoc(doc(db, "acts", actId));
  if (!actDoc.exists()) return null;
  
  return { id: actDoc.id, ...actDoc.data() } as Act;
};

export const contractNumberExists = async (numeroContrat: string): Promise<boolean> => {
  // Utiliser l'API route qui utilise Firebase Admin SDK
  // pour avoir accès à tous les actes (contourne les règles Firestore)
  try {
    const response = await fetch("/api/acts/check-contract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ numeroContrat }),
    });

    if (!response.ok) {
      console.error("Erreur API check-contract:", response.statusText);
      return false;
    }

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error("Erreur lors de la vérification du numéro de contrat:", error);
    return false;
  }
};

/**
 * Récupère les KPI de tous les commerciaux pour un mois donné
 * 
 * @deprecated Utiliser la collection leaderboard via lib/firebase/leaderboard.ts à la place.
 * Cette fonction est conservée pour rétrocompatibilité mais sera supprimée dans une future version.
 * 
 * Migration recommandée:
 * - Pour les classements: utiliser getProcessLeaderboard() ou getLeaderboard()
 * - Exécuter scripts/generate-leaderboard.ts pour générer les données agrégées
 */
export async function getAllCommercialsKPI(monthKey: string): Promise<{
  userId: string;
  email: string;
  firstName: string;
  commissions: number;
  process: number;
  ca: number;
}[]> {
  if (!db) return [];
  
  try {
    // 1. Récupérer tous les commerciaux
    const { getAllCommercials } = await import('./auth');
    const commercials = await getAllCommercials();
    
    // 2. Récupérer tous les actes du mois en une seule requête (plus efficace)
    const actsQuery = query(
      collection(db, "acts"),
      where("moisKey", "==", monthKey)
    );
    const actsSnapshot = await getDocs(actsQuery);
    const allActs = actsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Act[];
    
    // 3. Grouper les actes par userId
    const actsByUser = new Map<string, Act[]>();
    allActs.forEach(act => {
      if (!actsByUser.has(act.userId)) {
        actsByUser.set(act.userId, []);
      }
      actsByUser.get(act.userId)!.push(act);
    });
    
    // 4. Calculer les KPI pour chaque commercial
    const { calculateKPI } = await import('../utils/kpi');
    
    const results = commercials.map(commercial => {
      const userActs = actsByUser.get(commercial.id) || [];
      const kpi = calculateKPI(userActs);
      
      // Extraire le prénom depuis l'email
      const emailParts = commercial.email.split('@')[0].split('.');
      const rawFirstName = emailParts[0] || 'Commercial';
      const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();
      
      return {
        userId: commercial.id,
        email: commercial.email,
        firstName,
        commissions: kpi.commissionsPotentielles || 0,
        process: kpi.nbProcess || 0,
        ca: kpi.caMensuel || 0,
      };
    });
    
    return results;
  } catch (error) {
    console.error("Error fetching all commercials KPI:", error);
    return [];
  }
}
