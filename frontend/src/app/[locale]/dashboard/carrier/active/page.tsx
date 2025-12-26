'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import ShipmentProgressControl from '@/components/dashboard/ShipmentProgressControl';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    pickup_time: string;
    weight_kg: number;
    status: string;
}

const ACTIVE_STATUSES = [
    'DRIVER_AT_PICKUP',
    'LOADING_STARTED',
    'LOADING_FINISHED',
    'IN_TRANSIT',
    'ARRIVED_DELIVERY',
    'UNLOADING_FINISHED'
];

export default function ActiveShipmentsPage() {
    const t = useTranslations('Carrier');
    const router = useRouter(); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    const loadShipments = () => {
        fetchApi('/shipments/my-shipments')
            .then(data => setShipments(data.filter((s: Shipment) => ACTIVE_STATUSES.includes(s.status))))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadShipments();
    }, []);

    if (loading) return <div className="flex justify-center p-12">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Active Shipments</h1>
                    <p className="text-gray-500 mt-1">Manage your ongoing shipments and track progress</p>
                </div>
            </header>

            {shipments.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">No active shipments</p>
                    <p className="text-gray-500 max-w-sm">
                        Shipments you pick up will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-8">
                    {shipments.map((shipment) => (
                        <div key={shipment.id} className="glass p-6 rounded-3xl shadow-lg border border-blue-100/50 bg-white/90">
                            {/* Header Info */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 border-b border-gray-100 pb-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                            {shipment.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-gray-400 text-xs font-mono">ID: {shipment.id.split('-')[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-lg">
                                        <span className="font-bold text-gray-900">{shipment.pickup_address.split(',')[0]}</span>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        <span className="font-bold text-gray-900">{shipment.delivery_address.split(',')[0]}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Weight: <span className="font-bold text-gray-900">{shipment.weight_kg} kg</span></div>
                                    <div className="text-sm text-gray-500">Pickup: <span className="font-bold text-gray-900">{new Date(shipment.pickup_time).toLocaleDateString()}</span></div>
                                </div>
                            </div>

                            {/* Progress Control */}
                            <ShipmentProgressControl
                                shipment={shipment}
                                onStatusUpdate={loadShipments}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
