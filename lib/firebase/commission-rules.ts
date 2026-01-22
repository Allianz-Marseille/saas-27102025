import { collection, doc, getDoc, setDoc, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "./config";

export interface CommissionRule {
  id: string;
  contratType: string;
  montant: number;
  pourcentage?: number;
  trancheMin?: number;
  active: boolean;
  createdAt?: Date;
}

export const COMMISSION_RULES: Record<string, { montant?: number; pourcentage?: number; trancheMin?: number }> = {
  AUTO_MOTO: { montant: 10 },
  IRD_PART: { montant: 20 },
  IRD_PRO: { montant: 20, pourcentage: 10, trancheMin: 1000 },
  PJ: { montant: 30 },
  GAV: { montant: 40 },
  NOP_50_EUR: { montant: 10 },
  SANTE_PREV: { montant: 50 },
  VIE_PP: { montant: 50 },
  VIE_PU: { pourcentage: 1 },
};

export const getCommissionRules = async (): Promise<CommissionRule[]> => {
  if (!db) return [];
  
  const q = query(collection(db, "commissionRules"), where("active", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CommissionRule[];
};

export const createCommissionRule = async (rule: Omit<CommissionRule, "id">): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const rulesRef = collection(db, "commissionRules");
  await setDoc(doc(rulesRef), {
    ...rule,
    createdAt: new Date(),
  });
};

export const updateCommissionRule = async (id: string, data: Partial<CommissionRule>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  const ruleRef = doc(db, "commissionRules", id);
  await updateDoc(ruleRef, data);
};

