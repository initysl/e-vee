'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hasSession } from '@/lib/session';

interface SessionGuardProps {
  children: React.ReactNode;
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if already on landing page
    if (pathname === '/') return;

    // Check if user has session
    if (!hasSession()) {
      console.log('No session found. Redirecting to landing page...');
      router.push('/');
    }
  }, [pathname, router]);

  // If no session and not on landing page, show nothing (will redirect)
  if (pathname !== '/' && !hasSession()) {
    return null;
  }

  return <>{children}</>;
}
