'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    status: string;
    price: number;
    created_at: string;
}

export default function MyShipmentsPage() {
    const t = useTranslations('Shipper');
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/shipments')
            .then(setShipments)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">{t('myShipments')}</h1>
                    <button
                        onClick={() => router.push('/dashboard/shipper/create-shipment')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {t('createShipment')}
                    </button>
                </div>

                {shipments.length === 0 ? (
                    <div className="bg-white p-8 rounded shadow text-center">
                        <p className="text-gray-600">No shipments yet. Create your first shipment!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {shipments.map((shipment) => (
                            <div key={shipment.id} className="bg-white p-6 rounded shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{shipment.cargo_type}</h3>
                                        <p className="text-gray-600 mt-2">
                                            <span className="font-semibold">From:</span> {shipment.pickup_address}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-semibold">To:</span> {shipment.delivery_address}
                                        </p>
                                        <p className="text-gray-600 mt-2">
                                            <span className="font-semibold">Weight:</span> {shipment.weight_kg} kg
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded text-white ${shipment.status === 'DELIVERED' ? 'bg-green-600' :
                                            shipment.status === 'IN_TRANSIT' ? 'bg-blue-600' :
                                                shipment.status === 'OFFERED' ? 'bg-yellow-600' :
                                                    'bg-gray-600'
                                            }`}>
                                            {shipment.status}
                                        </span>
                                        {shipment.price && (
                                            <p className="text-xl font-bold mt-2">€{shipment.price}</p>
                                        )}
                                        {shipment.status === 'OPEN' && (
                                            <button
                                                onClick={() => router.push(`/dashboard/shipper/shipment-offers/${shipment.id}`)}
                                                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                                            >
                                                View Offers
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}
