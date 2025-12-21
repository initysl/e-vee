import { CartItem } from './cart';

export interface CheckoutRequest {
  email: string;
  phone: string;
  shipping_address: string;
  payment_method: string;
}

export interface CheckoutResponse {
  order_id: string;
  total: number;
  message: string;
  estimated_delivery: string;
}

export interface CheckoutSummary {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  item_count: number;
}

export type PaymentMethod =
  | 'credit_card'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay';

export interface CheckoutFormData {
  email: string;
  phone: string;
  shipping_address: string;
  city: string;
  state: string;
  zip_code: string;
  payment_method: PaymentMethod;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
}
