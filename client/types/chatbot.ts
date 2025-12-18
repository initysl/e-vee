import { Cart } from './cart';
import { Product } from './product';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
  action?: string;
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
  results?: any[];
  checkout_ready?: boolean;
  action?: string;
  added_products?: any[];
  removed_products?: any[];
  failed_products?: string[];
  [key: string]: any;
}

export interface ChatHistory {
  messages: ChatMessage[];
  isLoading: boolean;
}
