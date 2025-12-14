export interface CartItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export interface Cart {
  session_id: string;
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateQuantityRequest {
  product_id: string;
  quantity: number;
}

export interface AddToCartResponse {
  message: string;
  cart: Cart;
}

export interface RemoveFromCartResponse {
  message: string;
  cart: Cart;
}

export interface ClearCartResponse {
  message: string;
  cart: Cart;
}
