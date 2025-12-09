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
}

export default function AvailableJobsPage() {
    const t = useTranslations('Carrier');
    const router = useRouter();
    const [jobs, setJobs] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/shipments')
            .then(data => setJobs(data.filter((s: Shipment) => s.status === 'OPEN')))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSubmitOffer = async (jobId: string) => {
        const priceInput = prompt('Enter your offer price (€):');
        if (!priceInput) return;

        const offeredPrice = parseFloat(priceInput);
        if (isNaN(offeredPrice) || offeredPrice <= 0) {
            alert('Please enter a valid price');
            return;
        }

        const message = prompt('Optional message for the shipper:') || '';

        try {
            await fetchApi('/offers', {
                method: 'POST',
                body: JSON.stringify({
                    shipment_id: jobId,
                    offered_price: offeredPrice,
                    message,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                }),
            });
            alert('Offer submitted successfully!');
            // Optionally, remove the job from the list after an offer is submitted
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (err) {
            alert('Failed to submit offer');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-6">{t('availableJobs')}</h1>

                {jobs.length === 0 ? (
                    <div className="bg-white p-8 rounded shadow text-center">
                        <p className="text-gray-600">No available jobs at the moment.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-white p-6 rounded shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{job.cargo_type}</h3>
                                        <p className="text-gray-600 mt-2">
                                            <span className="font-semibold">📍 From:</span> {job.pickup_address}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-semibold">📍 To:</span> {job.delivery_address}
                                        </p>
                                        <p className="text-gray-600 mt-2">
                                            <span className="font-semibold">⚖️ Weight:</span> {job.weight_kg} kg
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {job.price && (
                                            <p className="text-2xl font-bold text-green-600 mb-4">€{job.price}</p>
                                        )}
                                        <button
                                            onClick={() => handleSubmitOffer(job.id)}
                                            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                                        >
                                            Submit Offer
                                        </button>
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
