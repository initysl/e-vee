import { apiClient } from './client';
import {
  CheckoutRequest,
  CheckoutResponse,
  CheckoutSummary,
} from '@/types/checkout';

export const checkoutApi = {
  // Get checkout summary with calculated totals
  getSummary: async (): Promise<CheckoutSummary> => {
    try {
      const response = await apiClient.get<CheckoutSummary>(
        '/checkout/summary'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching checkout summary:', error);
      throw error;
    }
  },

  // Process checkout and place order
  process: async (checkoutData: CheckoutRequest): Promise<CheckoutResponse> => {
    try {
      const response = await apiClient.post<CheckoutResponse>(
        '/checkout/',
        checkoutData
      );
      return response.data;
    } catch (error) {
      console.error('Error processing checkout:', error);
      throw error;
    }
  },

  /**
   * Validate checkout data before submission
   */
  validateCheckout: (
    data: CheckoutRequest
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.shipping_address || data.shipping_address.trim().length < 10) {
      errors.push('Valid shipping address is required (minimum 10 characters)');
    }

    if (!data.payment_method) {
      errors.push('Payment method is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
