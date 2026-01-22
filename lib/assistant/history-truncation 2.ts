/**
 * Utilitaires pour la troncature intelligente de l'historique des conversations
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MAX_MESSAGES_IN_CONTEXT = 20; // Nombre maximum de messages à garder dans le contexte
const TRUNCATE_THRESHOLD = 30; // Seuil pour déclencher la troncature (nombre de messages)

/**
 * Tronque l'historique en gardant les N derniers messages
 */
export function truncateHistory(
  messages: ConversationMessage[],
  maxMessages: number = MAX_MESSAGES_IN_CONTEXT
): ConversationMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Garder le premier message (contexte initial) et les N derniers
  const firstMessage = messages[0];
  const lastMessages = messages.slice(-maxMessages + 1); // -1 pour garder la place du premier message

  return [firstMessage, ...lastMessages];
}

/**
 * Résume les anciens messages si la conversation est très longue
 * Utilise gpt-3.5-turbo pour réduire les coûts
 */
export async function summarizeOldMessages(
  messages: ConversationMessage[],
  threshold: number = TRUNCATE_THRESHOLD
): Promise<string | null> {
  if (messages.length <= threshold) {
    return null;
  }

  // Prendre les messages du milieu (ceux qui seront supprimés)
  const messagesToSummarize = messages.slice(1, messages.length - MAX_MESSAGES_IN_CONTEXT + 1);

  if (messagesToSummarize.length === 0) {
    return null;
  }

  try {
    const conversationText = messagesToSummarize
      .map((msg) => `${msg.role === "user" ? "Utilisateur" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const summaryPrompt = `Résume brièvement cette conversation précédente en conservant les points clés et le contexte important. Le résumé doit être concis (maximum 200 mots) :

${conversationText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant qui résume des conversations de manière concise et précise.",
        },
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Erreur lors du résumé des messages:", error);
    return null;
  }
}

/**
 * Prépare l'historique pour l'envoi à l'API OpenAI
 * Tronque si nécessaire et ajoute un résumé si la conversation est très longue
 */
export async function prepareHistoryForAPI(
  messages: ConversationMessage[]
): Promise<{
  messages: ConversationMessage[];
  summary?: string;
}> {
  if (messages.length <= MAX_MESSAGES_IN_CONTEXT) {
    return { messages };
  }

  // Si la conversation dépasse le seuil, essayer de résumer les anciens messages
  if (messages.length > TRUNCATE_THRESHOLD) {
    const summary = await summarizeOldMessages(messages);
    
    if (summary) {
      // Créer un message de résumé
      const summaryMessage: ConversationMessage = {
        id: `summary-${Date.now()}`,
        role: "assistant",
        content: `[Résumé de la conversation précédente] ${summary}`,
        timestamp: new Date(),
      };

      // Garder le premier message, le résumé, et les derniers messages
      const firstMessage = messages[0];
      const lastMessages = messages.slice(-MAX_MESSAGES_IN_CONTEXT + 2); // -2 pour le premier message et le résumé

      return {
        messages: [firstMessage, summaryMessage, ...lastMessages],
        summary,
      };
    }
  }

  // Sinon, simplement tronquer
  return {
    messages: truncateHistory(messages),
  };
}

/**
 * Estime le nombre de tokens dans un message
 */
export function estimateTokens(text: string): number {
  // Approximation : ~4 caractères par token
  return Math.ceil(text.length / 4);
}

/**
 * Vérifie si l'historique dépasse une limite de tokens
 */
export function exceedsTokenLimit(
  messages: ConversationMessage[],
  maxTokens: number = 10000
): boolean {
  const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  return totalTokens > maxTokens;
}

