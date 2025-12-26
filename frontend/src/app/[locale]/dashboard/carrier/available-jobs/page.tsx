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
    pickup_time?: string;
}

export default function AvailableJobsPage() {
    const t = useTranslations('Carrier');
    const router = useRouter();
    const [jobs, setJobs] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadJobs = () => {
            fetchApi('/shipments')
                .then(data => setJobs(data.filter((s: Shipment) => s.status === 'OPEN')))
                .catch(console.error)
                .finally(() => setLoading(false));
        };

        loadJobs();

        // Auto-refresh every 60 seconds
        const interval = setInterval(loadJobs, 60000);

        return () => clearInterval(interval);
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
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('availableJobs')}</h1>
                    <p className="text-gray-500 mt-1">Browse and bid on available shipments</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white/50 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-white/80 transition-all font-medium text-sm flex items-center gap-2 border border-gray-200/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
                    <button className="bg-white/50 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-white/80 transition-all font-medium text-sm flex items-center gap-2 border border-gray-200/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Sort
                    </button>
                </div>
            </header>

            <div className="glass p-8 rounded-3xl shadow-sm min-h-[500px]">
                {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-blue-100/50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">No jobs available</h3>
                        <p className="text-gray-500 mt-2 max-w-sm">
                            Check back later for new shipment opportunities in your area.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="backdrop-blur-xl p-5 rounded-2xl border border-white/50 bg-white/40 transition-all hover:shadow-md group relative overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                                    {/* Left: Shipment Context */}
                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-3 mb-2">
                                            {/* Row 1: Cargo Type & Status */}
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                                                    {job.cargo_type}
                                                </span>
                                                <span className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-sm font-bold border border-green-100 uppercase tracking-wider">
                                                    Available
                                                </span>
                                            </div>

                                            {/* Row 2: Route */}
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span>{job.pickup_address.split(',')[0]}</span>
                                                </div>
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                <div className="flex items-center gap-1 text-gray-900 font-bold">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                    <span>{job.delivery_address.split(',')[0]}</span>
                                                </div>
                                            </div>

                                            {/* Row 3: Meta Data Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Weight</span>
                                                    <span className="font-semibold text-gray-700">{job.weight_kg} kg</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Pickup</span>
                                                    <span className="font-semibold text-gray-700">{job.pickup_time ? new Date(job.pickup_time).toLocaleDateString() : 'Flexible'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">Created</span>
                                                    <span className="font-semibold text-gray-700">{new Date(job.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-400 font-medium uppercase tracking-wider text-[10px]">ID</span>
                                                    <span className="font-mono text-gray-700">{job.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Price & Action */}
                                    <div className="flex flex-col items-end gap-4 justify-between min-w-[120px]">
                                        {job.price && (
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Est. Price</p>
                                                <span className="text-3xl font-bold text-gray-900">€{job.price.toLocaleString()}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleSubmitOffer(job.id)}
                                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            Submit Offer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
