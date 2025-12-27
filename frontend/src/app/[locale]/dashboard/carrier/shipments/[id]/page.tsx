'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { fetchApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

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

    shipper_details: any;
    consignee_details: any;
    timeline?: { status: string; timestamp: string; description?: string }[];
    documents?: any[];
}

export default function ShipmentDetailsPage() {
    // const t = useTranslations('Carrier');
    const params = useParams();
    const router = useRouter();
    const [shipment, setShipment] = useState<DetailedShipment | null>(null);
    const [loading, setLoading] = useState(true);

    // Offer State
    const [offerPrice, setOfferPrice] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (params?.id) {
            fetchApi(`/shipments/${params.id}`)
                .then(setShipment)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [params?.id]);

    const handleSubmitOffer = async () => {
        if (!offerPrice || !shipment) return;
        setSubmitting(true);
        try {
            await fetchApi('/offers', {
                method: 'POST',
                body: JSON.stringify({
                    shipment_id: shipment.id,
                    offered_price: parseFloat(offerPrice),
                    message: offerMessage,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                }),
            });
            alert('Offer submitted successfully!');
            router.push('/dashboard/carrier');
        } catch (err) {
            alert('Failed to submit offer');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!shipment) return <div>Shipment not found</div>;

    return (
        <div className="min-h-screen pb-32 md:pb-40 bg-gray-50/30 p-4 md:p-8">
            {/* Background Blobs */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Go Back
                    </button>
                    <span className="px-3 py-1 bg-white/50 backdrop-blur rounded-lg text-sm text-gray-500 font-mono">
                        ID: {shipment.id.split('-')[0]}
                    </span>
                </div>

                {/* Main Content Area - Single Card Style like Shipper View */}
                <section className="glass-panel p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </span>
                        <h2 className="text-xl font-bold text-gray-900">Shipment Details</h2>
                        <span className="ml-auto px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase">
                            {shipment.status}
                        </span>
                    </div>

                    <div className="space-y-8">
                        {/* Route timeline */}
                        <div className="space-y-6 relative">
                            <div className="absolute left-[15px] top-[15px] bottom-[35px] w-0.5 bg-gradient-to-b from-green-300 via-gray-200 to-red-300" />
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-50 border-4 border-white shadow-sm flex items-center justify-center z-10">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                </div>
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Pickup</p>
                                <p className="text-gray-900 font-bold leading-snug text-lg">{shipment.pickup_address}</p>
                                <p className="text-gray-500 text-sm mt-1">{new Date(shipment.pickup_time).toLocaleString()}</p>
                            </div>
                            <div className="relative pl-10">
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-red-50 border-4 border-white shadow-sm flex items-center justify-center z-10">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                </div>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Delivery</p>
                                <p className="text-gray-900 font-bold leading-snug text-lg">{shipment.delivery_address}</p>
                                <p className="text-gray-500 text-sm mt-1">{new Date(shipment.delivery_time).toLocaleString()}</p>
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
                                    <p className="font-bold text-gray-900">{shipment.cargo_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">HS Code</p>
                                    <p className="font-bold text-gray-900">{shipment.hs_code || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Weight</p>
                                    <p className="font-bold text-gray-900">{shipment.weight_kg.toLocaleString()} kg</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Volume</p>
                                    <p className="font-bold text-gray-900">{shipment.cbm || shipment.volume_m3 || '-'} m³</p>
                                </div>
                            </div>
                            {shipment.internal_length && (
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

                        {/* Requirements */}
                        <div className="space-y-4">
                            <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Requirements</h3>
                            <div className={`p-3 rounded-xl border flex items-center gap-3 ${shipment.temperature_control ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                                {shipment.temperature_control ? (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                ) : (
                                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                                )}
                                <span className="text-sm font-medium text-gray-700">{shipment.temperature_control ? 'Refrigerated' : 'Standard Temp'}</span>
                            </div>
                            <div className="p-3 rounded-xl border bg-gray-50 border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Loading Type</span>
                                <span className="text-sm font-bold text-gray-900">{shipment.loading_type || 'Back'}</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Documents</p>
                                <div className="flex flex-wrap gap-2">
                                    {shipment.has_tir && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">TIR</span>}
                                    {shipment.has_cmr && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">CMR</span>}
                                    {shipment.has_waybill && <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded">Waybill</span>}
                                    {shipment.export_declaration && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200">Export Dec: {shipment.export_declaration}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h3 className="text-emerald-900 font-bold text-sm">Financials</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-emerald-600/70 uppercase font-bold mb-1">Value</p>
                                    <p className="font-bold text-emerald-900">{shipment.value_of_goods ? `${shipment.value_of_goods} ${shipment.value_currency || 'EUR'}` : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-emerald-600/70 uppercase font-bold mb-1">Terms of Payment</p>
                                    <p className="font-medium text-emerald-900 text-sm">{shipment.payment_terms ? shipment.payment_terms.replace(/_/g, ' ') : 'Standard'}</p>
                                </div>
                            </div>

                            {/* Privacy Logic: Shipper */}
                            <div className="pt-6 mt-4 border-t border-emerald-100/50">
                                <p className="text-xs text-emerald-600/70 uppercase font-bold tracking-wider mb-3">Shipper Verification</p>
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg text-white font-bold text-xs ring-2 ring-white">
                                        VS
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Verified Shipper</p>
                                        {['OPEN', 'OFFERED'].includes(shipment.status) ? (
                                            <p className="text-xs text-gray-400 italic">Details hidden until booked</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">ID: {shipment.shipper_details?.company || '********'}</p>
                                        )}
                                    </div>
                                    <svg className="w-5 h-5 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Logic: Consignee */}
                        {shipment.consignee_details && (
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3">Consignee</p>
                                {['OPEN', 'OFFERED'].includes(shipment.status) ? (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-center py-6">
                                        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        <p className="font-bold text-gray-400 text-sm">Hidden Info</p>
                                        <p className="text-xs text-gray-400 mt-1">Consignee details available after booking</p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="font-bold text-gray-900 text-sm">{shipment.consignee_details.company || 'Unknown Company'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{shipment.consignee_details.address}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Shipment Log */}
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">Shipment Log</p>
                            <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {shipment.timeline && shipment.timeline.length > 0 ? (
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
                    </div>
                    {/* Shipment Documents */}
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">Shipment Documents</p>
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <DocumentUpload
                                shipmentId={shipment.id}
                                documents={shipment.documents}
                                readOnly={true}
                                onUploadComplete={() => {
                                    fetchApi(`/shipments/${shipment.id}`).then(setShipment);
                                }}
                            />
                        </div>
                    </div>
                </section>
            </div >

            {/* Sticky Action Footer - Transparent Floating Style */}
            {
                ['OPEN', 'OFFERED'].includes(shipment.status) && (
                    <div className="fixed bottom-[80px] md:bottom-0 left-0 md:left-64 right-0 p-4 z-[60] safe-area-bottom pointer-events-none">
                        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4 pointer-events-auto">
                            <div className="flex-1 w-full md:w-auto relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Add a message to shipper..."
                                    value={offerMessage}
                                    onChange={(e) => setOfferMessage(e.target.value)}
                                    className="w-full bg-gray-100 border-0 rounded-xl py-3.5 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex w-full md:w-auto gap-3">
                                <div className="relative flex-1 md:flex-initial group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 group-focus-within:text-blue-600 transition-colors">€</span>
                                    <input
                                        type="number"
                                        placeholder="Your Offer"
                                        value={offerPrice}
                                        onChange={(e) => setOfferPrice(e.target.value)}
                                        className="w-full md:w-44 bg-white border border-gray-200 rounded-xl py-3.5 pl-8 pr-4 font-bold text-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleSubmitOffer}
                                    disabled={submitting || !offerPrice}
                                    className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex-1 md:flex-initial whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Offer</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
