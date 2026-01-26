import { collection, doc, getDocs, query, where, setDoc, deleteDoc, updateDoc, Timestamp, orderBy, limit, getDoc } from "firebase/firestore";
import { db } from "./config";
import type { User, SalaryHistory, SalaryDraft, SalaryDraftItem } from "@/types";

/**
 * Récupère tous les utilisateurs actifs non-administrateurs avec leurs salaires actuels
 */
export const getCurrentSalaries = async (): Promise<User[]> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const usersRef = collection(db, "users");
    // On récupère tous les utilisateurs et on filtre côté client
    // pour éviter de créer un index composite (where + !=)
    const snapshot = await getDocs(usersRef);
    
    const allUsers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        active: data.active !== false, // Par défaut true si non défini
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        contrat: data.contrat,
        etp: data.etp,
        currentMonthlySalary: data.currentMonthlySalary,
      } as User;
    });

    // Filtrer les utilisateurs actifs non-administrateurs
    return allUsers.filter(user => 
      user.active && user.role !== "ADMINISTRATEUR"
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des salaires:", error);
    throw error;
  }
};

/**
 * Supprime toutes les entrées d'historique pour une année donnée
 */
export const deleteYearFromHistory = async (year: number): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const historyRef = collection(db, "salary_history");
    const q = query(historyRef, where("year", "==", year));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'année:", error);
    throw error;
  }
};

/**
 * Récupère l'historique des salaires
 * @param userId - Optionnel : filtrer par userId
 * @param year - Optionnel : filtrer par année
 */
export const getSalaryHistory = async (
  userId?: string,
  year?: number
): Promise<SalaryHistory[]> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const historyRef = collection(db, "salary_history");
    let q = query(historyRef, orderBy("validatedAt", "desc"));

    if (userId && year) {
      q = query(
        historyRef,
        where("userId", "==", userId),
        where("year", "==", year),
        orderBy("validatedAt", "desc")
      );
    } else if (userId) {
      q = query(
        historyRef,
        where("userId", "==", userId),
        orderBy("validatedAt", "desc")
      );
    } else if (year) {
      q = query(
        historyRef,
        where("year", "==", year),
        orderBy("validatedAt", "desc")
      );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        year: data.year,
        monthlySalary: data.monthlySalary,
        previousMonthlySalary: data.previousMonthlySalary,
        changeType: data.changeType,
        changeAmount: data.changeAmount,
        changePercentage: data.changePercentage,
        validatedAt: data.validatedAt?.toDate ? data.validatedAt.toDate() : data.validatedAt,
        validatedBy: data.validatedBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      } as SalaryHistory;
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    throw error;
  }
};

/**
 * Valide une augmentation de salaire pour un utilisateur
 */
export const validateSalaryIncrease = async (
  userId: string,
  currentSalary: number,
  newSalary: number,
  year: number,
  changeType: "percentage" | "amount",
  changeValue: number,
  validatedBy: string
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const now = Timestamp.now();
    
    // Déterminer le type de changement
    let salaryChangeType: "initial" | "increase" | "decrease";
    if (!currentSalary || currentSalary === 0) {
      salaryChangeType = "initial";
    } else if (newSalary > currentSalary) {
      salaryChangeType = "increase";
    } else {
      salaryChangeType = "decrease";
    }

    // Calculer le montant et le pourcentage réels
    const actualChangeAmount = newSalary - currentSalary;
    const actualChangePercentage = currentSalary > 0 
      ? ((newSalary - currentSalary) / currentSalary) * 100 
      : 0;

    // Vérifier si une entrée existe déjà pour cette année et cet utilisateur
    // Si oui, la mettre à jour, sinon créer une nouvelle entrée
    const historyRef = collection(db, "salary_history");
    const existingQuery = query(
      historyRef,
      where("userId", "==", userId),
      where("year", "==", year)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    const historyData: Omit<SalaryHistory, "id"> = {
      userId,
      year,
      monthlySalary: newSalary,
      ...(currentSalary > 0 && { previousMonthlySalary: currentSalary }),
      changeType: salaryChangeType,
      changeAmount: actualChangeAmount,
      changePercentage: actualChangePercentage,
      validatedAt: now,
      validatedBy,
      createdAt: now,
    };

    if (existingSnapshot.empty) {
      // Créer une nouvelle entrée
      const newHistoryRef = doc(collection(db, "salary_history"));
      await setDoc(newHistoryRef, historyData);
    } else {
      // Mettre à jour l'entrée existante
      const existingDoc = existingSnapshot.docs[0];
      await setDoc(existingDoc.ref, historyData, { merge: false });
    }

    // Mettre à jour le salaire actuel dans le document utilisateur
    // UNIQUEMENT si l'année est l'année actuelle ou future
    // Pour les années passées, on ne met pas à jour currentMonthlySalary
    const currentYear = new Date().getFullYear();
    if (year >= currentYear) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        currentMonthlySalary: newSalary,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la validation de l'augmentation:", error);
    throw error;
  }
};

/**
 * Valide plusieurs augmentations de salaire en batch
 */
export const validateAllSalaryIncreases = async (
  increases: Array<{
    userId: string;
    currentSalary: number;
    newSalary: number;
    changeType: "percentage" | "amount";
    changeValue: number;
  }>,
  year: number,
  validatedBy: string
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    // Valider toutes les augmentations en parallèle
    await Promise.all(
      increases.map(increase =>
        validateSalaryIncrease(
          increase.userId,
          increase.currentSalary,
          increase.newSalary,
          year,
          increase.changeType,
          increase.changeValue,
          validatedBy
        )
      )
    );
  } catch (error) {
    console.error("Erreur lors de la validation des augmentations:", error);
    throw error;
  }
};

