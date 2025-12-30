'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { RiShoppingBag2Line } from 'react-icons/ri';
import CartSkeleton from '@/components/CartSkeleton';

export default function CartPage() {
  const { cart, loading, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number
  ) => {
    setUpdatingItems((prev) => new Set(prev).add(productId));
    try {
      await updateQuantity(productId, newQuantity);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemove = async (productId: string) => {
    if (confirm('Remove this item from cart?')) {
      await removeFromCart(productId);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Clear all items from cart?')) {
      await clearCart();
    }
  };

  // Loading State
  if (loading) {
    return (
      <>
        <CartSkeleton />
      </>
    );
  }

  // Empty Cart State
  if (!loading && (!cart || cart.item_count === 0)) {
    return (
      <div className='container mx-auto px-4 py-16'>
        <div className='max-w-md mx-auto text-center p-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-24 h-24 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center'>
              <ShoppingBag className='w-12 h-12 text-gray-400' />
            </div>
          </div>
          <h2 className='text-xl  text-gray-900 mb-2'>Your cart is empty</h2>
          <p className='text-gray-500 mb-6'>
            Add some products to get started!
          </p>
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

  return (
    <div className='container'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <p className='text-gray-500 mt-1'>
            {cart?.item_count} {cart?.item_count === 1 ? 'item' : 'items'} in
            your cart
          </p>
        </div>
        <Button
          variant='outline'
          onClick={handleClearCart}
          className='text-red-600 hover:text-red-700 hover:bg-red-50'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Clear Cart
        </Button>
      </div>

      <div className='grid lg:grid-cols-3 gap-8 '>
        {/* Cart Items */}
        <div className='lg:col-span-2 space-y-4 '>
          {cart?.items.map((item) => (
            <div
              key={item.product_id}
              className='overflow-hidden hover:shadow-md rounded-2xl shadow-sm transition-shadow'
            >
              <div className='w-full'>
                <div className='flex flex-col gap-4 p-4 md:flex-row md:gap-4'>
                  {/* Product Image */}
                  <div className='relative w-full h-40 md:w-32 md:h-32 shrink-0 rounded-lg bg-linear-to-br from-blue-100 to-purple-100 overflow-hidden'>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className='object-contain p-3'
                      sizes='(max-width: 768px) 100vw, 128px'
                    />
                  </div>

                  {/* Product Info */}
                  <div className='flex flex-col justify-between flex-1'>
                    <div>
                      <h3 className='font-semibold text-sm md:text-base line-clamp-2'>
                        {item.title}
                      </h3>
                      <p className='text-base md:text-lg font-normal text-gray-500 mt-1'>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity + Remove */}
                    <div className='flex items-center justify-between mt-4 md:mt-6'>
                      <div className='flex items-center gap-2 bg-zinc-100 rounded-full px-3 py-1'>
                        <button
                          className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 disabled:opacity-50'
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product_id,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            item.quantity <= 1 ||
                            updatingItems.has(item.product_id)
                          }
                        >
                          <Minus className='h-4 w-4' />
                        </button>

                        <span className='text-sm font-semibold w-6 text-center'>
                          {item.quantity}
                        </span>

                        <button
                          className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 disabled:opacity-50'
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product_id,
                              item.quantity + 1
                            )
                          }
                          disabled={updatingItems.has(item.product_id)}
                        >
                          <Plus className='h-4 w-4' />
                        </button>
                      </div>

                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemove(item.product_id)}
                        className='text-red-600 hover:text-red-700 hover:bg-red-50'
                      >
                        <Trash2 className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className='flex justify-between items-center md:flex-col md:items-end md:justify-between'>
                    <p className='text-sm text-gray-500 md:mb-1'>Subtotal</p>
                    <p className='font-semibold text-gray-900 text-base'>
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className='lg:col-span-1'>
          <div className='sticky top-20 bg-white border-2 rounded-2xl'>
            <div className='p-6'>
              <h2 className='text-md font-normal text-gray-900 mb-6'>
                Order Summary
              </h2>

              <div className='space-y-4'>
                <div className='flex justify-between text-sm'>
                  <span className='font-normal text-gray-600'>Subtotal</span>
                  <span className='font-semibold'>
                    ${cart?.total.toFixed(2)}
                  </span>
                </div>

                <div className='flex justify-between text-sm'>
                  <span className='font-normal text-gray-600'>Shipping</span>
                  <span className='font-normal text-green-600'>
                    {cart && cart.total > 50 ? 'FREE' : '$5.99'}
                  </span>
                </div>

                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600 font-normal'>Tax (8%)</span>
                  <span className='font-normal'>
                    ${cart ? (cart.total * 0.08).toFixed(2) : '0.00'}
                  </span>
                </div>

                <Separator />

                <div className='flex justify-between items-center text-md font-normal text-gray-900'>
                  <span>Total</span>
                  <span className='text-gray-900 font-semibold'>
                    $
                    {cart
                      ? (
                          cart.total +
                          (cart.total > 50 ? 0 : 5.99) +
                          cart.total * 0.08
                        ).toFixed(2)
                      : '0.00'}
                  </span>
                </div>

                {cart && cart.total < 50 && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700'>
                    Add ${(50 - cart.total).toFixed(2)} more for free shipping!
                  </div>
                )}
                <div className='flex flex-col gap-5'>
                  <Link href='/checkout'>
                    <Button className='bg-blue-700 hover:bg-blue-600 cursor-pointer w-full text-sm shadow-lg hover:shadow-xl transition-all'>
                      Proceed to Checkout
                      <ArrowRight className='ml-2' />
                    </Button>
                  </Link>

                  <Link href='/market'>
                    <Button
                      variant='outline'
                      className='text-sm cursor-pointer w-full'
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
