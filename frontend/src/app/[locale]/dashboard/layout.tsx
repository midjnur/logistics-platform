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
    // const t = useTranslations('Dashboard');
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

        // Shipper Links
        { label: 'Create Shipment', href: '/dashboard/shipper/create-shipment', icon: 'M12 4v16m8-8H4', roles: ['SHIPPER'] },
        { label: 'My Shipments', href: '/dashboard/shipper/my-shipments', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['SHIPPER'] },

        { label: 'Upcoming Shipments', href: '/dashboard/shipper/upcoming', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['SHIPPER'] },
        { label: 'Active Shipments', href: '/dashboard/shipper/active-orders', icon: 'M13 10V3L4 14h7v7l9-11h-7z', roles: ['SHIPPER'] },
        { label: 'History', href: '/dashboard/shipper/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['SHIPPER'] },

        { label: 'Settings', href: '/dashboard/shipper/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', roles: ['SHIPPER'] },
        { label: 'My Documents', href: '/dashboard/shipper/my-documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['SHIPPER'] },
        { label: 'Terms and Conditions', href: '/dashboard/shipper/terms', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', roles: ['SHIPPER'] },

        // Carrier Links
        { label: 'Find Shipments', href: '/dashboard/carrier', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', roles: ['CARRIER'] },
        { label: 'Offers Sent', href: '/dashboard/carrier/offers', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', roles: ['CARRIER'] },
        { label: 'Upcoming Shipments', href: '/dashboard/carrier/upcoming', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['CARRIER'] },
        { label: 'Active Shipments', href: '/dashboard/carrier/active', icon: 'M13 10V3L4 14h7v7l9-11h-7z', roles: ['CARRIER'] },
        { label: 'My Vehicles', href: '/dashboard/carrier/my-vehicles', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', roles: ['CARRIER'] },
        { label: 'History', href: '/dashboard/carrier/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['CARRIER'] },
        { label: 'Settings', href: '/dashboard/carrier/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', roles: ['CARRIER'] },
        { label: 'My Documents', href: '/dashboard/carrier/my-documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['CARRIER'] },
        { label: 'Terms and Conditions', href: '/dashboard/carrier/terms', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', roles: ['CARRIER'] },
    ];

    const navItems = user ? allNavItems.filter(item => item.roles.includes(user.role)) : [];

    return (


        <div className="flex h-screen overflow-hidden bg-gray-50/30">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:flex w-64 glass-panel flex-col justify-between p-6 z-20">
                <div>
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 shadow-lg" />
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Logistics
                        </h1>
                    </div>

                    {/* Status Indicator (Minimalist) */}
                    {(user?.role === 'CARRIER' || user?.role === 'SHIPPER') && (
                        <div className="mb-6 px-4">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    let status = 'PENDING';

                                    if (user.role === 'CARRIER') {
                                        status = user.carrier?.verification_status || 'PENDING';
                                    } else {
                                        // For Shippers, use is_active as proxy, or default to VERIFIED if true
                                        status = user.is_active ? 'VERIFIED' : 'PENDING';
                                    }

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
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate" title={user?.email}>{user?.email || 'Loading...'}</p>
                            <p className="text-xs text-blue-600 font-medium">{user?.role || 'Guest'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header (Visible only on Mobile) */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40 flex items-center justify-between px-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 shadow-lg" />
                    <span className="font-bold text-gray-900 text-lg">Logistics</span>
                </div>

                <div className="flex items-center gap-2">
                    {user && (
                        <div className="flex items-center gap-2 pr-2 border-r border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-2 ring-white shadow-sm">
                                {user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 max-w-[80px] truncate leading-tight">
                                    {user.email?.split('@')[0] || 'User'}
                                </span>
                                <span className="text-[10px] text-blue-500 font-bold leading-none">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-colors"
                        aria-label="Logout"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Bottom Navigation (Scrollable, Icons Only) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 px-2 py-2 flex items-center gap-2 overflow-x-auto safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)] scrollbar-hide">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-xl transition-all duration-300 relative ${isActive
                                ? 'text-blue-600'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full shadow-[0_2px_8px_rgba(37,99,235,0.5)]" />
                            )}
                            <svg className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-sm' : ''} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                            </svg>
                        </Link>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto z-10 p-4 pt-20 md:p-8 pb-24 md:pb-8 md:pt-8 w-full">
                {children}
            </main>
        </div>
    );
}
