'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('Dashboard');
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        fetchApi('/auth/me')
            .then((data) => setUser(data))
            .catch(() => {
                // Token might be invalid, but let the page handle redirect logic to avoid double redirects or flash
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/auth/login');
    };

    const allNavItems = [
        { label: 'Overview', href: '/dashboard', icon: 'M4 6h16M4 12h16M4 18h16', roles: ['SHIPPER', 'CARRIER'] },
        { label: 'My Shipments', href: '/dashboard/shipper/my-shipments', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['SHIPPER'] },
        { label: 'Create Shipment', href: '/dashboard/shipper/create-shipment', icon: 'M12 4v16m8-8H4', roles: ['SHIPPER'] },
        { label: 'Find Loads', href: '/dashboard/carrier', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', roles: ['CARRIER'] },
        { label: 'My Vehicles', href: '/dashboard/carrier/my-vehicles', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z', roles: ['CARRIER'] },
        { label: 'My Documents', href: '/dashboard/carrier/my-documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['CARRIER'] },
    ];

    const navItems = user ? allNavItems.filter(item => item.roles.includes(user.role)) : [];

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Glass Sidebar */}
            <aside className="w-64 glass-panel flex flex-col justify-between p-6 z-20">
                <div>
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 shadow-lg" />
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Logistics
                        </h1>
                    </div>

                    {/* Status Indicator (Minimalist) */}
                    {user?.role === 'CARRIER' && (
                        <div className="mb-6 px-4">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const status = user.carrier?.verification_status || 'PENDING';

                                    let color = 'bg-yellow-400';
                                    let text = 'Pending Approval';
                                    let icon = (
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                                    );

                                    if (status === 'VERIFIED') {
                                        color = 'bg-green-500';
                                        text = 'Account Active';
                                        icon = (
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                        );
                                    } else if (status === 'REJECTED') {
                                        color = 'bg-red-500';
                                        text = 'Account Rejected';
                                        icon = (
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        );
                                    }

                                    return (
                                        <>
                                            <div className="flex-shrink-0">
                                                {icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{text}</p>
                                                {/* Removed System Status subtitle for minimalism */}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-blue-600/10 text-blue-700 shadow-sm backdrop-blur-sm'
                                        : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'
                                        }`}
                                >
                                    <svg className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-gray-200/50 pt-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50/50 transition-all font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                    <div className="flex items-center gap-3 mt-6 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 ring-2 ring-white/50 flex items-center justify-center text-white font-bold">
                            {user?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate" title={user?.email}>{user?.email || 'Loading...'}</p>
                            <p className="text-xs text-blue-600 font-medium">{user?.role || 'Guest'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto z-10 p-8">
                {children}
            </main>
        </div>
    );
}
