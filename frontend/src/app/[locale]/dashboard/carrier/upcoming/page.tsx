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
    weight_kg: number;
    status: string;
    cargo_type: string;
    created_at: string;
}

export default function UpcomingShipmentsPage() {
    const t = useTranslations('Carrier');
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    const loadShipments = () => {
        fetchApi('/shipments/my-shipments')
            .then(data => setShipments(data.filter((s: Shipment) => s.status === 'ASSIGNED')))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadShipments();
    }, []);

    const handleConfirmPickup = async (id: string) => {
        try {
            await fetchApi(`/shipments/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'DRIVER_AT_PICKUP' }), // Stage 1
            });
            loadShipments(); // Should disappear from list if filtering strictly
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="flex justify-center p-12">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Upcoming Shipments</h1>
                    <p className="text-gray-500 mt-1">Jobs assigned to you, waiting for pickup</p>
                </div>
            </header>

            {shipments.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">No upcoming shipments</p>
                    <p className="text-gray-500 max-w-sm">
                        Once your offer is accepted, the shipment will appear here until you pick it up.
                    </p>
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
                                            <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold border border-green-200 uppercase tracking-wider">
                                                Assigned
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
                                                <span className="font-semibold text-gray-700">{new Date(shipment.pickup_time).toLocaleDateString()}</span>
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
                                <div className="flex flex-col items-end gap-4 justify-start min-w-[120px]">
                                    <button
                                        onClick={() => handleConfirmPickup(shipment.id)}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                        Driver Arrived
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
