'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import ShipmentList from './ShipmentList';
import LiveTrackingMap from '../tracking/LiveTrackingMap';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapView = dynamic(() => import('../tracking/LiveTrackingMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 text-sm">Loading map...</p>
            </div>
        </div>
    ),
});

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
    offers?: any[];
    pickup_lat: number;
    pickup_lng: number;
    delivery_lat: number;
    delivery_lng: number;
}

interface ActiveShipmentContainerProps {
    statusFilter?: string[];
}

export default function ActiveShipmentContainer({ statusFilter }: ActiveShipmentContainerProps) {
    const t = useTranslations('Shipper');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Toggle */}
            <header className="glass p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Active Shipments</h1>
                    <p className="text-gray-500 mt-1">Track your shipments currently in transit.</p>
                </div>

                <div className="bg-gray-100 p-1 rounded-xl flex items-center self-start md:self-center">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'map'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9 4" />
                        </svg>
                        Map View
                    </button>
                </div>
            </header>

            {/* Content Area */}
            {viewMode === 'map' ? (
                <div className="animate-in fade-in duration-300">
                    <MapView shipments={shipments} />
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    <ShipmentList
                        title="Active Shipments"
                        description="Track your shipments currently in transit."
                        emptyMessage="No active shipments found."
                        shipments={shipments}
                        isLoading={loading}
                        hideHeader={true}
                    // We are handling the container logic here, so list doesn't need to re-render header/title if we don't want it to
                    // But ShipmentList component includes the header inside it. 
                    // To avoid double header, we might need to adjust ShipmentList or just accept it's there.
                    // Actually, ShipmentList renders a header. 
                    // Our container also renders a header.
                    // So if we show our header AND ShipmentList (with header), we get double header.
                    // We should validly hide our container header in List view? Or hide ShipmentList header?
                    // Let's hide the Container header in List Mode? No, the Toggle is in the Container Header.
                    // We need the Toggle to stay visible.
                    // So we should probably modify ShipmentList to optionally hide its header.
                    />
                </div>
            )}
        </div>
    );
}
