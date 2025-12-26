'use client';

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    status: string;
    created_at: string;
    pickup_time?: string;
}

export default function CarrierDashboardPage() {
    const t = useTranslations('Dashboard');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadShipments = async () => {
            try {
                const data = await fetchApi('/shipments');
                // Filter for OPEN shipments if status logic exists, otherwise show all
                setShipments(data);
            } catch (error) {
                console.error('Failed to load shipments', error);
            } finally {
                setLoading(false);
            }
        };

        loadShipments();

        // Auto-refresh every 60 seconds
        const interval = setInterval(loadShipments, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, track your progress</p>
                </div>
            </header>



            {/* Available Loads Section */}
            <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Recent Opportunities
                    </h2>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                        View all
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm">Finding loads...</p>
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">No shipments found.</p>
                        <p className="text-xs text-gray-400 mt-1">Check back later for new opportunities.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {shipments.map((shipment) => (
                            <div
                                key={shipment.id}
                                className="backdrop-blur-xl p-5 rounded-2xl border border-white/50 bg-white/40 transition-all hover:shadow-md group relative overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                    {/* Left: Shipment Context */}
                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-3 mb-2">
                                            {/* Row 1: Cargo Type & Status */}
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                    {shipment.cargo_type}
                                                </span>
                                                <span className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-sm font-bold border border-green-100 uppercase tracking-wider flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Posted {new Date(shipment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Row 2: Route */}
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span>{shipment.pickup_address.split(',')[0]}</span>
                                                </div>
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                    <span>{shipment.delivery_address.split(',')[0]}</span>
                                                </div>
                                            </div>

                                            {/* Row 3: Meta Data Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Weight</span>
                                                    <span className="font-semibold text-gray-700">{shipment.weight_kg} kg</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Pickup</span>
                                                    <span className="font-semibold text-gray-700">{shipment.pickup_time ? new Date(shipment.pickup_time).toLocaleDateString() : 'Flexible'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created</span>
                                                    <span className="font-semibold text-gray-700">{new Date(shipment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">ID</span>
                                                    <span className="font-mono text-gray-700">{shipment.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Button */}
                                    <div className="flex flex-col items-end gap-4 justify-center min-w-[120px]">
                                        <button
                                            onClick={() => window.location.href = `/en/dashboard/carrier/shipments/${shipment.id}`}
                                            className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                        >
                                            Details
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
