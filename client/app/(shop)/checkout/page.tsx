'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/hooks/useCheckout';
import { Card, CardContent } from '@/components/ui/card';
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
import { CheckCircle2, Loader2 } from 'lucide-react';
import { GiTakeMyMoney } from 'react-icons/gi';
import Link from 'next/link';
import Image from 'next/image';
import { CheckoutFormData } from '@/types/checkout';
import CheckOutSkeleton from '@/components/CheckOutSkeleton';
import { RiShoppingBag2Line } from 'react-icons/ri';

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

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (!cartLoading && cart && cart.item_count === 0) {
      router.push('/cart');
    }
  }, [cart, cartLoading, router]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<CheckoutFormData> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (
      !formData.shipping_address.trim() ||
      formData.shipping_address.length < 10
    ) {
      errors.shipping_address = 'Address must be at least 10 characters';
    }

    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zip_code.trim()) errors.zip_code = 'ZIP code is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

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
      return;
    }
  };

  // Loading state
  if (cartLoading || (!summary && loading)) {
    return <CheckOutSkeleton />;
  }

  // Success state
  if (orderResponse) {
    return (
      <div className='container mx-auto '>
        <div className='mx-auto text-center p-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-24 h-24 bg-linear-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center'>
              <CheckCircle2 className='w-12 h-12 text-green-600' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Order Placed Successfully!
          </h2>
          <p className='text-gray-600 mb-1'>
            Order ID:{' '}
            <span className='font-semibold'>{orderResponse.order_id}</span>
          </p>
          <p className='text-gray-500 text-sm mb-6'>{orderResponse.message}</p>

          <div className='p-6 mb-6'>
            <p className='text-sm text-gray-500 mb-2'>Order Total</p>
            <p className='text-gray-900 text-2xl font-semibold'>
              ${orderResponse.total.toFixed(2)}
            </p>
          </div>

          <Link href='/market'>
            <Button
              variant='outline'
              className='text-sm text-gray-500 cursor-pointer '
            >
              Shop Products
              <RiShoppingBag2Line className='ml-2' />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.item_count === 0) return null;

  return (
    <div className='container'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2'>
        <p className='text-gray-500'>Complete your purchase</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
        {/* Checkout Form */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Contact Information */}
          <Card className='shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4 sm:p-6'>
              <h3 className='text-base font-normal text-gray-900 mb-4'>
                Contact Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='email'>Email Address *</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
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
                    className={`mt-1 ${
                      formErrors.phone ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.phone && (
                    <p className='text-sm text-red-600 mt-1'>
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className='shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4 sm:p-6'>
              <h3 className='text-base font-normal text-gray-900 mb-4'>
                Shipping Address
              </h3>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='address'>Street Address *</Label>
                  <Input
                    id='address'
                    placeholder='123 Main St'
                    value={formData.shipping_address}
                    onChange={(e) =>
                      handleInputChange('shipping_address', e.target.value)
                    }
                    className={`mt-1 ${
                      formErrors.shipping_address ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.shipping_address && (
                    <p className='text-sm text-red-600 mt-1'>
                      {formErrors.shipping_address}
                    </p>
                  )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  <div>
                    <Label htmlFor='city'>City *</Label>
                    <Input
                      id='city'
                      placeholder='New York'
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                    />
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
                    />
                  </div>

                  <div>
                    <Label htmlFor='zip'>ZIP *</Label>
                    <Input
                      id='zip'
                      placeholder='10001'
                      value={formData.zip_code}
                      onChange={(e) =>
                        handleInputChange('zip_code', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className='shadow-sm hover:shadow-md transition-shadow'>
            <CardContent className='p-4 sm:p-6'>
              <h3 className='text-base font-normal text-gray-900 mb-4'>
                Payment Method
              </h3>

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

              <p className='text-xs text-gray-500 mt-2'>
                Payment processing is simulated for this demo
              </p>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg'>
              <p className='font-normal'>Error</p>
              <p className='text-sm'>{error}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <Card className='lg:sticky lg:top-20 border'>
            <CardContent className='p-4 sm:p-6'>
              <h2 className='text-lg font-semibold mb-4'>Order Summary</h2>

              <div className='space-y-3 max-h-48 overflow-y-auto'>
                {cart.items.map((item) => (
                  <div key={item.product_id} className='flex gap-3'>
                    <div className='relative w-14 h-14 rounded bg-blue-100 shrink-0'>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className='object-contain p-2'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm truncate'>{item.title}</p>
                      <p className='text-xs text-gray-500'>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className='text-sm font-semibold'>
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className='my-4' />

              {summary && (
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>

                  <div className='flex justify-between'>
                    <span>Shipping</span>
                    <span>
                      {summary.shipping === 0
                        ? 'FREE'
                        : `$${summary.shipping.toFixed(2)}`}
                    </span>
                  </div>

                  <div className='flex justify-between'>
                    <span>Tax</span>
                    <span>${summary.tax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className='flex justify-between font-semibold text-base'>
                    <span>Total</span>
                    <span>${summary.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isProcessing || loading}
                className='w-full mt-6 bg-blue-700 hover:bg-blue-600'
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
