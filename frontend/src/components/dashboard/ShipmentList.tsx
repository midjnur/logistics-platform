'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

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
    cargo_type: string;
    weight_kg: number;
    distance?: number;
    status: string;
    price: number;
    created_at: string;
    pickup_time?: string;
    delivery_time?: string;
    payment_terms?: string;
    offers?: Offer[];
}

interface ShipmentListProps {
    statusFilter?: string[];
    title: string;
    description: string;
    emptyMessage: string;
}

export default function ShipmentList({ statusFilter, title, description, emptyMessage }: ShipmentListProps) {
    const t = useTranslations('Shipper');
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/shipments')
            .then((data: Shipment[]) => {
                if (statusFilter && statusFilter.length > 0) {
                    setShipments(data.filter(s => statusFilter.includes(s.status)));
                } else {
                    setShipments(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [statusFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 text-sm">Loading shipments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="glass p-6 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
                <p className="text-gray-500 mt-1">{description}</p>
            </header>

            {shipments.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm text-center min-h-[400px] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-100/50 rounded-full flex items-center justify-center mb-5 text-blue-600">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">{emptyMessage}</p>
                    <button
                        onClick={() => router.push('/dashboard/shipper/create-shipment')}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline"
                    >
                        Create a new shipment
                    </button>
                </div>
            ) : (
                <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                    <div className="grid gap-4">
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
                                                {shipment.status === 'OPEN' && <span className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 text-sm font-bold border border-cyan-100 uppercase tracking-wider">Open</span>}
                                                {shipment.status === 'OFFERED' && <span className="px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 text-sm font-bold border border-yellow-100 uppercase tracking-wider">Offered</span>}
                                                {shipment.status === 'ASSIGNED' && <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold border border-green-200 uppercase tracking-wider">Assigned</span>}
                                                {shipment.status === 'DRIVER_AT_PICKUP' && <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100 uppercase tracking-wider">Driver Arrived</span>}
                                                {shipment.status === 'LOADING_STARTED' && <span className="px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-bold border border-indigo-200 uppercase tracking-wider">Loading</span>}
                                                {shipment.status === 'LOADING_FINISHED' && <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 uppercase tracking-wider">Loading Done</span>}
                                                {shipment.status === 'IN_TRANSIT' && <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold border border-blue-200 uppercase tracking-wider">In Transit</span>}
                                                {shipment.status === 'ARRIVED_DELIVERY' && <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100 uppercase tracking-wider">At Delivery</span>}
                                                {shipment.status === 'UNLOADING_FINISHED' && <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 text-sm font-bold border border-purple-200 uppercase tracking-wider">Unloading Done</span>}
                                                {shipment.status === 'DELIVERED' && <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold border border-gray-200 uppercase tracking-wider">Delivered</span>}
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
                                                    <span className="font-semibold text-gray-700" suppressHydrationWarning>{shipment.pickup_time ? new Date(shipment.pickup_time).toLocaleDateString() : 'Flexible'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Distance</span>
                                                    <span className="font-semibold text-gray-700">{shipment.distance ? `${shipment.distance.toLocaleString()} km` : '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created</span>
                                                    <span className="font-semibold text-gray-700" suppressHydrationWarning>{new Date(shipment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {shipment.offers && shipment.offers.length > 0 && (
                                                    <>
                                                        <div>
                                                            <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Offer Received</span>
                                                            <span className="font-semibold text-gray-700" suppressHydrationWarning>
                                                                {new Date(shipment.offers[0].created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {shipment.offers.some(o => o.status === 'ACCEPTED') && (
                                                            <div className="bg-green-50 rounded-lg p-1 -m-1 pl-2">
                                                                <span className="block text-green-600 font-medium uppercase tracking-wider text-[10px]">Accepted On</span>
                                                                <span className="font-bold text-green-700" suppressHydrationWarning>
                                                                    {new Date(shipment.offers.find(o => o.status === 'ACCEPTED')!.updated_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {shipment.status === 'DELIVERED' && shipment.delivery_time && (
                                                    <div className="bg-gray-100 rounded-lg p-1 -m-1 pl-2">
                                                        <span className="block text-gray-500 font-medium uppercase tracking-wider text-[10px]">Delivered On</span>
                                                        <span className="font-bold text-gray-800" suppressHydrationWarning>
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
                                        {(shipment.price || shipment.offers?.some(o => o.status === 'ACCEPTED')) ? (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Cost</p>
                                                <span className="text-3xl font-black text-gray-900 tracking-tight">
                                                    €{(shipment.price || shipment.offers?.find(o => o.status === 'ACCEPTED')?.offered_price || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        ) : null}

                                        <div className="flex flex-col items-end gap-3">
                                            {shipment.status === 'DELIVERED' && (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Payment Status</p>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                        Payment Pending
                                                    </span>
                                                    {shipment.payment_terms && shipment.delivery_time && (
                                                        <p className="text-[10px] text-gray-400 mt-1 font-medium" suppressHydrationWarning>
                                                            Due: {(() => {
                                                                const deliveryDate = new Date(shipment.delivery_time);
                                                                let daysToAdd = 0;

                                                                const terms = shipment.payment_terms.toLowerCase().replace(/_/g, ' ');
                                                                if (terms.includes('0 - 7') || terms.includes('0-7')) daysToAdd = 7;
                                                                else if (terms.includes('8 - 14') || terms.includes('8-14')) daysToAdd = 14;
                                                                else if (terms.includes('15 - 30') || terms.includes('15-30')) daysToAdd = 30;
                                                                // 'upon arrival' adds 0 days

                                                                const dueDate = new Date(deliveryDate);
                                                                dueDate.setDate(deliveryDate.getDate() + daysToAdd);
                                                                return dueDate.toLocaleDateString();
                                                            })()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                    Payment Pending Delivery
                                                </span>
                                            )}

                                            <button
                                                onClick={() => router.push(`/dashboard/shipper/shipment-offers/${shipment.id}`)}
                                                className="inline-flex items-center gap-1 text-blue-600 font-bold text-sm hover:text-blue-700 hover:gap-2 transition-all"
                                            >
                                                View Details
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            </button>
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
