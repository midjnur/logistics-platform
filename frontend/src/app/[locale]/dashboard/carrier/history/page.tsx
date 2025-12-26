'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { Link } from '@/i18n/routing';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    status: string;
    price: number;
    delivery_time: string;
    pickup_time: string;
    weight_kg: number;
    cargo_type: string;
    created_at: string;
}

export default function HistoryPage() {
    const t = useTranslations('Carrier');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = () => {
            fetchApi('/shipments/my-shipments')
                .then(data => setShipments(data.filter((s: Shipment) =>
                    s.status === 'DELIVERED' || s.status === 'CANCELLED'
                )))
                .catch(console.error)
                .finally(() => setLoading(false));
        };
        loadHistory();
    }, []);

    if (loading) return <div className="flex justify-center p-12">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">History</h1>
                    <p className="text-gray-500 mt-1">Past shipments, performance, and payments</p>
                </div>
            </header>

            {shipments.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">No history yet</p>
                    <p className="text-gray-500 max-w-sm">
                        Completed and cancelled shipments will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {shipments.map((shipment) => (
                        <div
                            key={shipment.id}
                            className={`backdrop-blur-xl p-6 rounded-2xl border transition-all hover:shadow-lg group relative overflow-hidden bg-white/90 shadow-sm ${shipment.status === 'DELIVERED' ? 'border-green-200' : 'border-red-200'}`}
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                {/* Left: Shipment Context */}
                                <div className="flex-1 min-w-0">
                                    <div className="space-y-4 mb-2">
                                        {/* Row 1: Cargo Type & Status */}
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                {shipment.cargo_type}
                                            </span>
                                            {shipment.status === 'DELIVERED' ? (
                                                <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold border border-green-200 uppercase tracking-wider flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    Delivered
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-sm font-bold border border-red-200 uppercase tracking-wider flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Cancelled
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 2: Route */}
                                        <div className="flex items-center gap-4 text-sm bg-white/50 p-3 rounded-xl border border-white/60">
                                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                                <span className="text-lg">{shipment.pickup_address.split(',')[0]}</span>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                                <span className="text-lg">{shipment.delivery_address.split(',')[0]}</span>
                                            </div>
                                        </div>

                                        {/* Row 3: Meta Data Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                                            <div>
                                                <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px] mb-1">Weight</span>
                                                <span className="font-semibold text-gray-700 text-sm">{shipment.weight_kg} kg</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px] mb-1">Pickup Date</span>
                                                <span className="font-semibold text-gray-700 text-sm">{new Date(shipment.pickup_time).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px] mb-1">Delivered On</span>
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {shipment.delivery_time ? new Date(shipment.delivery_time).toLocaleDateString() : '—'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px] mb-1">ID</span>
                                                <span className="font-mono text-gray-700">{shipment.id.split('-')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Price & Payment Status */}
                                <div className="flex flex-col items-end justify-between gap-6 min-w-[140px] border-l border-gray-100 pl-6 border-dashed">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Earnings</p>
                                        <span className="text-3xl font-black text-gray-900 tracking-tight">€{(shipment.price || 0).toLocaleString()}</span>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Payment Status</p>
                                            {/* Simplified logic: Deleted items are cancelled, delivered items are pending initially */}
                                            {shipment.status === 'CANCELLED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                    Voided
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                    Waiting for Payment
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            href={`/dashboard/carrier/shipments/${shipment.id}`}
                                            className="inline-flex items-center gap-1 text-blue-600 font-bold text-sm hover:text-blue-700 hover:gap-2 transition-all"
                                        >
                                            View Details
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
