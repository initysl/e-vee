'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Plus, Minus, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { IoStar } from 'react-icons/io5';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const quantity =
    cart?.items.find((item) => item.product_id === String(product.id))
      ?.quantity ?? 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    await addToCart(String(product.id), 1);
    setLoading(false);
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateQuantity(String(product.id), quantity + 1);
    setLoading(false);
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateQuantity(String(product.id), quantity - 1);
    setLoading(false);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className='group relative h-full hover:shadow-xl hover:rounded-2xl transition-all duration-300'>
        <div className='p-4'>
          {/* Image */}
          <div className='relative w-full h-48 mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden'>
            <Image
              src={product.image}
              alt={product.title}
              fill
              className='object-contain p-4 group-hover:scale-110 transition-transform duration-300'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />

            {/* Like */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setLiked(!liked);
              }}
              className='absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow'
            >
              <Heart
                className={`w-4 h-4 ${
                  liked ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>
          </div>

          {/* Info */}
          <h3 className='font-semibold text-sm line-clamp-2'>
            {product.title}
          </h3>

          <p className='text-xs text-gray-500 line-clamp-2 my-2'>
            {product.description}
          </p>

          {/* Rating & Reviews */}
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

          {/* Price + Actions */}
          <div className='flex items-center justify-between mt-4'>
            <span className='text-lg font-bold'>
              ${product.price.toFixed(2)}
            </span>

            {quantity === 0 ? (
              <Button
                size='sm'
                onClick={handleAdd}
                disabled={loading}
                className='rounded-full px-4'
              >
                <ShoppingCart className='w-4 h-4 mr-1' />
                Add
              </Button>
            ) : (
              <div className='flex items-center gap-2 bg-zinc-100 rounded-full px-2 py-1'>
                <button
                  onClick={handleDecrease}
                  disabled={loading}
                  className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-200'
                >
                  <Minus className='w-3 h-3' />
                </button>

                <span className='text-sm font-semibold w-4 text-center'>
                  {quantity}
                </span>

                <button
                  onClick={handleIncrease}
                  disabled={loading}
                  className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-zinc-200'
                >
                  <Plus className='w-3 h-3' />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
