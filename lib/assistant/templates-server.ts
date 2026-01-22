/**
 * Fonctions serveur pour la gestion des templates de prompts
 * Ce fichier utilise firebase-admin et ne doit être importé que côté serveur
 */

import { adminDb } from "@/lib/firebase/admin-config";
import type { PromptTemplate } from "./templates";
import { DEFAULT_TEMPLATES } from "./templates";

/**
 * Charger tous les templates (système + utilisateur)
 */
export async function loadTemplates(userId?: string): Promise<PromptTemplate[]> {
  // Templates système
  const systemTemplates: PromptTemplate[] = DEFAULT_TEMPLATES.map((t, idx) => ({
    ...t,
    id: `system-${idx}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Templates utilisateur (si userId fourni)
  if (userId) {
    try {
      const snapshot = await adminDb
        .collection("assistant_templates")
        .where("createdBy", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const userTemplates: PromptTemplate[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as PromptTemplate[];

      return [...systemTemplates, ...userTemplates];
    } catch (error) {
      console.error("Erreur lors du chargement des templates utilisateur:", error);
      // Retourner seulement les templates système en cas d'erreur
      return systemTemplates;
    }
  }

  return systemTemplates;
}

/**
 * Sauvegarder un template utilisateur
 */
export async function saveUserTemplate(
  userId: string,
  template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt" | "isSystem" | "createdBy">
): Promise<string> {
  const templateData = {
    ...template,
    createdBy: userId,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await adminDb.collection("assistant_templates").add(templateData);
  return docRef.id;
}

/**
 * Supprimer un template utilisateur
 */
export async function deleteUserTemplate(templateId: string, userId: string): Promise<void> {
  const doc = await adminDb.collection("assistant_templates").doc(templateId).get();

  if (!doc.exists) {
    throw new Error("Template non trouvé");
  }

  const data = doc.data();
  if (data?.createdBy !== userId) {
    throw new Error("Accès non autorisé à ce template");
  }

  await adminDb.collection("assistant_templates").doc(templateId).delete();
}

