import { apiClient } from './client';
import { Product, ProductSearchResponse } from '@/types/product';

export const productsApi = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products/');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get product by ID
  getById: async (id: number): Promise<Product> => {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Get products by category
  getByCategory: async (category: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>(
        `/products/category/${category}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw error;
    }
  },

  // Search products by query
  search: async (query: string): Promise<ProductSearchResponse> => {
    try {
      const response = await apiClient.get<ProductSearchResponse>(
        `/products/search/${query}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error searching products with query "${query}":`, error);
      throw error;
    }
  },
};
