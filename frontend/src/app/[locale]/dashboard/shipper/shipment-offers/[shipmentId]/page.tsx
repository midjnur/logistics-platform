'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Offer {
    id: string;
    carrier_id: string;
    offered_price: number;
    message: string;
    status: string;
    created_at: string;
}

interface DetailedShipment {
    id: string;
    pickup_address: string;
    pickup_time: string;
    delivery_address: string;
    delivery_time: string;
    status: string;

    // Cargo
    cargo_type: string;
    weight_kg: number;
    volume_m3: number;
    internal_length?: number;
    internal_width?: number;
    internal_height?: number;
    cbm?: number;
    hs_code?: string;

    // Requirements
    temperature_control: boolean;
    loading_type?: string;
    has_tir: boolean;
    has_cmr: boolean;
    has_waybill: boolean;
    export_declaration: string;

    // Financials
    value_of_goods?: number;
    value_currency?: string;
    payment_terms?: string;
    price?: number;
    target_price?: number;

    shipper_details: any;
    consignee_details: any;
    timeline?: { status: string; timestamp: string; description?: string }[];
    documents?: any[];
}

export default function ShipmentOffersPage() {
    const t = useTranslations('Shipper');
    const router = useRouter();
    const params = useParams();
    const shipmentId = params.shipmentId as string;

    const [offers, setOffers] = useState<Offer[]>([]);
    const [shipment, setShipment] = useState<DetailedShipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (shipmentId) {
            setLoading(true);

            // 1. Fetch Offers
            fetchApi(`/offers/shipment/${shipmentId}`)
                .then(setOffers)
                .catch(err => {
                    console.error('Failed to load offers:', err);
                    // Don't block shipment details if offers fail
                });

            // 2. Fetch Shipment Details
            fetchApi(`/shipments/${shipmentId}`)
                .then(setShipment)
                .catch(err => {
                    console.error('Error fetching shipment details:', err);
                    setError(err.message || String(err));
                })
                .finally(() => setLoading(false));
        }
    }, [shipmentId]);

    const handleAcceptOffer = async (offerId: string) => {
        if (!confirm('Accept this offer? This will reject all other offers.')) return;

        try {
            await fetchApi(`/offers/${offerId}/accept`, { method: 'PATCH' });
            const otherOffers = offers.filter(o => o.id !== offerId);
            await Promise.all(
                otherOffers.map(o =>
                    fetchApi(`/offers/${o.id}/reject`, { method: 'PATCH' })
                )
            );
            alert('Offer accepted!');
            router.push('/dashboard/shipper/my-shipments');
        } catch (err) {
            alert('Failed to accept offer');
        }
    };

    const handleRejectOffer = async (offerId: string) => {
        if (!confirm('Reject this offer?')) return;

        try {
            await fetchApi(`/offers/${offerId}/reject`, { method: 'PATCH' });
            setOffers(prev => prev.map(o =>
                o.id === offerId ? { ...o, status: 'REJECTED' } : o
            ));
        } catch (err) {
            alert('Failed to reject offer');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30 p-4 md:p-8">
            {/* Background Blobs */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Go Back
                    </button>
                    <span className="px-3 py-1 bg-white/50 backdrop-blur rounded-lg text-sm text-gray-500 font-mono">
                        ID: {shipment?.id.split('-')[0]}
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Col: Full Shipment Details (Takes 5 cols) */}
                    <div className="xl:col-span-5 space-y-6 h-fit">
                        <section className="glass-panel p-6 rounded-3xl">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                </span>
                                <h2 className="text-xl font-bold text-gray-900">Shipment Details</h2>
                                <span className="ml-auto px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase">
                                    {shipment?.status}
                                </span>
                            </div>

                            <div className="space-y-8">
                                {/* Route */}
                                <div className="space-y-6 relative">
                                    <div className="absolute left-[15px] top-[15px] bottom-[35px] w-0.5 bg-gradient-to-b from-green-300 via-gray-200 to-red-300" />

                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-50 border-4 border-white shadow-sm flex items-center justify-center z-10">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                        </div>
                                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Pickup</p>
                                        <p className="text-gray-900 font-bold leading-snug text-lg">{shipment?.pickup_address}</p>
                                        <p className="text-gray-500 text-sm mt-1">{shipment?.pickup_time ? new Date(shipment.pickup_time).toLocaleString() : 'Date not set'}</p>
                                    </div>

                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-red-50 border-4 border-white shadow-sm flex items-center justify-center z-10">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        </div>
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Delivery</p>
                                        <p className="text-gray-900 font-bold leading-snug text-lg">{shipment?.delivery_address}</p>
                                        <p className="text-gray-500 text-sm mt-1">{shipment?.delivery_time ? new Date(shipment.delivery_time).toLocaleString() : 'Date not set'}</p>
                                    </div>
                                </div>

                                {/* Cargo Specs */}
                                <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                    <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        Cargo Specification
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Type</p>
                                            <p className="font-bold text-gray-900">{shipment?.cargo_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">HS Code</p>
                                            <p className="font-bold text-gray-900">{shipment?.hs_code || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Weight</p>
                                            <p className="font-bold text-gray-900">{shipment?.weight_kg} kg</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Volume</p>
                                            <p className="font-bold text-gray-900">{shipment?.cbm || shipment?.volume_m3 || '-'} m³</p>
                                        </div>
                                    </div>

                                    {shipment?.internal_length && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/50">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Dimensions (L x W x H)</p>
                                            <div className="flex bg-white rounded-lg border border-gray-200 p-2 text-sm font-mono font-bold text-gray-700 justify-between">
                                                <span>{shipment.internal_length}</span>
                                                <span className="text-gray-300">x</span>
                                                <span>{shipment.internal_width}</span>
                                                <span className="text-gray-300">x</span>
                                                <span>{shipment.internal_height}</span>
                                                <span className="text-xs text-gray-400 font-sans ml-1">cm</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Requirements & Docs */}
                                <div className="space-y-4">
                                    <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Requirements</h3>

                                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${shipment?.temperature_control ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                                        {shipment?.temperature_control ? (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-700">{shipment?.temperature_control ? 'Refrigerated' : 'Standard Temp'}</span>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Documents</p>
                                        <div className="flex flex-wrap gap-2">
                                            {shipment?.has_tir && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">TIR</span>}
                                            {shipment?.has_cmr && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">CMR</span>}
                                            {shipment?.has_waybill && <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded">Waybill</span>}
                                            {shipment?.export_declaration && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200">Export Dec: {shipment.export_declaration}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Financials & Consignee */}
                                <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <h3 className="text-emerald-900 font-bold text-sm">Financials</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-emerald-600/70 uppercase font-bold mb-1">Value</p>
                                            <p className="font-bold text-emerald-900">{shipment?.value_of_goods ? `${shipment.value_of_goods} ${shipment.value_currency || 'EUR'}` : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-emerald-600/70 uppercase font-bold mb-1">Terms of Payment</p>
                                            <p className="font-medium text-emerald-900 text-sm">{shipment?.payment_terms ? shipment.payment_terms.replace(/_/g, ' ') : 'Standard'}</p>
                                        </div>
                                    </div>
                                    {shipment?.target_price && (
                                        <div className="mt-3 pt-3 border-t border-emerald-100/50">
                                            <p className="text-[10px] text-emerald-600/70 uppercase font-bold mb-1">Your Target Price</p>
                                            <p className="font-bold text-emerald-900 text-lg">€{shipment.target_price}</p>
                                        </div>
                                    )}
                                </div>

                                {shipment?.consignee_details && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Consignee</h3>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <p className="font-bold text-gray-900 text-sm">{shipment.consignee_details.company || 'Unknown Company'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{shipment.consignee_details.address}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Shipment Log */}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">Shipment Log</p>
                                    <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                        {shipment?.timeline && shipment.timeline.length > 0 ? (
                                            shipment.timeline.map((event, i) => (
                                                <div key={i} className="relative">
                                                    <div className="absolute -left-[15px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{event.description || event.status}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {new Date(event.timestamp).toLocaleString(undefined, {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No history available for this shipment.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Shipment Documents */}
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">Shipment Documents</p>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                                        <DocumentUpload
                                            shipmentId={shipment?.id || ''}
                                            documents={shipment?.documents}
                                            readOnly={true}
                                            onUploadComplete={() => {
                                                // Refresh logic if needed
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Col: Offers (Takes 7 cols) */}
                    <div className="xl:col-span-7">
                        <div className="sticky top-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Offers</h1>
                                    <p className="text-gray-500 text-sm">Review proposals from carriers</p>
                                </div>
                                <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-gray-900/20">
                                    {offers.length} Received
                                </span>
                            </div>

                            {offers.length === 0 ? (
                                <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-2 border-gray-200 hover:border-blue-200 transition-colors bg-white/50 h-[500px] flex flex-col justify-center">
                                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-200 shadow-inner">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No offers yet</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                                        We're calculating the best routes. Carriers will submit their offers here shortly.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {offers.map((offer) => (
                                            <motion.div
                                                key={offer.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-sm transition-all hover:shadow-lg hover:border-blue-200 group relative"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                    {/* Left: Price & Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                                                                €{offer.offered_price.toLocaleString()}
                                                            </h3>
                                                            {offer.status === 'PENDING' && (
                                                                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100">
                                                                    New
                                                                </span>
                                                            )}
                                                            {offer.status === 'ACCEPTED' && (
                                                                <span className="px-2.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-100">
                                                                    Accepted
                                                                </span>
                                                            )}
                                                            {offer.status === 'REJECTED' && (
                                                                <span className="px-2.5 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-gray-100">
                                                                    Rejected
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-[10px]">C</div>
                                                            <span className="font-semibold text-gray-700">#{offer.carrier_id.substring(0, 5)}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                                                        </div>

                                                        {offer.message && (
                                                            <div className="mt-3 bg-gray-50/80 rounded-lg p-3 text-sm text-gray-600 italic border border-gray-100/50 max-w-xl">
                                                                "{offer.message}"
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right: Actions */}
                                                    <div className="flex items-center gap-2 self-start md:self-center pt-2 md:pt-0">
                                                        {offer.status === 'PENDING' ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleRejectOffer(offer.id)}
                                                                    className="px-4 py-2 rounded-xl text-gray-400 font-bold text-xs hover:bg-red-50 hover:text-red-500 transition-all"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAcceptOffer(offer.id)}
                                                                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-gray-900/10 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                                                >
                                                                    Accept
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs font-bold italic px-4">
                                                                {offer.status === 'ACCEPTED' ? 'Offer Accepted' : 'Offer Rejected'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


        </div >
    );
}

// Add 'target_price' to DetailedShipment interface since I used it
/* 
    target_price?: number; 
*/
