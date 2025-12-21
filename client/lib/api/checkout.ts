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
      console.log('[Checkout API] Sending request:', checkoutData);

      const response = await apiClient.post<CheckoutResponse>(
        '/checkout/process', // Fixed: added /process
        checkoutData
      );

      console.log('[Checkout API] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[Checkout API] Error:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to process checkout';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
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

    if (!data.phone || data.phone.trim().length < 10) {
      errors.push('Valid phone number is required (minimum 10 digits)');
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
