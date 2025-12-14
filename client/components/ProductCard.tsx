'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation

    try {
      setAdding(true);
      await addToCart(String(product.id), 1);
      // Optional: Show success toast
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Optional: Show error toast
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className='h-full hover:shadow-lg transition-shadow cursor-pointer'>
        <CardContent className='p-4'>
          <div className='relative w-full h-48 mb-4'>
            <Image
              src={product.image}
              alt={product.title}
              fill
              className='object-contain'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          </div>

          <h3 className='font-semibold text-lg mb-2 line-clamp-2 min-h-14'>
            {product.title}
          </h3>

          <p className='text-gray-600 text-sm mb-2 line-clamp-2'>
            {product.description}
          </p>

          <div className='flex items-center justify-between mt-4'>
            <span className='text-2xl font-bold text-blue-600'>
              ${product.price.toFixed(2)}
            </span>

            {product.rating && (
              <div className='flex items-center gap-1 text-sm text-gray-600'>
                <span>⭐</span>
                <span>{product.rating.rate}</span>
                <span className='text-gray-400'>({product.rating.count})</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='p-4 pt-0'>
          <Button
            onClick={handleAddToCart}
            disabled={adding}
            className='w-full'
            variant='default'
          >
            <ShoppingCart className='mr-2 h-4 w-4' />
            {adding ? 'Adding...' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
