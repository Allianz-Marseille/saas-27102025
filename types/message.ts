import { Timestamp } from "firebase/firestore";
import { UserRole } from "@/lib/utils/roles";

/**
 * Type de ciblage d'un message
 */
export type MessageTargetType = "global" | "role" | "personal";

/**
 * Priorité d'un message
 */
export type MessagePriority = "low" | "normal" | "high" | "urgent";

/**
 * Statut d'un message
 */
export type MessageStatus = "draft" | "sent" | "archived" | "scheduled";

/**
 * Catégorie de message (optionnel)
 */
export type MessageCategory =
  | "formation"
  | "commission"
  | "maintenance"
  | "information"
  | "urgence"
  | "autre";

/**
 * Interface principale pour un message admin
 */
export interface AdminMessage {
  id: string;
  createdAt: Date | Timestamp;
  createdBy: string; // userId de l'admin créateur
  createdByName?: string; // Nom de l'admin pour affichage
  title: string; // Titre du message (obligatoire, max 100 caractères)
  content: string; // Contenu du message (obligatoire, support markdown)
  priority: MessagePriority; // Priorité du message
  targetType: MessageTargetType; // Type de ciblage
  targetRole?: UserRole; // Rôle cible (si targetType === "role")
  targetUserId?: string; // userId cible (si targetType === "personal")
  status: MessageStatus; // Statut du message
  sentAt?: Date | Timestamp; // Date d'envoi (si status === "sent")
  scheduledAt?: Date | Timestamp; // Date de programmation (si message programmé)
  pinned: boolean; // Message épinglé (max 5)
  awaitingReply: boolean; // Message nécessite une réponse
  totalRecipients: number; // Nombre total de destinataires (calculé)
  readCount: number; // Nombre de destinataires ayant lu (calculé)
  unreadCount: number; // Nombre de destinataires non lus (calculé)
  category?: MessageCategory; // Catégorie principale (optionnel)
  tags?: string[]; // Tags multiples pour classification (optionnel)
  images?: string[]; // URLs des images (optionnel)
  videos?: string[]; // URLs des vidéos (optionnel)
  attachments?: MessageAttachment[]; // Pièces jointes (optionnel)
  // Analytics (Phase 4)
  averageReadTime?: number; // Temps moyen de lecture en secondes
  clickCount?: number; // Nombre de clics sur les liens
  completionRate?: number; // Taux de complétion 0-1
}

/**
 * Interface pour une pièce jointe
 */
export interface MessageAttachment {
  url: string; // URL de la pièce jointe
  name: string; // Nom du fichier
  type: string; // Type MIME (ex: "application/pdf")
  size?: number; // Taille en octets
}

/**
 * Interface pour un destinataire de message
 */
export interface MessageRecipient {
  id: string; // Identifiant unique (format: userId_messageId)
  messageId: string; // Référence au message (admin_messages)
  userId: string; // Référence à l'utilisateur destinataire (users)
  read: boolean; // Message lu ou non
  readAt?: Date | Timestamp; // Date de lecture (si read === true)
  notified: boolean; // Modale affichée ou non
  notifiedAt?: Date | Timestamp; // Date de notification (si notified === true)
  createdAt: Date | Timestamp; // Date de création
  // Analytics (Phase 4)
  readTime?: number; // Temps de lecture en secondes
  readProgress?: number; // Progression de lecture 0-1
}

/**
 * Interface pour une réponse à un message (Phase 5)
 */
export interface MessageReply {
  id: string; // Identifiant unique
  messageId: string; // Référence au message original
  userId: string; // Auteur de la réponse
  userName?: string; // Nom de l'auteur
  userEmail?: string; // Email de l'auteur
  content: string; // Contenu de la réponse (markdown)
  createdAt: Date | Timestamp; // Date de création
  readByAdmin: boolean; // Réponse lue par admin
  readByAdminAt?: Date | Timestamp; // Date de lecture par admin
}

/**
 * Interface pour un template de message (Phase 3)
 */
export interface MessageTemplate {
  id: string; // Identifiant unique
  name: string; // Nom du template
  description?: string; // Description du template
  title: string; // Titre par défaut
  content: string; // Contenu par défaut (avec variables)
  category?: MessageCategory; // Catégorie du template
  createdBy: string; // userId de l'admin créateur
  createdAt: Date | Timestamp; // Date de création
  updatedAt?: Date | Timestamp; // Date de modification
  variables?: string[]; // Liste des variables disponibles (ex: ["{nom_commercial}", "{date}"])
}

/**
 * Interface pour les statistiques d'un message (Phase 4)
 */
export interface MessageStatistics {
  messageId: string; // ID du message
  totalRecipients: number; // Nombre total de destinataires
  readCount: number; // Nombre de destinataires ayant lu
  unreadCount: number; // Nombre de destinataires non lus
  readRate: number; // Taux de lecture (0-1)
  averageReadTime: number; // Temps moyen de lecture en secondes
  clickCount: number; // Nombre de clics sur les liens
  completionRate: number; // Taux de complétion (0-1)
  fastestReadTime?: number; // Temps de lecture le plus rapide
  slowestReadTime?: number; // Temps de lecture le plus lent
  repliesCount?: number; // Nombre de réponses (Phase 5)
}

/**
 * Interface pour les préférences utilisateur (Phase 5)
 */
export interface UserMessagePreferences {
  userId: string; // Identifiant de l'utilisateur
  soundNotifications: boolean; // Notifications sonores
  reminderFrequency: "none" | "daily" | "weekly"; // Fréquence des rappels
  defaultViewMode: "list" | "grid"; // Mode d'affichage par défaut
  updatedAt: Date | Timestamp; // Date de dernière modification
}

/**
 * Interface pour un filtre sauvegardé (Phase 5)
 */
export interface SavedFilter {
  id: string; // Identifiant unique
  userId: string; // Propriétaire du filtre
  name: string; // Nom du filtre
  description?: string; // Description (optionnel)
  status?: MessageStatus[]; // Filtres par statut (optionnel)
  priority?: MessagePriority[]; // Filtres par priorité (optionnel)
  category?: MessageCategory[]; // Filtres par catégorie (optionnel)
  tags?: string[]; // Filtres par tags (optionnel)
  sortBy?: "createdAt" | "sentAt" | "readCount" | "priority"; // Ordre de tri
  sortOrder?: "asc" | "desc"; // Direction du tri
  createdAt: Date | Timestamp; // Date de création
}

/**
 * Type pour les options de création de message
 */
export interface CreateMessageInput {
  title: string;
  content: string;
  priority: MessagePriority;
  targetType: MessageTargetType;
  targetRole?: UserRole;
  targetUserId?: string;
  category?: MessageCategory;
  tags?: string[];
  images?: string[];
  videos?: string[];
  attachments?: MessageAttachment[];
  scheduledAt?: Date | Timestamp;
  awaitingReply?: boolean;
}

/**
 * Type pour les options de filtrage de messages
 */
export interface MessageFilters {
  status?: MessageStatus[];
  priority?: MessagePriority[];
  category?: MessageCategory[];
  tags?: string[];
  targetType?: MessageTargetType[];
  targetRole?: UserRole[];
  searchQuery?: string; // Recherche full-text
  dateFrom?: Date | Timestamp;
  dateTo?: Date | Timestamp;
  pinned?: boolean;
  awaitingReply?: boolean;
}

/**
 * Type pour les options de tri
 */
export interface MessageSortOptions {
  sortBy: "createdAt" | "sentAt" | "readCount" | "priority" | "title";
  sortOrder: "asc" | "desc";
}
