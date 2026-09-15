'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';

const NAV_ITEMS = [
    { label: 'Overview', href: '/admin', icon: 'M4 6h16M4 12h16M4 18h16' },
    { label: 'Shipments', href: '/admin/shipments', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Users', href: '/admin/users', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 10-8 0' },
    { label: 'Verifications', href: '/admin/verifications', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }
        fetchApi('/auth/me')
            .then((user) => {
                if (user.role !== 'ADMIN') {
                    router.push('/dashboard');
                    return;
                }
                setAuthorized(true);
            })
            .catch(() => router.push('/auth/login'))
            .finally(() => setChecked(true));
    }, [router]);

    if (!checked || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 flex">
            <aside className="hidden md:flex w-64 flex-col bg-gray-900 text-white min-h-screen sticky top-0">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500" />
                        <span className="font-bold text-lg">Admin</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Logistics Platform</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
                        &larr; Back to main dashboard
                    </Link>
                </div>
            </aside>

            <main className="flex-1 p-4 md:p-8 max-w-[1400px]">{children}</main>
        </div>
    );
}
