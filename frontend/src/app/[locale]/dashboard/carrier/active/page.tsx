'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import ShipmentProgressControl from '@/components/dashboard/ShipmentProgressControl';
import LocationTrackingPanel from '@/components/tracking/LocationTrackingPanel';
import { useSocket } from '@/context/SocketContext';

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
    pickup_time: string;
    weight_kg: number;
    status: string;
    cargo_type: string;
    price: number;
    distance?: number;
    created_at: string;
    offers?: Offer[];
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

    // Tracking Logic
    const { socket } = useSocket();
    const [trackingShipments, setTrackingShipments] = useState<Set<string>>(new Set());
    const [trackingError, setTrackingError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [lastUpdates, setLastUpdates] = useState<Record<string, Date>>({});
    const watchIds = useRef<Record<string, number>>({});

    const loadShipments = () => {
        fetchApi('/shipments/my-shipments')
            .then(data => setShipments(data.filter((s: Shipment) => ACTIVE_STATUSES.includes(s.status))))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadShipments();
        return () => {
            // Cleanup all watchers on unmount
            Object.values(watchIds.current).forEach(id => navigator.geolocation.clearWatch(id));
        };
    }, []);

    const startTracking = (shipmentId: string) => {
        if (!socket) {
            setTrackingError('Connection lost. Reconnecting...');
            return;
        }

        if (!navigator.geolocation) {
            setTrackingError('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setHasPermission(true);
                setTrackingError(null);

                // Add acknowledgement callback
                socket.emit('location-update', {
                    shipmentId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    speed: position.coords.speed,
                    heading: position.coords.heading,
                    timestamp: position.timestamp
                }, (response: any) => {
                    if (response?.success) {
                        setLastUpdates(prev => ({ ...prev, [shipmentId]: new Date() }));
                    }
                });
            },
            (error) => {
                console.error('Tracking error:', error);
                setHasPermission(false);
                setTrackingError(error.message);
                stopTracking(shipmentId);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        watchIds.current[shipmentId] = watchId;
        setTrackingShipments(prev => new Set(prev).add(shipmentId));
    };

    const stopTracking = (shipmentId: string) => {
        const watchId = watchIds.current[shipmentId];
        if (watchId !== undefined) {
            navigator.geolocation.clearWatch(watchId);
            delete watchIds.current[shipmentId];
        }
        setTrackingShipments(prev => {
            const next = new Set(prev);
            next.delete(shipmentId);
            return next;
        });
    };

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
                <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                    <div className="grid gap-6">
                        {shipments.map((shipment) => (
                            <div key={shipment.id} className="backdrop-blur-xl p-5 rounded-2xl border transition-all hover:shadow-md group relative overflow-hidden bg-white/40 border-white/50">
                                {/* Grid Layout to match standard card structure */}
                                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                    {/* Left: Shipment Context */}
                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-3 mb-2">
                                            {/* Row 1: Cargo Type & Status */}
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                    {shipment.cargo_type}
                                                </span>
                                                {/* Dynamic Status Badge */}
                                                {shipment.status === 'DRIVER_AT_PICKUP' && <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100 uppercase tracking-wider">Driver Arrived</span>}
                                                {shipment.status === 'LOADING_STARTED' && <span className="px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-700 text-sm font-bold border border-indigo-200 uppercase tracking-wider">Loading</span>}
                                                {shipment.status === 'LOADING_FINISHED' && <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 uppercase tracking-wider">Loading Done</span>}
                                                {shipment.status === 'IN_TRANSIT' && <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold border border-blue-200 uppercase tracking-wider">In Transit</span>}
                                                {shipment.status === 'ARRIVED_DELIVERY' && <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100 uppercase tracking-wider">At Delivery</span>}
                                                {shipment.status === 'UNLOADING_FINISHED' && <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 text-sm font-bold border border-purple-200 uppercase tracking-wider">Unloading Done</span>}
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
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Distance</span>
                                                    <span className="font-semibold text-gray-700">{shipment.distance ? `${shipment.distance.toLocaleString()} km` : '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created</span>
                                                    <span className="font-semibold text-gray-700">{new Date(shipment.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {shipment.offers && shipment.offers.length > 0 && (
                                                    <>
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
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">ID</span>
                                                    <span className="font-mono text-gray-700">{shipment.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Progress Control & Earnings */}
                                    <div className="w-full md:w-auto flex flex-col md:items-end justify-between gap-6 md:min-w-[280px] md:border-l border-gray-100 md:pl-6 md:border-dashed mt-6 md:mt-0">
                                        <div className="flex items-center justify-between w-full md:block md:text-right">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 md:mb-1">Total Earnings</p>
                                            <span className="text-3xl font-black text-gray-900 tracking-tight">€{(shipment.price || shipment.offers?.find((o: Offer) => o.status === 'ACCEPTED')?.offered_price || 0).toLocaleString()}</span>
                                        </div>

                                        <div className="w-full bg-white/50 rounded-xl p-2 border border-gray-100 space-y-4">
                                            <ShipmentProgressControl
                                                shipment={shipment}
                                                onStatusUpdate={loadShipments}
                                            />

                                            {/* Location Tracking Panel */}
                                            <LocationTrackingPanel
                                                shipmentId={shipment.id}
                                                isTracking={trackingShipments.has(shipment.id)}
                                                hasPermission={hasPermission}
                                                error={trackingError}
                                                lastUpdate={lastUpdates[shipment.id]}
                                                onStartTracking={() => startTracking(shipment.id)}
                                                onStopTracking={() => stopTracking(shipment.id)}
                                            />
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
