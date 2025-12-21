'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { createSession, getSession } from '@/lib/session'; // Import the utility
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    let sessionId = getSession();
    if (!sessionId) {
      sessionId = uuidv4();
      createSession(sessionId);
      console.log('New session created:', sessionId);
    } else {
      console.log('Using existing session:', sessionId);
    }

    router.push('/market');
  };

  const products = [
    { id: 1, image: '/products/shoe.jpg', title: 'Shoe' },
    { id: 2, image: '/products/watch.jpg', title: 'Watch' },
    { id: 3, image: '/products/headphone.jpg', title: 'Headphone' },
    { id: 4, image: '/products/bag.jpg', title: 'Bag' },
    { id: 5, image: '/products/jewelry.jpg', title: 'Jewelry' },
    { id: 6, image: '/products/laptop.jpg', title: 'Laptop' },
    { id: 7, image: '/products/camera.jpg', title: 'Camera' },
    { id: 8, image: '/products/glasses.jpg', title: 'Glasses' },
  ];

  return (
    <div className='min-h-screen flex items-center justify-center bg-white font-sans'>
      <main className='space-y-10 w-full max-w-5xl px-6 text-left'>
        <h1 className='text-4xl sm:text-5xl font-bold text-zinc-900'>
          Welcome to <span className='text-blue-600'>ShopHub</span>
        </h1>
        <div className='flex items-center'>
          {products.map((product, index) => (
            <div
              key={product.id}
              className='shrink-0 w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-white shadow-md transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl relative cursor-pointer'
              style={{
                marginLeft: index === 0 ? '0' : '-32px',
                zIndex: products.length - index,
              }}
            >
              <Image
                src={product.image}
                alt={product.title}
                width={80}
                height={80}
                priority
                className='w-full h-full object-cover'
              />
            </div>
          ))}
        </div>

        <p className='mt-10 text-lg text-zinc-600 max-w-xl'>
          Coupled with a RAG-powered shopping assistance chatbot
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