/**
 * Supprime les entrées d'historique de plus de 3 ans
 */
export const cleanOldSalaryHistory = async (): Promise<number> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const historyRef = collection(db, "salary_history");
    const q = query(
      historyRef,
      where("createdAt", "<", Timestamp.fromDate(threeYearsAgo))
    );

    const snapshot = await getDocs(q);
    
    // Supprimer tous les documents obsolètes
    await Promise.all(
      snapshot.docs.map(doc => deleteDoc(doc.ref))
    );

    return snapshot.size;
  } catch (error) {
    console.error("Erreur lors du nettoyage de l'historique:", error);
    throw error;
  }
};

/**
 * Récupère le dernier salaire enregistré pour un utilisateur
 */
export const getLastSalary = async (userId: string): Promise<number | null> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const historyRef = collection(db, "salary_history");
    const q = query(
      historyRef,
      where("userId", "==", userId),
      orderBy("validatedAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data();
    return data.monthlySalary || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du dernier salaire:", error);
    throw error;
  }
};

/**
 * Enregistre un brouillon d'augmentations (modifiable, non définitif)
 */
export const saveSalaryDraft = async (
  items: SalaryDraftItem[],
  year: number,
  createdBy: string
): Promise<string> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const now = Timestamp.now();
    
    // Un seul brouillon actif par admin, identifié par l'ID de l'admin
    const draftRef = doc(db, "salary_drafts", createdBy);
    
    const draftData: Omit<SalaryDraft, "id"> = {
      year,
      items,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    await setDoc(draftRef, draftData);
    
    return draftRef.id;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du brouillon:", error);
    throw error;
  }
};

/**
 * Récupère le brouillon actif d'un admin
 */
export const getSalaryDraft = async (adminId: string): Promise<SalaryDraft | null> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const draftRef = doc(db, "salary_drafts", adminId);
    const draftSnap = await getDoc(draftRef);
    
    if (!draftSnap.exists()) {
      return null;
    }

    const data = draftSnap.data();
    return {
      id: draftSnap.id,
      year: data.year,
      items: data.items,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      createdBy: data.createdBy,
    } as SalaryDraft;
  } catch (error) {
    console.error("Erreur lors de la récupération du brouillon:", error);
    throw error;
  }
};

/**
 * Supprime le brouillon actif d'un admin
 */
export const deleteSalaryDraft = async (adminId: string): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const draftRef = doc(db, "salary_drafts", adminId);
    await deleteDoc(draftRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du brouillon:", error);
    throw error;
  }
};

/**
 * Valide un brouillon : applique les augmentations et supprime le brouillon
 */
export const validateDraft = async (
  draft: SalaryDraft,
  validatedBy: string
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    // Appliquer toutes les augmentations
    const increases = draft.items.map(item => ({
      userId: item.userId,
      currentSalary: item.currentSalary,
      newSalary: item.newSalary,
      changeType: item.type,
      changeValue: item.value,
    }));

    await validateAllSalaryIncreases(increases, draft.year, validatedBy);

    // Supprimer le brouillon (partagé ou individuel selon l'ID)
    if (draft.id === "shared") {
      await deleteSharedSalaryDraft();
    } else {
      await deleteSalaryDraft(draft.createdBy);
    }
  } catch (error) {
    console.error("Erreur lors de la validation du brouillon:", error);
    throw error;
  }
};

/**
 * Récupère le brouillon partagé (accessible par tous les admins)
 */
export const getSharedSalaryDraft = async (): Promise<SalaryDraft | null> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const draftRef = doc(db, "salary_drafts", "shared");
    const draftSnap = await getDoc(draftRef);
    
    if (!draftSnap.exists()) {
      return null;
    }

    const data = draftSnap.data();
    return {
      id: draftSnap.id,
      year: data.year,
      items: data.items,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      createdBy: data.createdBy,
      lastUpdatedBy: data.lastUpdatedBy,
    } as SalaryDraft;
  } catch (error) {
    console.error("Erreur lors de la récupération du brouillon partagé:", error);
    throw error;
  }
};

/**
 * Enregistre le brouillon partagé (accessible par tous les admins)
 */
export const saveSharedSalaryDraft = async (
  items: SalaryDraftItem[],
  year: number,
  updatedBy: string
): Promise<string> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const now = Timestamp.now();
    const draftRef = doc(db, "salary_drafts", "shared");
    
    // Vérifier si le brouillon existe déjà
    const draftSnap = await getDoc(draftRef);
    const exists = draftSnap.exists();
    
    const draftData: Omit<SalaryDraft, "id"> = {
      year,
      items,
      updatedAt: now,
      lastUpdatedBy: updatedBy,
      // Si le brouillon existe, conserver createdAt et createdBy
      // Sinon, créer avec les nouvelles valeurs
      ...(exists ? {
        createdAt: draftSnap.data().createdAt,
        createdBy: draftSnap.data().createdBy,
      } : {
        createdAt: now,
        createdBy: updatedBy,
      }),
    };

    await setDoc(draftRef, draftData);
    
    return draftRef.id;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du brouillon partagé:", error);
    throw error;
  }
};

/**
 * Supprime le brouillon partagé
 */
export const deleteSharedSalaryDraft = async (): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const draftRef = doc(db, "salary_drafts", "shared");
    await deleteDoc(draftRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du brouillon partagé:", error);
    throw error;
  }
};
