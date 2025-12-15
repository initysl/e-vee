'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types/product';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { IoStar } from 'react-icons/io5';
import { IoArrowBackCircleOutline } from 'react-icons/io5';
import { productsApi } from '@/lib/api/products';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { cart, addToCart, updateQuantity } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const quantity =
    cart?.items.find((item) => item.product_id === id)?.quantity ?? 0;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getById(Number(id));
      setProduct(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setActionLoading(true);
    await addToCart(id, 1);
    setActionLoading(false);
  };

  const handleIncrease = async () => {
    setActionLoading(true);
    await updateQuantity(id, quantity + 1);
    setActionLoading(false);
  };

  const handleDecrease = async () => {
    setActionLoading(true);
    await updateQuantity(id, quantity - 1);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className='container py-20 text-center text-muted-foreground'>
        Loading product…
      </div>
    );
  }

  if (!product) {
    return <div className='container py-20 text-center'>Product not found</div>;
  }

  return (
    <div className='container'>
      <Link
        href='/market'
        className='fixed top-70 left-4 z-50 transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-105'
      >
        <IoArrowBackCircleOutline
          size={30}
          className='text-gray-700 hover:text-blue-600'
        />
      </Link>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
        {/* Animated Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='relative rounded-2xl overflow-hidden'
        >
          {/* Animated gradient background */}
          <motion.div
            className='absolute inset-0 '
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          />

          {/* Floating product image */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className='relative z-10 p-6 flex items-center justify-center'
          >
            <Image
              src={product.image}
              alt={product.title}
              width={300}
              height={300}
              className='object-contain drop-shadow-xl'
              priority
            />
          </motion.div>
        </motion.div>

        {/* Info */}
        <div className='flex flex-col'>
          <h1 className='text-2xl font-bold'>{product.title}</h1>

          {/* Rating */}
          {product.rating && (
            <div className='flex items-center gap-2 mt-2'>
              <div className='flex items-center gap-1'>
                <IoStar className='text-yellow-500 w-4 h-4' />
                <span className='text-sm font-semibold text-gray-900'>
                  {product.rating.rate}
                </span>
              </div>
              <span className='text-xs text-gray-400'>
                ({product.rating.count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className='text-3xl font-bold mt-4'>
            ${product.price.toFixed(2)}
          </div>

          {/* Description */}
          <p className='text-muted-foreground mt-4 leading-relaxed'>
            {product.description}
          </p>

          {/* Actions */}
          <div className='mt-8 flex items-center gap-4'>
            {quantity === 0 ? (
              <Button
                size='lg'
                onClick={handleAdd}
                disabled={actionLoading}
                className='rounded-full px-8'
              >
                <ShoppingCart className='w-5 h-5 mr-2' />
                Add to Cart
              </Button>
            ) : (
              <div className='flex items-center gap-3 bg-zinc-100 rounded-full px-4 py-2'>
                <button
                  onClick={handleDecrease}
                  disabled={actionLoading}
                  className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200'
                >
                  <Minus className='w-4 h-4' />
                </button>

                <span className='font-semibold w-6 text-center'>
                  {quantity}
                </span>

                <button
                  onClick={handleIncrease}
                  disabled={actionLoading}
                  className='w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-200'
                >
                  <Plus className='w-4 h-4' />
                </button>
              </div>
            )}

            <Link href='/checkout'>
              <Button variant='outline' size='lg'>
                Go to Checkout
              </Button>
            </Link>
          </div>

          {/* Extras */}
          <div className='mt-10 border-t pt-6 text-sm text-muted-foreground'>
            <p>• Secure checkout</p>
            <p>• Fast delivery</p>
            <p>• AI assistance available via E-VEE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
