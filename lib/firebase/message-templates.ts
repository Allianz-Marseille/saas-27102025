/**
 * Utilitaires Firestore pour la gestion des templates de messages
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { MessageTemplate, MessageCategory } from "@/types/message";

const TEMPLATES_COLLECTION = "message_templates";

/**
 * Convertit un Timestamp Firestore en Date
 */
function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return new Date();
}

/**
 * Convertit une Date en Timestamp Firestore
 */
function toTimestamp(value: Date | Timestamp): Timestamp {
  if (value instanceof Timestamp) return value;
  return Timestamp.fromDate(value);
}

/**
 * Extrait les variables d'un template (ex: {nom_commercial}, {date})
 */
function extractVariables(content: string): string[] {
  const variableRegex = /\{([^}]+)\}/g;
  const matches = content.matchAll(variableRegex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(`{${match[1]}}`);
  }
  
  return Array.from(variables);
}

/**
 * Crée un nouveau template de message (ADMIN uniquement)
 */
export async function createTemplate(
  template: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt" | "variables">
): Promise<MessageTemplate> {
  if (!db) throw new Error("Firebase not initialized");

  // Validation
  if (!template.name || template.name.trim().length === 0) {
    throw new Error("Le nom du template est obligatoire");
  }
  if (!template.title || template.title.trim().length === 0) {
    throw new Error("Le titre est obligatoire");
  }
  if (!template.content || template.content.trim().length === 0) {
    throw new Error("Le contenu est obligatoire");
  }

  const now = Timestamp.now();
  const variables = extractVariables(template.content + " " + template.title);

  const templateData = {
    name: template.name.trim(),
    description: template.description?.trim() || undefined,
    title: template.title.trim(),
    content: template.content.trim(),
    category: template.category || undefined,
    createdBy: template.createdBy,
    createdAt: now,
    updatedAt: now,
    variables: variables.length > 0 ? variables : undefined,
  };

  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), templateData);

  return {
    id: docRef.id,
    ...template,
    createdAt: toDate(templateData.createdAt),
    updatedAt: toDate(templateData.updatedAt),
    variables: variables.length > 0 ? variables : undefined,
  };
}

/**
 * Récupère tous les templates (ADMIN uniquement)
 */
export async function getAllTemplates(): Promise<MessageTemplate[]> {
  if (!db) throw new Error("Firebase not initialized");

  const templatesRef = collection(db, TEMPLATES_COLLECTION);
  const q = query(templatesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      title: data.title,
      content: data.content,
      category: data.category,
      createdBy: data.createdBy,
      createdAt: toDate(data.createdAt),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
      variables: data.variables || [],
    } as MessageTemplate;
  });
}

/**
 * Récupère un template par son ID
 */
export async function getTemplateById(templateId: string): Promise<MessageTemplate | null> {
  if (!db) throw new Error("Firebase not initialized");

  const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
  const templateDoc = await getDoc(templateRef);

  if (!templateDoc.exists()) {
    return null;
  }

  const data = templateDoc.data();
  return {
    id: templateDoc.id,
    name: data.name,
    description: data.description,
    title: data.title,
    content: data.content,
    category: data.category,
    createdBy: data.createdBy,
    createdAt: toDate(data.createdAt),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
    variables: data.variables || [],
  } as MessageTemplate;
}

/**
 * Récupère les templates par catégorie
 */
export async function getTemplatesByCategory(
  category: MessageCategory
): Promise<MessageTemplate[]> {
  if (!db) throw new Error("Firebase not initialized");

  const templatesRef = collection(db, TEMPLATES_COLLECTION);
  const q = query(
    templatesRef,
    where("category", "==", category),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      title: data.title,
      content: data.content,
      category: data.category,
      createdBy: data.createdBy,
      createdAt: toDate(data.createdAt),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
      variables: data.variables || [],
    } as MessageTemplate;
  });
}

/**
 * Met à jour un template (ADMIN uniquement, créateur uniquement)
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<MessageTemplate, "id" | "createdBy" | "createdAt">>
): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
  const templateDoc = await getDoc(templateRef);

  if (!templateDoc.exists()) {
    throw new Error("Template introuvable");
  }

  const now = Timestamp.now();
  const updateData: Record<string, any> = {
    updatedAt: now,
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description?.trim() || undefined;
  }
  if (updates.title !== undefined) {
    updateData.title = updates.title.trim();
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content.trim();
    // Recalculer les variables
    const variables = extractVariables(
      updateData.content + " " + (updateData.title || templateDoc.data().title)
    );
    updateData.variables = variables.length > 0 ? variables : undefined;
  }
  if (updates.category !== undefined) {
    updateData.category = updates.category || undefined;
  }

  await updateDoc(templateRef, updateData);
}

/**
 * Supprime un template (ADMIN uniquement, créateur uniquement)
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
  const templateDoc = await getDoc(templateRef);

  if (!templateDoc.exists()) {
    throw new Error("Template introuvable");
  }

  await deleteDoc(templateRef);
}

/**
 * Remplace les variables dans un template par des valeurs réelles
 */
export function replaceTemplateVariables(
  template: MessageTemplate,
  variables: Record<string, string>
): { title: string; content: string } {
  let title = template.title;
  let content = template.content;

  // Remplacer toutes les variables
  for (const [key, value] of Object.entries(variables)) {
    const variablePattern = new RegExp(`\\{${key}\\}`, "g");
    title = title.replace(variablePattern, value);
    content = content.replace(variablePattern, value);
  }

  return { title, content };
}
