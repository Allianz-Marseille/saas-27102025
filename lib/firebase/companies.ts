import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs as getAllDocs, updateDoc as firestoreUpdateDoc } from "firebase/firestore";
import { db } from "./config";

export interface Company {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  isSystem?: boolean; // Marqueur pour les compagnies système
}

// Compagnies système qui ne peuvent jamais être supprimées ou modifiées
export const SYSTEM_COMPANIES = ["Allianz", "Courtage", "Unim", "Uniced"];

// Vérifie si une compagnie est une compagnie système
export const isSystemCompany = (name: string): boolean => {
  return SYSTEM_COMPANIES.some(sys => sys.toLowerCase() === name.toLowerCase());
};

export const getCompanies = async (): Promise<Company[]> => {
  if (!db) return [];
  
  const querySnapshot = await getDocs(collection(db, "companies"));
  const companies = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Company[];
  
  // Ajouter les compagnies système si elles n'existent pas dans Firestore
  const existingNames = companies.map(c => c.name.toLowerCase());
  for (const sysCompany of SYSTEM_COMPANIES) {
    if (!existingNames.includes(sysCompany.toLowerCase())) {
      companies.unshift({
        id: `system-${sysCompany}`,
        name: sysCompany,
        active: true,
        createdAt: new Date(),
        isSystem: true,
      });
    } else {
      // Marquer les compagnies système existantes
      const company = companies.find(c => c.name.toLowerCase() === sysCompany.toLowerCase());
      if (company) {
        company.isSystem = true;
      }
    }
  }
  
  return companies;
};

export const createCompany = async (name: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  await addDoc(collection(db, "companies"), {
    name,
    active: true,
    createdAt: new Date(),
  });
};

export const updateCompany = async (id: string, data: Partial<Company>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Récupérer la compagnie pour vérifier son nom
  const companySnapshot = await getDocs(collection(db, "companies"));
  const companyToUpdate = companySnapshot.docs.find(d => d.id === id);
  
  if (companyToUpdate) {
    const companyData = companyToUpdate.data();
    
    // Vérifier si c'est une compagnie système
    if (isSystemCompany(companyData.name)) {
      throw new Error('Impossible de modifier une compagnie système (Allianz, Courtage, Unim ou Uniced)');
    }
    
    // Vérifier si le nouveau nom est une compagnie système
    if (data.name && isSystemCompany(data.name)) {
      throw new Error('Ce nom est réservé pour une compagnie système');
    }
  }
  
  const companyRef = doc(db, "companies", id);
  await updateDoc(companyRef, data);
};

export const deleteCompany = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  // Récupérer la compagnie pour vérifier son nom
  const companySnapshot = await getDocs(collection(db, "companies"));
  const companyToDelete = companySnapshot.docs.find(d => d.id === id);
  
  if (companyToDelete) {
    const companyData = companyToDelete.data();
    
    // Vérifier si c'est une compagnie système
    if (isSystemCompany(companyData.name)) {
      throw new Error('Impossible de supprimer une compagnie système (Allianz, Courtage, Unim ou Uniced)');
    }
    
    // Remplacer toutes les occurrences de cette compagnie par "Courtage" dans les actes
    await replaceCompanyInActs(companyData.name, "Courtage");
  }
  
  const companyRef = doc(db, "companies", id);
  await deleteDoc(companyRef);
};

// Remplacer une compagnie par une autre dans tous les actes
export const replaceCompanyInActs = async (oldCompany: string, newCompany: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  
  try {
    if (!db) throw new Error('Firebase not initialized');
    
    // Récupérer tous les actes avec cette compagnie
    const actsRef = collection(db, "acts");
    const q = query(actsRef, where("compagnie", "==", oldCompany));
    const querySnapshot = await getDocs(q);
    
    // Mettre à jour chaque acte
    const updatePromises = querySnapshot.docs.map(async (docSnap) => {
      const actRef = doc(db!, "acts", docSnap.id);
      await updateDoc(actRef, {
        compagnie: newCompany
      });
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ ${querySnapshot.docs.length} acte(s) mis à jour : "${oldCompany}" remplacé par "${newCompany}"`);
  } catch (error) {
    console.error("Erreur lors du remplacement de la compagnie dans les actes:", error);
    throw error;
  }
};

