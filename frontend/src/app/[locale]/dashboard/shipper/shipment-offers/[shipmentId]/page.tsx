'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';

interface Offer {
    id: string;
    carrier_id: string;
    offered_price: number;
    message: string;
    status: string;
    created_at: string;
}

export default function ShipmentOffersPage() {
    const t = useTranslations('Shipper');
    const router = useRouter();
    const params = useParams();
    const shipmentId = params.shipmentId as string;

    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (shipmentId) {
            fetchApi(`/offers/shipment/${shipmentId}`)
                .then(setOffers)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [shipmentId]);

    const handleAcceptOffer = async (offerId: string) => {
        if (!confirm('Accept this offer? This will reject all other offers.')) return;

        try {
            await fetchApi(`/offers/${offerId}/accept`, { method: 'PATCH' });
            // Reject all other offers
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
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-6">Offers for Shipment</h1>

                {offers.length === 0 ? (
                    <div className="bg-white p-8 rounded shadow text-center">
                        <p className="text-gray-600">No offers received yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                className={`bg-white p-6 rounded shadow ${offer.status === 'ACCEPTED' ? 'border-2 border-green-500' :
                                    offer.status === 'REJECTED' ? 'opacity-50' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xl font-bold text-green-600">€{offer.offered_price}</p>
                                        <p className="text-gray-600 mt-2">
                                            <span className="font-semibold">Carrier ID:</span> {offer.carrier_id.substring(0, 8)}...
                                        </p>
                                        {offer.message && (
                                            <p className="text-gray-600 mt-2">
                                                <span className="font-semibold">Message:</span> {offer.message}
                                            </p>
                                        )}
                                        <p className="text-gray-500 text-sm mt-2">
                                            Submitted: {new Date(offer.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className={`px-3 py-1 rounded text-white ${offer.status === 'ACCEPTED' ? 'bg-green-600' :
                                            offer.status === 'REJECTED' ? 'bg-red-600' :
                                                'bg-yellow-600'
                                            }`}>
                                            {offer.status}
                                        </span
                                        >
                                        {offer.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptOffer(offer.id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectOffer(offer.id)}
                                                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => router.push('/dashboard/shipper/my-shipments')}
                    className="mt-6 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    ← Back to My Shipments
                </button>
            </div>
        </div>
    );
}
