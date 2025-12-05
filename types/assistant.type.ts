import { LucideIcon } from "lucide-react";

export type AssistantCategory =
  | "auto"
  | "mrh"
  | "pj"
  | "gav"
  | "particulier"
  | "pro"
  | "sante";

export interface CategoryConfig {
  id: AssistantCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  description?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  category?: AssistantCategory;
}

export interface ChatRequest {
  message: string;
  category?: AssistantCategory;
  theme?: "retail" | "pro" | "specialized";
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  error?: string;
}

export interface AssistantState {
  messages: ChatMessage[];
  isLoading: boolean;
  selectedCategory: AssistantCategory | null;
  showCategories: boolean;
}

