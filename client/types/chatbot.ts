import { Cart } from './cart';
import { Product } from './product';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  intent: string;
  metadata?: ChatMetadata;
}

export interface ChatMetadata {
  cart?: Cart;
  product?: Product;
  results?: any[];
  checkout_ready?: boolean;
  [key: string]: any;
}

// For displaying chat history
export interface ChatHistory {
  messages: ChatMessage[];
  isLoading: boolean;
}
