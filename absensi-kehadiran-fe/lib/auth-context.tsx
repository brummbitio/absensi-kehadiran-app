'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
    role: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    login: (tokens: { access_token: string, refresh_token: string, user: User }) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('access_token');
                if (storedUser && token) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to parse user from storage', e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (data: { access_token: string, refresh_token: string, user: User }) => {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        setTimeout(() => {
            router.push('/employees');
        }, 100);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
