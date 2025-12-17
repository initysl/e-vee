'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/hooks/useCheckout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { CheckoutFormData } from '@/types/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading } = useCart();
  const {
    summary,
    loading,
    error,
    orderResponse,
    fetchSummary,
    processCheckout,
  } = useCheckout();

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    phone: '',
    shipping_address: '',
    city: '',
    state: '',
    zip_code: '',
    payment_method: 'credit_card',
  });

  const [formErrors, setFormErrors] = useState<Partial<CheckoutFormData>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch checkout summary on mount
  useEffect(() => {
    fetchSummary();
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && cart && cart.item_count === 0) {
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<CheckoutFormData> = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    // Address validation
    if (
      !formData.shipping_address.trim() ||
      formData.shipping_address.length < 10
    ) {
      errors.shipping_address = 'Address must be at least 10 characters';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.zip_code.trim()) {
      errors.zip_code = 'ZIP code is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    const checkoutData = {
      email: formData.email,
      phone: formData.phone,
      shipping_address: `${formData.shipping_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`,
      payment_method: formData.payment_method,
    };

    const success = await processCheckout(checkoutData);

    setIsProcessing(false);

    if (success) {
      // Order placed successfully - show success state
      // The orderResponse is now set in the useCheckout hook
    }
  };

  // Loading state
  if (cartLoading || (!summary && loading)) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center h-64'>
          <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
        </div>
      </div>
    );
  }

  // Success state
  if (orderResponse) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card className='max-w-2xl mx-auto text-center p-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center'>
              <CheckCircle2 className='w-12 h-12 text-green-600' />
            </div>
          </div>

          <h2 className='text-3xl font-bold text-gray-900 mb-4'>
            Order Placed Successfully!
          </h2>

          <p className='text-gray-600 mb-2'>
            Order ID:{' '}
            <span className='font-semibold'>{orderResponse.order_id}</span>
          </p>

          <p className='text-gray-600 mb-6'>{orderResponse.message}</p>

          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <p className='text-sm text-gray-600 mb-2'>Order Total</p>
            <p className='text-3xl font-bold text-blue-600'>
              ${orderResponse.total.toFixed(2)}
            </p>
          </div>

          <div className='flex gap-4 justify-center'>
            <Link href='/market'>
              <Button variant='outline'>Continue Shopping</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Empty cart redirect (shouldn't reach here due to useEffect)
  if (!cart || cart.item_count === 0) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <Link href='/cart'>
          <Button variant='ghost' className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Cart
          </Button>
        </Link>
        <h1 className='text-3xl font-bold text-gray-900'>Checkout</h1>
      </div>

      <div className='grid lg:grid-cols-3 gap-8'>
        {/* Checkout Form */}
        <div className='lg:col-span-2'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='email'>Email Address *</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className='text-sm text-red-600 mt-1'>
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='phone'>Phone Number *</Label>
                  <Input
                    id='phone'
                    type='tel'
                    placeholder='+1 (555) 000-0000'
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && (
                    <p className='text-sm text-red-600 mt-1'>
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='address'>Street Address *</Label>
                  <Input
                    id='address'
                    placeholder='123 Main St, Apt 4B'
                    value={formData.shipping_address}
                    onChange={(e) =>
                      handleInputChange('shipping_address', e.target.value)
                    }
                    className={
                      formErrors.shipping_address ? 'border-red-500' : ''
                    }
                  />
                  {formErrors.shipping_address && (
                    <p className='text-sm text-red-600 mt-1'>
                      {formErrors.shipping_address}
                    </p>
                  )}
                </div>

                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='city'>City *</Label>
                    <Input
                      id='city'
                      placeholder='New York'
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                      className={formErrors.city ? 'border-red-500' : ''}
                    />
                    {formErrors.city && (
                      <p className='text-sm text-red-600 mt-1'>
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='state'>State *</Label>
                    <Input
                      id='state'
                      placeholder='NY'
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange('state', e.target.value)
                      }
                      className={formErrors.state ? 'border-red-500' : ''}
                    />
                    {formErrors.state && (
                      <p className='text-sm text-red-600 mt-1'>
                        {formErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor='zip'>ZIP Code *</Label>
                  <Input
                    id='zip'
                    placeholder='10001'
                    value={formData.zip_code}
                    onChange={(e) =>
                      handleInputChange('zip_code', e.target.value)
                    }
                    className={formErrors.zip_code ? 'border-red-500' : ''}
                  />
                  {formErrors.zip_code && (
                    <p className='text-sm text-red-600 mt-1'>
                      {formErrors.zip_code}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) =>
                    handleInputChange('payment_method', value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select payment method' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='credit_card'>Credit Card</SelectItem>
                    <SelectItem value='paypal'>PayPal</SelectItem>
                    <SelectItem value='apple_pay'>Apple Pay</SelectItem>
                    <SelectItem value='google_pay'>Google Pay</SelectItem>
                  </SelectContent>
                </Select>
                <p className='text-sm text-gray-500 mt-2'>
                  Payment processing is simulated for this demo
                </p>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                <p className='font-semibold'>Error</p>
                <p className='text-sm'>{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-24'>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Items */}
              <div className='space-y-3'>
                {cart.items.map((item) => (
                  <div
                    key={item.product_id}
                    className='flex justify-between text-sm'
                  >
                    <span className='text-gray-600'>
                      {item.title.substring(0, 30)}... x{item.quantity}
                    </span>
                    <span className='font-semibold'>
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              {summary && (
                <>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Subtotal</span>
                    <span className='font-semibold'>
                      ${summary.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Shipping</span>
                    <span
                      className={`font-semibold ${
                        summary.shipping === 0 ? 'text-green-600' : ''
                      }`}
                    >
                      {summary.shipping === 0
                        ? 'FREE'
                        : `$${summary.shipping.toFixed(2)}`}
                    </span>
                  </div>

                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Tax</span>
                    <span className='font-semibold'>
                      ${summary.tax.toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  <div className='flex justify-between text-lg font-bold'>
                    <span>Total</span>
                    <span className='text-2xl bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                      ${summary.total.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {/* Place Order Button */}
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || loading}
                className='w-full h-12 text-lg bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-4'
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className='mr-2 h-5 w-5' />
                    Place Order
                  </>
                )}
              </Button>

              <p className='text-xs text-gray-500 text-center'>
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
