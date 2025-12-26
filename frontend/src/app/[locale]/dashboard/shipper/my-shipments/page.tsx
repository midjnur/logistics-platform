'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    status: string;
    price: number;
    created_at: string;
    offers?: any[];
}

export default function MyShipmentsPage() {
    const t = useTranslations('Shipper');
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/shipments')
            .then(data => setShipments(data.filter((s: Shipment) => ['OPEN', 'OFFERED', 'ASSIGNED'].includes(s.status))))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('myShipments')}</h1>
                    <p className="text-gray-500 mt-1">Track and manage all your shipments</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/shipper/create-shipment')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    {t('createShipment')}
                </button>
            </header>

            {shipments.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm text-center min-h-[400px] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-100/50 rounded-full flex items-center justify-center mb-5 text-blue-600">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">No shipments yet. Create your first shipment!</p>
                    <p className="text-sm text-gray-400">Start by posting your first load for carriers</p>
                </div>
            ) : (
                <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Your Shipments
                    </h2>
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
                                                    <span className="font-semibold text-gray-700">Flexible</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created</span>
                                                    <span className="font-semibold text-gray-700">{new Date(shipment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {shipment.offers && shipment.offers.length > 0 && (
                                                    <>
                                                        <div>
                                                            <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Offer Received</span>
                                                            <span className="font-semibold text-gray-700">
                                                                {new Date(shipment.offers[0].created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {shipment.offers.some((o: any) => o.status === 'ACCEPTED') && (
                                                            <div className="bg-green-50 rounded-lg p-1 -m-1 pl-2">
                                                                <span className="block text-green-600 font-medium uppercase tracking-wider text-[10px]">Accepted On</span>
                                                                <span className="font-bold text-green-700">
                                                                    {new Date(shipment.offers.find((o: any) => o.status === 'ACCEPTED')!.updated_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">ID</span>
                                                    <span className="font-mono text-gray-700">{shipment.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Price & Action */}
                                    <div className="flex flex-col items-end gap-4 justify-between min-w-[120px]">
                                        {shipment.price && (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Price</p>
                                                <span className="text-3xl font-bold text-gray-900">€{shipment.price.toLocaleString()}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => router.push(`/dashboard/shipper/shipment-offers/${shipment.id}`)}
                                            className={`text-sm font-bold flex items-center gap-1 transition-all ${shipment.offers && shipment.offers.length > 0
                                                ? 'bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-md'
                                                : 'text-blue-600 hover:underline'
                                                }`}
                                        >
                                            {shipment.offers && shipment.offers.length > 0 ? (
                                                <>
                                                    View {shipment.offers.length} Offer{shipment.offers.length !== 1 ? 's' : ''}
                                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">New</span>
                                                </>
                                            ) : (
                                                <>
                                                    View Details
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => router.push('/dashboard')}
                className="glass px-6 py-3 rounded-2xl text-gray-700 hover:bg-white/60 font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </button>
        </div>
    );
}
