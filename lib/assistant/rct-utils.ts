import { getRoleById, getContextById, getTaskById } from "./rct-definitions";

export interface RCTData {
  role?: string;
  context?: string;
  task?: string;
}

/**
 * Génère le prompt système basé sur les données RCT
 */
export function generateSystemPromptFromRCT(rctData: RCTData): string {
  const role = rctData.role ? getRoleById(rctData.role) : null;
  const context = rctData.role && rctData.context
    ? getContextById(rctData.role, rctData.context)
    : null;
  const task = rctData.task ? getTaskById(rctData.task) : null;

  let prompt = "Tu es un assistant IA spécialisé dans le domaine de l'assurance.\n\n";

  if (role) {
    prompt += `**Rôle** : ${role.label}\n`;
    if (role.description) {
      prompt += `${role.description}\n`;
    }
    prompt += "\n";
  }

  if (context) {
    prompt += `**Contexte** : ${context.label}\n`;
    if (context.description) {
      prompt += `${context.description}\n`;
    }
    prompt += "\n";
  }

  if (task) {
    prompt += `**Tâche** : ${task.label}\n`;
    if (task.description) {
      prompt += `${task.description}\n`;
    }
    prompt += "\n";
  }

  prompt +=
    "Adapte ton langage, ton expertise et tes réponses en fonction du rôle, du contexte et de la tâche définis ci-dessus.\n";
  prompt +=
    "Sois précis, professionnel et utile. Utilise un langage adapté au domaine de l'assurance.";

  return prompt;
}

/**
 * Vérifie si les données RCT sont complètes
 */
export function isRCTComplete(rctData: RCTData): boolean {
  return !!(rctData.role && rctData.context && rctData.task);
}

/**
 * Génère un résumé textuel des données RCT pour l'affichage
 */
export function getRCTSummary(rctData: RCTData): string {
  const parts: string[] = [];

  if (rctData.role) {
    const role = getRoleById(rctData.role);
    if (role) parts.push(`Rôle: ${role.label}`);
  }

  if (rctData.context && rctData.role) {
    const context = getContextById(rctData.role, rctData.context);
    if (context) parts.push(`Contexte: ${context.label}`);
  }

  if (rctData.task) {
    const task = getTaskById(rctData.task);
    if (task) parts.push(`Tâche: ${task.label}`);
  }

  return parts.join(" • ");
}

