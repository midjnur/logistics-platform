'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    pickup_time: string;
    status: string;
    weight_kg: number;
    cargo_type: string;
    created_at: string;
}

interface Offer {
    id: string;
    shipment_id: string;
    offered_price: number;
    message: string;
    status: string;
    created_at: string;
    updated_at: string;
    shipment: Shipment;
}

export default function OffersSentPage() {
    const router = useRouter();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/offers/my-offers')
            .then((data: Offer[]) => {
                // Filter out offers for shipments that are completed or cancelled
                const activeOffers = data.filter(offer =>
                    !['DELIVERED', 'CANCELLED'].includes(offer.shipment?.status)
                );
                setOffers(activeOffers);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Offers Sent</h1>
                    <p className="text-gray-500 mt-1">Track the status of your submitted offers</p>
                </div>
                <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-gray-900/20">
                    {offers.length} Sent
                </span>
            </header>

            <div className="glass p-8 rounded-3xl shadow-sm min-h-[500px]">
                {offers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl h-full">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <p className="text-gray-900 font-bold text-lg mb-2">No offers sent yet</p>
                        <p className="text-gray-500 max-w-sm mb-6">Start by finding active shipments and submitting your best proposals.</p>
                        <button
                            onClick={() => router.push('/dashboard/carrier/available-jobs')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                        >
                            Find Shipments
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                className={`backdrop-blur-xl p-5 rounded-2xl border transition-all hover:shadow-md group relative overflow-hidden ${offer.status === 'ACCEPTED' ? 'bg-green-50/40 border-green-100' :
                                    offer.status === 'REJECTED' ? 'bg-gray-50/50 opacity-75 border-gray-100' :
                                        'bg-white/40 border-white/50'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                    {/* Left: Shipment Context */}
                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-3 mb-2">
                                            {/* Row 1: Route & Type */}
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                    {offer.shipment?.cargo_type || 'General'}
                                                </span>
                                                {offer.status === 'PENDING' && <span className="px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 text-sm font-bold border border-yellow-100 uppercase tracking-wider">Pending</span>}
                                                {offer.status === 'ACCEPTED' && <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold border border-green-200 uppercase tracking-wider">Accepted</span>}
                                                {offer.status === 'REJECTED' && <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 uppercase tracking-wider">Rejected</span>}
                                            </div>

                                            {/* Row 2: Route */}
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span>{offer.shipment?.pickup_address.split(',')[0]}</span>
                                                </div>
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                    <span>{offer.shipment?.delivery_address.split(',')[0]}</span>
                                                </div>
                                            </div>

                                            {/* Row 3: Meta Data Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                {/* Shipment Info */}
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Weight</span>
                                                    <span className="font-semibold text-gray-700">{offer.shipment?.weight_kg} kg</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Pickup</span>
                                                    <span className="font-semibold text-gray-700" suppressHydrationWarning>{offer.shipment?.pickup_time ? new Date(offer.shipment.pickup_time).toLocaleDateString() : 'Flexible'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created (Shipment)</span>
                                                    <span className="font-semibold text-gray-700" suppressHydrationWarning>{offer.shipment?.created_at ? new Date(offer.shipment.created_at).toLocaleDateString() : '—'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Offer Sent</span>
                                                    <span className="font-semibold text-gray-700" suppressHydrationWarning>{new Date(offer.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {offer.status === 'ACCEPTED' && (
                                                    <div className="col-span-2 md:col-span-1 bg-green-50 rounded-lg p-1 -m-1 pl-2">
                                                        <span className="block text-green-600 font-medium uppercase tracking-wider text-[10px]">Accepted On</span>
                                                        <span className="font-bold text-green-700" suppressHydrationWarning>{new Date(offer.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Your Offer Price */}
                                    <div className="flex flex-col items-end gap-4 justify-between min-w-[120px]">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Your Price</p>
                                            <span className="text-3xl font-bold text-gray-900">€{offer.offered_price.toLocaleString()}</span>
                                        </div>

                                        <button
                                            onClick={() => router.push(`/dashboard/carrier/shipments/${offer.shipment_id}`)}
                                            className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                        >
                                            View Details
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
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
