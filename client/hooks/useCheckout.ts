'use client';

import { useState } from 'react';
import {
  CheckoutSummary,
  CheckoutRequest,
  CheckoutResponse,
} from '@/types/checkout';
import { checkoutApi } from '@/lib/api';

export const useCheckout = () => {
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResponse, setOrderResponse] = useState<CheckoutResponse | null>(
    null
  );

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkoutApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Failed to fetch checkout summary'
      );
      console.error('Error fetching checkout summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const processCheckout = async (
    checkoutData: CheckoutRequest
  ): Promise<boolean> => {
    // Validate first
    const validation = checkoutApi.validateCheckout(checkoutData);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await checkoutApi.process(checkoutData);
      setOrderResponse(response);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to process checkout');
      console.error('Error processing checkout:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetCheckout = () => {
    setSummary(null);
    setOrderResponse(null);
    setError(null);
  };

  return {
    summary,
    loading,
    error,
    orderResponse,
    fetchSummary,
    processCheckout,
    resetCheckout,
  };
};
