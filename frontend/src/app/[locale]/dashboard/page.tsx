'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

export default function DashboardPage() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        fetchApi('/auth/me')
            .then((data) => setUser(data))
            .catch(() => {
                localStorage.removeItem('token');
                router.push('/auth/login');
            })
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
                        {user.role}
                    </span>
                    <button className="bg-white p-2 rounded-full shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Cards (Placeholders) */}
                <div className="glass p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        </div>
                        <span className="text-green-500 font-bold bg-green-50 px-2 py-1 rounded-lg text-xs">+12%</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Shipments</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
                </div>

                {user.role === 'CARRIER' && (
                    <div className="glass p-6 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-full bg-green-100/50 flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Earnings</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900">€12,450</div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">Total revenue this month</p>
                    </div>
                )}

                <div className="glass p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Pending Actions</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">3</p>
                </div>
            </div>

            <div className="glass p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.role === 'SHIPPER' && (
                        <>
                            <button
                                onClick={() => router.push('/dashboard/shipper/create-shipment')}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all group text-left"
                            >
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-900">Create New Shipment</span>
                                    <span className="text-sm text-gray-500">Post a new load for carriers</span>
                                </div>
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/shipper/my-shipments')}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition-all group text-left"
                            >
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-900">View My Shipments</span>
                                    <span className="text-sm text-gray-500">Track status and history</span>
                                </div>
                            </button>
                        </>
                    )}

                    {user.role === 'CARRIER' && (
                        <>
                            <button
                                onClick={() => router.push('/dashboard/carrier')}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-green-50/50 hover:border-green-200 transition-all group text-left"
                            >
                                <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-900">Browse Loads</span>
                                    <span className="text-sm text-gray-500">Find new jobs near you</span>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
