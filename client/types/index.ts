// Product types
export type { Product, ProductSearchResponse } from './product';

// Cart types
export type {
  Cart,
  CartItem,
  AddToCartRequest,
  UpdateQuantityRequest,
  AddToCartResponse,
  RemoveFromCartResponse,
  ClearCartResponse,
} from './cart';

// Chatbot types
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatMetadata,
  ChatHistory,
} from './chatbot';

// Checkout types
export type {
  CheckoutRequest,
  CheckoutResponse,
  CheckoutSummary,
  CheckoutFormData,
  PaymentMethod,
} from './checkout';

// Common utility types
export interface ApiError {
  detail: string;
  status: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  loading: boolean;
}
