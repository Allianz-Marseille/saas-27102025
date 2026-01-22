/**
 * Fonctions d'export de conversations
 */

import type { Conversation } from "./conversations";

/**
 * Export d'une conversation en texte brut
 */
export function exportToText(conversation: Conversation): string {
  let text = `Conversation: ${conversation.title}\n`;
  text += `Date: ${conversation.createdAt.toLocaleDateString("fr-FR")}\n`;
  text += `Messages: ${conversation.messages.length}\n`;
  text += "=".repeat(50) + "\n\n";

  for (const message of conversation.messages) {
    const role = message.role === "user" ? "Utilisateur" : "Assistant";
    const timestamp = new Date(message.timestamp).toLocaleString("fr-FR");
    
    text += `[${role}] - ${timestamp}\n`;
    text += "-".repeat(50) + "\n";
    text += message.content + "\n";
    
    if (message.images && message.images.length > 0) {
      text += `\n[${message.images.length} image(s) jointe(s)]\n`;
    }
    
    if (message.sources && message.sources.length > 0) {
      text += `\nSources:\n`;
      for (const source of message.sources) {
        text += `- ${source}\n`;
      }
    }
    
    text += "\n";
  }

  return text;
}

/**
 * Export d'une conversation en PDF
 * Note: Nécessite l'installation de pdfkit ou puppeteer
 */
export async function exportToPDF(conversation: Conversation): Promise<Buffer> {
  // Pour l'instant, on retourne une erreur indiquant que c'est à implémenter
  // TODO: Installer pdfkit ou puppeteer et implémenter la génération PDF
  throw new Error("L'export PDF sera bientôt disponible. Veuillez utiliser l'export TXT pour l'instant.");
}

/**
 * Export d'une conversation en Word (.docx)
 * Note: Nécessite l'installation de docx
 */
export async function exportToWord(conversation: Conversation): Promise<Buffer> {
  // Pour l'instant, on retourne une erreur indiquant que c'est à implémenter
  // TODO: Installer docx et implémenter la génération Word
  throw new Error("L'export Word sera bientôt disponible. Veuillez utiliser l'export TXT pour l'instant.");
}

