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
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { GiTakeMyMoney } from 'react-icons/gi';
import Link from 'next/link';
import Image from 'next/image';
import { CheckoutFormData } from '@/types/checkout';
import CheckOutSkeleton from '@/components/CheckOutSkeleton';

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
  };

  // Loading state
  if (cartLoading || (!summary && loading)) {
    return <CheckOutSkeleton />;
  }

  // Success state
  if (orderResponse) {
    return (
      <div className='container mx-auto px-4 py-16'>
        <Card className='max-w-md mx-auto text-center p-12'>
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

          <div className='bg-linear-to-br from-gray-50 to-white rounded-lg p-6 mb-6'>
            <p className='text-sm text-gray-500 mb-2'>Order Total</p>
            <p className='text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              ${orderResponse.total.toFixed(2)}
            </p>
          </div>

          <Link href='/market'>
            <Button className='bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
              Continue Shopping
              <ArrowLeft className='ml-2 h-4 w-4 rotate-180' />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!cart || cart.item_count === 0) return null;

  return (
    <div className='container'>
      {/* Header */}
      <div className='flex items-center justify-between mb-2'>
        <div>
          <p className='text-gray-500 mt-1'>Complete your purchase</p>
        </div>
        {/* <Link href='/cart'>
          <Button variant='outline'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Cart
          </Button>
        </Link> */}
      </div>

      <div className='grid lg:grid-cols-3 gap-8'>
        {/* Checkout Form */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Contact Information Card */}
          <Card className='overflow-hidden hover:shadow-md shadow-sm transition-shadow'>
            <CardContent className='p-6'>
              <h3 className='text-md font-normal text-gray-900 mb-4'>
                Contact Information
              </h3>
              <div className='grid md:grid-cols-2 gap-4'>
                <div>
                  <Label
                    htmlFor='email'
                    className='text-sm font-normal text-gray-700'
                  >
                    Email Address *
                  </Label>
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
                  <Label
                    htmlFor='phone'
                    className='text-sm font-normal text-gray-700'
                  >
                    Phone Number *
                  </Label>
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

          {/* Shipping Address Card */}
          <Card className='overflow-hidden hover:shadow-md shadow-sm transition-shadow'>
            <CardContent className='p-6'>
              <h3 className='text-lg font-normal text-gray-900 mb-4'>
                Shipping Address
              </h3>
              <div className='space-y-4'>
                <div>
                  <Label
                    htmlFor='address'
                    className='text-sm font-normal text-gray-700'
                  >
                    Street Address *
                  </Label>
                  <Input
                    id='address'
                    placeholder='123 Main St, Apt 4B'
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

                <div className='grid grid-cols-6 gap-4'>
                  <div className='col-span-3'>
                    <Label
                      htmlFor='city'
                      className='text-sm font-normal text-gray-700'
                    >
                      City *
                    </Label>
                    <Input
                      id='city'
                      placeholder='New York'
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                      className={`mt-1 ${
                        formErrors.city ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.city && (
                      <p className='text-sm text-red-600 mt-1'>
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div className='col-span-1'>
                    <Label
                      htmlFor='state'
                      className='text-sm font-normal text-gray-700'
                    >
                      State *
                    </Label>
                    <Input
                      id='state'
                      placeholder='NY'
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange('state', e.target.value)
                      }
                      className={`mt-1 ${
                        formErrors.state ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.state && (
                      <p className='text-sm text-red-600 mt-1'>
                        {formErrors.state}
                      </p>
                    )}
                  </div>

                  <div className='col-span-2'>
                    <Label
                      htmlFor='zip'
                      className='text-sm font-normal text-gray-700'
                    >
                      ZIP Code *
                    </Label>
                    <Input
                      id='zip'
                      placeholder='10001'
                      value={formData.zip_code}
                      onChange={(e) =>
                        handleInputChange('zip_code', e.target.value)
                      }
                      className={`mt-1 ${
                        formErrors.zip_code ? 'border-red-500' : ''
                      }`}
                    />
                    {formErrors.zip_code && (
                      <p className='text-sm text-red-600 mt-1'>
                        {formErrors.zip_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Card */}
          <Card className='overflow-hidden hover:shadow-md shadow-sm transition-shadow'>
            <CardContent className='p-6'>
              <h3 className='text-lg font-normal text-gray-900 mb-4'>
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
              <p className='text-sm text-gray-500 mt-2'>
                💡 Payment processing is simulated for this demo
              </p>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
              <p className='font-normal'>Error</p>
              <p className='text-sm'>{error}</p>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-20 bg-white border-2'>
            <CardContent className='p-6'>
              <h2 className='text-xl font-bold text-gray-900 mb-4'>
                Order Summary
              </h2>

              {/* Cart Items Preview */}
              <div className='max-h-48 overflow-y-auto space-y-3 mb-4'>
                {cart.items.map((item) => (
                  <div key={item.product_id} className='flex gap-3'>
                    <div className='relative w-16 h-16 rounded-lg bg-linear-to-br from-blue-100 to-purple-100 overflow-hidden shrink-0'>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className='object-contain p-2'
                        sizes='64px'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-normal text-gray-900 truncate'>
                        {item.title}
                      </p>
                      <p className='text-xs text-gray-500'>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className='text-sm font-semibold text-gray-900'>
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className='my-4' />

              {/* Totals */}
              {summary && (
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm text-gray-600'>
                    <span>Subtotal</span>
                    <span className='font-semibold'>
                      ${summary.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className='flex justify-between text-sm text-gray-600'>
                    <span>Shipping</span>
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

                  <div className='flex justify-between text-sm text-gray-600'>
                    <span>Tax (8%)</span>
                    <span className='font-semibold'>
                      ${summary.tax.toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  <div className='flex justify-between items-center text-md font-normal text-gray-900'>
                    <span>Total</span>
                    <span className='text-gray-900 font-semibold'>
                      ${summary.total.toFixed(2)}
                    </span>
                  </div>

                  {summary.subtotal < 50 && (
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700'>
                      💡 Add ${(50 - summary.subtotal).toFixed(2)} more for free
                      shipping!
                    </div>
                  )}
                </div>
              )}

              {/* Place Order Button */}
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || loading}
                className='bg-blue-700 hover:bg-blue-600 cursor-pointer w-full text-sm shadow-lg hover:shadow-xl transition-all mt-6'
              >
                {isProcessing ? (
                  <>
                    <Loader2 className='mr-2 animate-spin' size={16} />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order
                    <GiTakeMyMoney className='ml-2' size={16} />
                  </>
                )}
              </Button>

              <p className='text-xs text-gray-500 text-center mt-4'>
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
