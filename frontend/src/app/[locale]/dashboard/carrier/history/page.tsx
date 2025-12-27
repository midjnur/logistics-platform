'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { Link } from '@/i18n/routing';

interface Offer {
    id: string;
    created_at: string;
    updated_at: string;
    status: string;
    offered_price: number;
}

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
    payment_terms?: string;
    offers?: Offer[];
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
                <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                    <div className="grid gap-6">
                        {shipments.map((shipment) => (
                            <div
                                key={shipment.id}
                                className={`backdrop-blur-xl p-5 rounded-2xl border transition-all hover:shadow-md group relative overflow-hidden ${shipment.status === 'ASSIGNED' ? 'bg-green-50/40 border-green-100' :
                                    shipment.status === 'DELIVERED' ? 'bg-gray-50/50 opacity-75 border-gray-100' :
                                        'bg-white/40 border-white/50'
                                    }`}
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
                                                {shipment.status === 'DELIVERED' ? (
                                                    <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold border border-gray-200 uppercase tracking-wider">
                                                        Delivered
                                                    </span>
                                                ) : shipment.status === 'CANCELLED' ? (
                                                    <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-100 uppercase tracking-wider">
                                                        Cancelled
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold border border-green-200 uppercase tracking-wider">
                                                        {shipment.status.replace(/_/g, ' ')}
                                                    </span>
                                                )}
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
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
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
                                                {shipment.offers && shipment.offers.length > 0 && (
                                                    <>
                                                        {/* For Carrier, 'Offer Sent' date is more relevant, which corresponds to created_at of their offer */}
                                                        <div>
                                                            <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Offer Sent</span>
                                                            <span className="font-semibold text-gray-700">
                                                                {new Date(shipment.offers[0].created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {shipment.offers.some(o => o.status === 'ACCEPTED') && (
                                                            <div className="bg-green-50 rounded-lg p-1 -m-1 pl-2">
                                                                <span className="block text-green-600 font-medium uppercase tracking-wider text-[10px]">Accepted On</span>
                                                                <span className="font-bold text-green-700">
                                                                    {new Date(shipment.offers.find((o: Offer) => o.status === 'ACCEPTED')!.updated_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {shipment.status === 'DELIVERED' && shipment.delivery_time && (
                                                    <div className="bg-gray-100 rounded-lg p-1 -m-1 pl-2">
                                                        <span className="block text-gray-500 font-medium uppercase tracking-wider text-[10px]">Delivered On</span>
                                                        <span className="font-bold text-gray-800">
                                                            {new Date(shipment.delivery_time).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">ID</span>
                                                    <span className="font-mono text-gray-700">{shipment.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Price & Payment Status */}
                                    <div className="flex flex-col items-end justify-between gap-6 min-w-[140px] border-l border-gray-100 pl-6 border-dashed">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Earnings</p>
                                            <span className="text-3xl font-black text-gray-900 tracking-tight">€{(shipment.price || shipment.offers?.find((o: Offer) => o.status === 'ACCEPTED')?.offered_price || 0).toLocaleString()}</span>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            {shipment.status === 'DELIVERED' && (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Payment Status</p>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                        Payment Pending
                                                    </span>
                                                    {shipment.payment_terms && shipment.delivery_time && (
                                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                                            Due: {(() => {
                                                                const deliveryDate = new Date(shipment.delivery_time);
                                                                let daysToAdd = 0;

                                                                const terms = shipment.payment_terms.toLowerCase().replace(/_/g, ' ');
                                                                if (terms.includes('0 - 7') || terms.includes('0-7')) daysToAdd = 7;
                                                                else if (terms.includes('8 - 14') || terms.includes('8-14')) daysToAdd = 14;
                                                                else if (terms.includes('15 - 30') || terms.includes('15-30')) daysToAdd = 30;

                                                                const dueDate = new Date(deliveryDate);
                                                                dueDate.setDate(deliveryDate.getDate() + daysToAdd);
                                                                return dueDate.toLocaleDateString();
                                                            })()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {shipment.status === 'CANCELLED' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                    Voided
                                                </span>
                                            )}

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
                </div>
            )}
        </div>
    );
}
