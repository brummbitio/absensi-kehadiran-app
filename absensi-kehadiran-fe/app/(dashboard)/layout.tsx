'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !hasRedirected.current) {
            hasRedirected.current = true;
            router.replace('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
