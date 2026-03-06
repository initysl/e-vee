import { Cart } from './cart';
import { Product } from './product';

export interface ChatSuggestion {
  label: string;
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
  action?: string;
  metadata?: ChatMetadata;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  intent: string;
  metadata?: ChatMetadata;
  action?: string;
}

export interface ChatMetadata {
  cart?: Cart;
  product?: Product;
  products?: Product[];
  checkout_ready?: boolean;
  action?: string;
  suggestions?: ChatSuggestion[];
  added_products?: Product[];
  removed_products?: Product[];
  failed_products?: string[];
  query_used?: string;
  [key: string]: any;
}

export interface ChatHistory {
  messages: ChatMessage[];
  isLoading: boolean;
}
