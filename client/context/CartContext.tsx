'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Cart, CartItem } from '@/types/cart';
import { cartApi } from '@/lib/api';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount
  useEffect(() => {
    refreshCart();
  }, []);

  const refreshCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartApi.get();
      setCart(cartData);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch cart');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.add(productId, quantity);
      setCart(response.cart);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to add item to cart');
      console.error('Error adding to cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.remove(productId);
      setCart(response.cart);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Failed to remove item from cart'
      );
      console.error('Error removing from cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.updateQuantity(productId, quantity);
      setCart(response.cart);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update quantity');
      console.error('Error updating quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.clear();
      setCart(response.cart);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to clear cart');
      console.error('Error clearing cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getItemCount = (): number => {
    return cart?.item_count || 0;
  };

  const getTotal = (): number => {
    return cart?.total || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        refreshCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
