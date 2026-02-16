'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      if (isAuthenticated) {
        router.replace('/employees');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return <div className="flex h-screen items-center justify-center">Loading...</div>;
}
