/**
 * Store Zustand pour l'état partagé de l'assistant IA
 * Utilisé par AssistantDrawer et la page outils pour partager exactement le même état
 */

import { create } from "zustand";
import { ImageFile } from "./image-utils";
import { ProcessedFile } from "./file-processing";

/**
 * Machine d'état pour gérer le flux de conversation
 */
export type StateMachine =
  | "idle" // Aucune session lancée - afficher bouton "👋 Bonjour"
  | "started" // Session lancée - afficher menu rôles
  | "roleSelected" // Rôle sélectionné - afficher menu modes (sous-boutons)
  | "modeActive" // Mode actif - chat guidé avec prompts spécialisés
  | "freeChat"; // Chat libre - coreKnowledge uniquement

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[]; // Base64 data URLs
  files?: { name: string; type: string; content?: string; error?: string }[];
  timestamp: Date;
}

interface AssistantState {
  // State machine
  stateMachine: StateMachine;
  setStateMachine: (state: StateMachine) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;

  // Sélections
  selectedRoleId: string | null;
  setSelectedRoleId: (roleId: string | null) => void;
  selectedModeId: string | null;
  setSelectedModeId: (modeId: string | null) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Images & Files
  selectedImages: ImageFile[];
  setSelectedImages: (images: ImageFile[] | ((prev: ImageFile[]) => ImageFile[])) => void;
  selectedFiles: ProcessedFile[];
  setSelectedFiles: (files: ProcessedFile[] | ((prev: ProcessedFile[]) => ProcessedFile[])) => void;

  // UI State (pour coordonner l'ouverture/fermeture du drawer)
  isOpenDrawer: boolean;
  setIsOpenDrawer: (open: boolean) => void;

  // Actions globales
  resetConversation: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  // State machine
  stateMachine: "idle",
  setStateMachine: (state) => set({ stateMachine: state }),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    })),
  clearMessages: () => set({ messages: [] }),

  // Sélections
  selectedRoleId: null,
  setSelectedRoleId: (roleId) => set({ selectedRoleId: roleId }),
  selectedModeId: null,
  setSelectedModeId: (modeId) => set({ selectedModeId: modeId }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Images & Files
  selectedImages: [],
  setSelectedImages: (images) =>
    set((state) => ({
      selectedImages: typeof images === "function" ? images(state.selectedImages) : images,
    })),
  selectedFiles: [],
  setSelectedFiles: (files) =>
    set((state) => ({
      selectedFiles: typeof files === "function" ? files(state.selectedFiles) : files,
    })),

  // UI State
  isOpenDrawer: false,
  setIsOpenDrawer: (open) => set({ isOpenDrawer: open }),

  // Actions globales
  resetConversation: () =>
    set({
      stateMachine: "idle",
      messages: [],
      selectedRoleId: null,
      selectedModeId: null,
      selectedImages: [],
      selectedFiles: [],
      isLoading: false,
    }),
}));

