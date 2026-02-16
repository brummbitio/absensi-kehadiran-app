'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, BarChart, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const links = [
        { href: '/employees', label: 'Employees', icon: Users },
        { href: '/attendance/scan', label: 'Scan QR', icon: Calendar },
        { href: '/attendance/recap', label: 'Recap', icon: BarChart },
        { href: '/holidays', label: 'Holidays', icon: Settings }, // Using Settings icon for Holidays/Admin stuff
    ];

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <div className="flex flex-col h-screen w-64 bg-gray-900 text-white">
            <div className="p-6">
                <h1 className="text-xl font-bold">Daily Attendance</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(link.href) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={logout}
                >
                    <LogOut size={20} className="mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
