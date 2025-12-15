import { apiClient } from './client';
import {
  Cart,
  AddToCartRequest,
  UpdateQuantityRequest,
  AddToCartResponse,
  RemoveFromCartResponse,
  ClearCartResponse,
} from '@/types/cart';

export const cartApi = {
  // Get current cart
  get: async (): Promise<Cart> => {
    try {
      const response = await apiClient.get<Cart>('/cart');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Add item to cart
  add: async (
    productId: string,
    quantity: number = 1
  ): Promise<AddToCartResponse> => {
    try {
      const request: AddToCartRequest = {
        product_id: productId,
        quantity,
      };
      const response = await apiClient.post<AddToCartResponse>(
        '/cart/add',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Remove item from cart
  remove: async (productId: string): Promise<RemoveFromCartResponse> => {
    try {
      const response = await apiClient.delete<RemoveFromCartResponse>(
        `/cart/remove/${productId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Update item quantity in cart
  updateQuantity: async (
    productId: string,
    quantity: number
  ): Promise<AddToCartResponse> => {
    try {
      const request: UpdateQuantityRequest = {
        product_id: productId,
        quantity,
      };
      const response = await apiClient.put<AddToCartResponse>(
        '/cart/update',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  },

  // Clear cart
  clear: async (): Promise<ClearCartResponse> => {
    try {
      const response = await apiClient.delete<ClearCartResponse>('/cart/clear');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Get cart item count (convenience method)
  getItemCount: async (): Promise<number> => {
    try {
      const cart = await cartApi.get();
      return cart.item_count;
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  },
};
