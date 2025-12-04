/**
 * Types pour le système de gestion des tags
 */

export interface Tag {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface CreateTagInput {
  name: string;
  emoji: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  emoji?: string;
  color?: string;
}

