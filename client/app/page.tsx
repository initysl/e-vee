'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    let sessionId = localStorage.getItem('sessionId');

    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('sessionId', sessionId);
    }

    router.push('/market');
  };

  const products = [
    { id: 1, image: '/products/shoe.jpg', name: 'Shoe' },
    { id: 2, image: '/products/watch.jpg', name: 'Watch' },
    { id: 3, image: '/products/headphone.jpg', name: 'Headphone' },
    { id: 4, image: '/products/bag.jpg', name: 'Bag' },
    { id: 5, image: '/products/jewelry.jpg', name: 'Jewelry' },
    { id: 6, image: '/products/laptop.jpg', name: 'Laptop' },
    { id: 7, image: '/products/camera.jpg', name: 'Camera' },
    { id: 8, image: '/products/glasses.jpg', name: 'Glasses' },
  ];

  return (
    <div className='min-h-screen flex items-center justify-center bg-white font-sans px-4'>
      <main className='space-y-10 w-full max-w-4xl px-6 py-24 text-left'>
        <h1 className='text-4xl sm:text-5xl font-bold text-zinc-900'>
          Welcome to <span className='text-blue-600'>ShopHub</span>
        </h1>
        <div className='flex items-center'>
          {products.map((product, index) => (
            <div
              key={product.id}
              className='shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-white shadow-md transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl relative cursor-pointer'
              style={{
                marginLeft: index === 0 ? '0' : '-32px',
                zIndex: products.length - index,
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                className='w-full h-full object-cover'
              />
            </div>
          ))}
        </div>

        <p className='mt-10 text-lg text-zinc-600 max-w-xl'>
          Enjoy a seamless shopping experience with ShopHub — Coupled with
          <span className='font-semibold text-zinc-800'> E-Vee</span>, your
          AI-powered chatbot shopping assistant.
        </p>

        <div>
          <Button
            onClick={handleGetStarted}
            className='cursor-pointer bg-transparent border border-zinc-400 text-zinc-800 rounded-sm hover:bg-zinc-200 transition'
          >
            Get Started
          </Button>
        </div>
      </main>
    </div>
  );
}
