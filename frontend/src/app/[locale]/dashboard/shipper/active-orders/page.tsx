'use client';

import { useEffect, useState } from 'react';
import ShipmentList from '@/components/dashboard/ShipmentList';
import { fetchApi } from '@/lib/api';
import dynamic from 'next/dynamic';

const LiveTrackingMap = dynamic(() => import('@/components/tracking/LiveTrackingMap'), { ssr: false });

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    pickup_lat: number;
    pickup_lng: number;
    delivery_lat: number;
    delivery_lng: number;
    status: string;
}

export default function ActiveOrdersPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/shipments/my-shipments')
            .then((data: Shipment[]) => {
                const activeStatuses = [
                    'DRIVER_AT_PICKUP',
                    'LOADING_STARTED',
                    'LOADING_FINISHED',
                    'IN_TRANSIT',
                    'ARRIVED_DELIVERY',
                    'UNLOADING_FINISHED'
                ];
                const activeShipments = data.filter(s => activeStatuses.includes(s.status));
                setShipments(activeShipments);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (shipments.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No active shipments in transit.</h3>
                <a href="/dashboard/shipper/new-orders" className="text-blue-600 hover:underline">
                    Create a new shipment
                </a>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Active Shipments</h1>
            <p className="text-gray-600 mb-6">Track your shipments in real-time</p>
            <LiveTrackingMap shipments={shipments} />
        </div>
    );
}
