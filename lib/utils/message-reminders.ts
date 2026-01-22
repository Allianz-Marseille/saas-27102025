/**
 * Utilitaires pour les rappels automatiques de messages
 */

import { AdminMessage, MessageRecipient } from "@/types/message";
import { UserMessagePreferences } from "@/types/message";
import { Timestamp } from "firebase/firestore";

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
 * Vérifie si un message non lu est plus ancien que 24h
 */
export function isMessageOlderThan24Hours(
  message: AdminMessage,
  recipient: MessageRecipient
): boolean {
  if (recipient.read) return false;

  const messageDate = toDate(message.createdAt);
  const now = new Date();
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  return diffInHours >= 24;
}

/**
 * Récupère les messages non lus > 24h pour un utilisateur
 */
export function getOldUnreadMessages(
  messages: AdminMessage[],
  recipients: MessageRecipient[]
): Array<{ message: AdminMessage; recipient: MessageRecipient }> {
  const oldUnread: Array<{ message: AdminMessage; recipient: MessageRecipient }> = [];

  for (const recipient of recipients) {
    if (!recipient.read) {
      const message = messages.find((m) => m.id === recipient.messageId);
      if (message && isMessageOlderThan24Hours(message, recipient)) {
        oldUnread.push({ message, recipient });
      }
    }
  }

  return oldUnread;
}

/**
 * Vérifie si un rappel doit être affiché selon la fréquence configurée
 */
export function shouldShowReminder(
  lastReminderTime: Date | null,
  frequency: UserMessagePreferences["reminderFrequency"]
): boolean {
  if (frequency === "none") return false;
  if (!lastReminderTime) return true;

  const now = new Date();
  const diffInHours = (now.getTime() - lastReminderTime.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case "daily":
      return diffInHours >= 24;
    case "weekly":
      return diffInHours >= 168; // 7 jours
    default:
      return false;
  }
}

/**
 * Joue une notification sonore (si activée)
 */
export function playNotificationSound(): void {
  try {
    // Créer un contexte audio pour jouer un son
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Son court et discret (800Hz, 0.1s)
    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.warn("Impossible de jouer la notification sonore:", error);
  }
}
