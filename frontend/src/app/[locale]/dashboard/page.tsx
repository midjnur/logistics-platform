'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { useSocket } from '@/context/SocketContext';
import TrackingPermissionModal from '@/components/dashboard/TrackingPermissionModal';

export default function DashboardPage() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalShipments: 0,
        pendingActions: 0,
        earnings: 0,
        growthPercent: '0%'
    });

    // Global Tracking Logic (CARRIER Only)
    const { socket } = useSocket();
    const [isOnline, setIsOnline] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [trackingError, setTrackingError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const [activeShipments, setActiveShipments] = useState<any[]>([]);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        const loadData = () => {
            Promise.all([
                fetchApi('/auth/me'),
                fetchApi('/shipments/dashboard-stats'),
                fetchApi('/shipments/my-shipments').catch(() => [])
            ])
                .then(([userData, statsData, shipmentsData]) => {
                    setUser((prev: any) => JSON.stringify(prev) !== JSON.stringify(userData) ? userData : prev);
                    setStats(statsData);
                    if (Array.isArray(shipmentsData)) {
                        setActiveShipments(shipmentsData.filter((s: any) =>
                            ['DRIVER_AT_PICKUP', 'LOADING_STARTED', 'LOADING_FINISHED', 'IN_TRANSIT', 'ARRIVED_DELIVERY', 'UNLOADING_FINISHED'].includes(s.status)
                        ));
                    }
                    // Check for Carrier Permission Onboarding
                    if (userData.role === 'CARRIER') {
                        const storageKey = `tracking_onboarding_shown_${userData.id}`;
                        const hasShown = localStorage.getItem(storageKey);

                        if (!hasShown) {
                            // Always show for new users to explain the feature
                            setShowPermissionModal(true);
                        }
                    }
                })
                .catch(() => {
                    // handles auth errors
                })
                .finally(() => setLoading(false));
        };

        loadData();
        const interval = setInterval(loadData, 30000); // 30s refresh

        return () => clearInterval(interval);
    }, [router]);

    const toggleOnline = () => {
        if (isOnline) {
            // Prevent going offline if there are active shipments
            if (activeShipments.length > 0) {
                setTrackingError("Cannot go offline: Active shipments in progress.");
                setTimeout(() => setTrackingError(null), 5000);
                return;
            }

            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setIsOnline(false);
            setLastUpdate(null);
        } else {
            if (!navigator.geolocation) {
                setTrackingError('Geolocation not supported');
                return;
            }

            const id = navigator.geolocation.watchPosition(
                (position) => {
                    setHasPermission(true);
                    setTrackingError(null);
                    setIsOnline(true);

                    if (activeShipments.length > 0 && socket) {
                        activeShipments.forEach(shipment => {
                            socket.emit('location-update', {
                                shipmentId: shipment.id,
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                speed: position.coords.speed,
                                heading: position.coords.heading,
                                timestamp: position.timestamp
                            }, (response: any) => {
                                if (response?.success) {
                                    setLastUpdate(new Date());
                                }
                            });
                        });
                    }
                },
                (error) => {
                    console.error('Tracking Error', error);
                    setHasPermission(false);
                    setTrackingError(error.message);
                    setIsOnline(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            watchIdRef.current = id;
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const handlePermissionGranted = () => {
        if (user?.id) {
            localStorage.setItem(`tracking_onboarding_shown_${user.id}`, 'true');
        }
    };

    const handleCloseModal = () => {
        if (user?.id) {
            localStorage.setItem(`tracking_onboarding_shown_${user.id}`, 'true');
        }
        setShowPermissionModal(false);
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <TrackingPermissionModal
                isOpen={showPermissionModal}
                onClose={handleCloseModal}
                onPermissionGranted={handlePermissionGranted}
            />

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

            {/* Carrier Global Go Online Widget */}
            {user.role === 'CARRIER' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${isOnline ? 'bg-green-500' : 'bg-gray-200'} transition-colors duration-500`} />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {isOnline ? (
                                    <div className="relative">
                                        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{isOnline ? 'You are Online' : 'You are Offline'}</h2>
                                <p className="text-sm text-gray-500 pt-0.5">
                                    {isOnline
                                        ? `Visible to Shippers • ${activeShipments.length} Active Jobs`
                                        : 'Go online to start tracking shipments'
                                    }
                                </p>
                                {lastUpdate && isOnline && (
                                    <p className="text-[10px] text-green-600 font-mono mt-1 opacity-75">Last Signal: {lastUpdate.toLocaleTimeString()}</p>
                                )}
                                {trackingError && (
                                    <p className="text-[11px] text-red-500 font-medium mt-1 bg-red-50 px-2 py-0.5 rounded">{trackingError}</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={toggleOnline}
                            className={`relative rounded-full px-6 py-3 font-bold text-sm transition-all duration-300 shadow-sm flex items-center gap-2 ${isOnline
                                ? 'bg-green-500 text-white hover:bg-green-600 ring-4 ring-green-100'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                                }`}
                        >
                            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="glass p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        </div>
                        <span className={`font-bold px-2 py-1 rounded-lg text-xs ${stats.growthPercent.includes('+') ? 'text-green-500 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                            {stats.growthPercent}
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Shipments</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalShipments}</p>
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
                        <div className="text-3xl font-bold text-gray-900">€{stats.earnings.toLocaleString()}</div>
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
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingActions}</p>
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
