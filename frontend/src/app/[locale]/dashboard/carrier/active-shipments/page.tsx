'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import DocumentUpload from '@/components/documents/DocumentUpload';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    status: string;
    cargo_type: string;
    weight_kg: number;
    pickup_time?: string;
    delivery_time?: string;
}

export default function ActiveShipmentsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadShipments();
    }, []);

    const loadShipments = async () => {
        try {
            const data = await fetchApi('/shipments');
            // Filter for active shipments (OFFERED or IN_TRANSIT)
            const active = data.filter((s: Shipment) =>
                ['OFFERED', 'IN_TRANSIT'].includes(s.status)
            );
            setShipments(active);
        } catch (err) {
            console.error('Failed to load shipments:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to update status to ${newStatus}?`)) return;

        try {
            await fetchApi(`/shipments/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            loadShipments(); // Refresh list
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Active Shipments</h1>

            {shipments.length === 0 ? (
                <div className="text-gray-500">No active shipments found.</div>
            ) : (
                <div className="grid gap-6">
                    {shipments.map(shipment => (
                        <div key={shipment.id} className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${shipment.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {shipment.status}
                                        </span>
                                        <span className="text-gray-500 text-sm">ID: {shipment.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="font-bold text-lg">{shipment.cargo_type} ({shipment.weight_kg} kg)</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Pickup</p>
                                    <p className="font-medium">{shipment.pickup_address}</p>
                                    {shipment.pickup_time && (
                                        <p className="text-xs text-green-600">Picked up: {new Date(shipment.pickup_time).toLocaleString()}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Delivery</p>
                                    <p className="font-medium">{shipment.delivery_address}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex justify-end gap-3">
                                {shipment.status === 'OFFERED' && (
                                    <button
                                        onClick={() => updateStatus(shipment.id, 'IN_TRANSIT')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Confirm Pickup (Start Transit)
                                    </button>
                                )}

                                {shipment.status === 'IN_TRANSIT' && (
                                    <div className="flex flex-col items-end gap-2 w-full">
                                        <div className="w-full bg-gray-50 p-4 rounded border">
                                            <h4 className="font-semibold mb-2 text-sm">Required for Delivery: Upload POD / CMR</h4>
                                            {/* We reuse DocumentUpload but ideally we should link it to shipment_id.
                          For now, carriers upload to their profile documents.
                          TODO: Update DocumentUpload to support shipment_id prop */}
                                            <DocumentUpload
                                                shipmentId={shipment.id}
                                                allowedTypes={['CMR', 'OTHER']}
                                            />
                                        </div>

                                        <button
                                            onClick={() => updateStatus(shipment.id, 'DELIVERED')}
                                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full md:w-auto"
                                        >
                                            Confirm Delivery
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
