'use client';

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    status: string;
    created_at: string;
}

export default function CarrierDashboardPage() {
    const t = useTranslations('Dashboard');
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadShipments = async () => {
            try {
                const data = await fetchApi('/shipments');
                // Filter for OPEN shipments if status logic exists, otherwise show all
                setShipments(data);
            } catch (error) {
                console.error('Failed to load shipments', error);
            } finally {
                setLoading(false);
            }
        };
        loadShipments();
    }, []);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Carrier Dashboard</h1>

            {/* Stats Overview (macOS Settings Style) */}
            <div className="w-full max-w-3xl">
                <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/30 hover:bg-white/40 transition-colors">
                        <span className="text-sm font-medium text-gray-900">Active Jobs</span>
                        <span className="text-sm text-gray-500">0</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/30 hover:bg-white/40 transition-colors">
                        <span className="text-sm font-medium text-gray-900">Total Earnings</span>
                        <span className="text-sm text-gray-500">€0.00</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-white/40 transition-colors">
                        <span className="text-sm font-medium text-gray-900">Fleet Size</span>
                        <span className="text-sm text-gray-500">0</span>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 px-2">
                    Start finding loads to increase your potential earnings.
                </p>
            </div>

            {/* Available Loads Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Available Loads</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Route</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Cargo</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Date Posted</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center">Loading...</td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No shipments found.</td>
                                </tr>
                            ) : (
                                shipments.map((shipment) => (
                                    <tr key={shipment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{shipment.pickup_address}</div>
                                            <div className="text-gray-400 text-xs">⬇ to</div>
                                            <div className="font-medium">{shipment.delivery_address}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>{shipment.cargo_type}</div>
                                            <div className="text-sm text-gray-500">{shipment.weight_kg} kg</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(shipment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
}
