import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, getDoc, setDoc, orderBy } from "firebase/firestore";
import { db } from "./config";
import { AgencyCommission } from "@/types";

/**
 * Calcule le total des commissions
 */
export const calculateTotalCommissions = (
  iard: number,
  vie: number,
  courtage: number,
  profits: number
): number => {
  return iard + vie + courtage + profits;
};

/**
 * Calcule le résultat
 */
export const calculateResultat = (totalCommissions: number, charges: number): number => {
  return totalCommissions - charges;
};

/**
 * Crée ou met à jour les données de commissions pour un mois donné
 */
export const upsertMonthCommissions = async (
  year: number,
  month: number,
  data: {
    commissionsIARD: number;
    commissionsVie: number;
    commissionsCourtage: number;
    profitsExceptionnels: number;
    chargesAgence: number;
    prelevementsJulien: number;
    prelevementsJeanMichel: number;
  },
  userId: string
): Promise<AgencyCommission> => {
  if (!db) throw new Error('Firebase not initialized');

  // Calculer les totaux
  const totalCommissions = calculateTotalCommissions(
    data.commissionsIARD,
    data.commissionsVie,
    data.commissionsCourtage,
    data.profitsExceptionnels
  );
  const resultat = calculateResultat(totalCommissions, data.chargesAgence);

  // Vérifier si le document existe déjà
  const existingDoc = await getMonthCommissions(year, month);

  const commissionData = {
    year,
    month,
    commissionsIARD: data.commissionsIARD,
    commissionsVie: data.commissionsVie,
    commissionsCourtage: data.commissionsCourtage,
    profitsExceptionnels: data.profitsExceptionnels,
    totalCommissions,
    chargesAgence: data.chargesAgence,
    resultat,
    prelevementsJulien: data.prelevementsJulien,
    prelevementsJeanMichel: data.prelevementsJeanMichel,
  };

  if (existingDoc) {
    // Mise à jour
    const docRef = doc(db, "agency_commissions", existingDoc.id);
    await updateDoc(docRef, {
      ...commissionData,
      updatedAt: Timestamp.now(),
      lastUpdatedBy: userId,
    });

    return {
      id: existingDoc.id,
      ...commissionData,
      createdAt: existingDoc.createdAt,
      updatedAt: new Date(),
      createdBy: existingDoc.createdBy,
      lastUpdatedBy: userId,
    };
  } else {
    // Création
    const docRef = await addDoc(collection(db, "agency_commissions"), {
      ...commissionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      lastUpdatedBy: userId,
    });

    return {
      id: docRef.id,
      ...commissionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      lastUpdatedBy: userId,
    };
  }
};

/**
 * Récupère les données d'un mois spécifique
 */
export const getMonthCommissions = async (
  year: number,
  month: number
): Promise<AgencyCommission | null> => {
  if (!db) return null;

  const q = query(
    collection(db, "agency_commissions"),
    where("year", "==", year),
    where("month", "==", month)
  );

  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as AgencyCommission;
};

/**
 * Récupère toutes les données d'une année
 */
export const getYearCommissions = async (year: number): Promise<AgencyCommission[]> => {
  if (!db) return [];

  const q = query(
    collection(db, "agency_commissions"),
    where("year", "==", year),
    orderBy("month", "asc")
  );

  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as AgencyCommission;
  });
};

/**
 * Récupère toutes les années disponibles
 */
export const getAvailableYears = async (): Promise<number[]> => {
  if (!db) return [];

  const querySnapshot = await getDocs(collection(db, "agency_commissions"));
  
  const years = new Set<number>();
  querySnapshot.docs.forEach((doc) => {
    years.add(doc.data().year);
  });

  return Array.from(years).sort((a, b) => b - a); // Tri décroissant
};

/**
 * Supprime les données d'un mois
 */
export const deleteMonthCommissions = async (commissionId: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  await deleteDoc(doc(db, "agency_commissions", commissionId));
};

/**
 * Crée une nouvelle année (12 mois vides)
 */
export const createNewYear = async (year: number, userId: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');

  // Vérifier que l'année n'existe pas déjà
  const existingYear = await getYearCommissions(year);
  if (existingYear.length > 0) {
    throw new Error('Cette année existe déjà');
  }

  // Créer 12 mois vides
  const batch: Promise<void>[] = [];
  
  for (let month = 1; month <= 12; month++) {
    const monthData = {
      year,
      month,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      prelevementsJulien: 0,
      prelevementsJeanMichel: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
      lastUpdatedBy: userId,
    };

    batch.push(addDoc(collection(db, "agency_commissions"), monthData).then(() => {}));
  }

  await Promise.all(batch);
};

/**
 * Extrapole les données d'une année incomplète sur 12 mois
 */
export const extrapolateYear = (data: AgencyCommission[]): {
  totalCommissions: number;
  chargesAgence: number;
  resultat: number;
  commissionsIARD: number;
  commissionsVie: number;
  commissionsCourtage: number;
  profitsExceptionnels: number;
  prelevementsJulien: number;
  prelevementsJeanMichel: number;
} => {
  const completeMonths = data.filter(
    (d) => d.totalCommissions > 0 || d.chargesAgence > 0
  );

  if (completeMonths.length === 0) {
    return {
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
      prelevementsJulien: 0,
      prelevementsJeanMichel: 0,
    };
  }

  const totals = completeMonths.reduce(
    (acc, month) => ({
      totalCommissions: acc.totalCommissions + month.totalCommissions,
      chargesAgence: acc.chargesAgence + month.chargesAgence,
      resultat: acc.resultat + month.resultat,
      commissionsIARD: acc.commissionsIARD + month.commissionsIARD,
      commissionsVie: acc.commissionsVie + month.commissionsVie,
      commissionsCourtage: acc.commissionsCourtage + month.commissionsCourtage,
      profitsExceptionnels: acc.profitsExceptionnels + month.profitsExceptionnels,
      prelevementsJulien: acc.prelevementsJulien + month.prelevementsJulien,
      prelevementsJeanMichel: acc.prelevementsJeanMichel + month.prelevementsJeanMichel,
    }),
    {
      totalCommissions: 0,
      chargesAgence: 0,
      resultat: 0,
      commissionsIARD: 0,
      commissionsVie: 0,
      commissionsCourtage: 0,
      profitsExceptionnels: 0,
      prelevementsJulien: 0,
      prelevementsJeanMichel: 0,
    }
  );

  // Extrapolation: (Somme mois complets / Nb mois complets) × 12
  const n = completeMonths.length;
  return {
    totalCommissions: Math.round((totals.totalCommissions / n) * 12),
    chargesAgence: Math.round((totals.chargesAgence / n) * 12),
    resultat: Math.round((totals.resultat / n) * 12),
    commissionsIARD: Math.round((totals.commissionsIARD / n) * 12),
    commissionsVie: Math.round((totals.commissionsVie / n) * 12),
    commissionsCourtage: Math.round((totals.commissionsCourtage / n) * 12),
    profitsExceptionnels: Math.round((totals.profitsExceptionnels / n) * 12),
    prelevementsJulien: Math.round((totals.prelevementsJulien / n) * 12),
    prelevementsJeanMichel: Math.round((totals.prelevementsJeanMichel / n) * 12),
  };
};

