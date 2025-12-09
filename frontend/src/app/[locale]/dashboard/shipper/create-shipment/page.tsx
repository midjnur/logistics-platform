'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

export default function CreateShipmentPage() {
    const t = useTranslations('Shipper');
    const router = useRouter();

    const [formData, setFormData] = useState({
        pickup_address: '',
        pickup_lat: 0,
        pickup_lng: 0,
        delivery_address: '',
        delivery_lat: 0,
        delivery_lng: 0,
        cargo_type: '',
        weight_kg: '',
        volume_m3: '',
        special_requirements: '',
    });

    const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const shipmentData = {
                ...formData,
                weight_kg: parseFloat(formData.weight_kg),
                volume_m3: formData.volume_m3 ? parseFloat(formData.volume_m3) : null,
                pickup_time: new Date().toISOString(),
                delivery_time: new Date(Date.now() + 86400000).toISOString(), // Next day
            };

            await fetchApi('/shipments', {
                method: 'POST',
                body: JSON.stringify(shipmentData),
            });

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create shipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto glass p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 tracking-tight text-center">{t('createShipment')}</h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-700 px-6 py-4 rounded-2xl mb-6 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pickup Location */}
                        <div className="group">
                            <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('pickupLocation')}</label>
                            <input
                                type="text"
                                name="pickup_address"
                                value={formData.pickup_address}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                placeholder="Enter pickup address"
                                required
                            />
                        </div>

                        {/* Delivery Location */}
                        <div className="group">
                            <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('deliveryLocation')}</label>
                            <input
                                type="text"
                                name="delivery_address"
                                value={formData.delivery_address}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                placeholder="Enter delivery address"
                                required
                            />
                        </div>

                        {/* Cargo Type */}
                        <div className="group">
                            <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('cargoType')}</label>
                            <input
                                type="text"
                                name="cargo_type"
                                value={formData.cargo_type}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="e.g., Electronics, Furniture"
                                required
                            />
                        </div>

                        {/* Weight */}
                        <div className="group">
                            <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('weight')}</label>
                            <input
                                type="number"
                                name="weight_kg"
                                value={formData.weight_kg}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Weight in kg"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        {/* Volume */}
                        <div className="group">
                            <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('volume')}</label>
                            <input
                                type="number"
                                name="volume_m3"
                                value={formData.volume_m3}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Volume in m³"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Special Requirements */}
                        <div className="group md:col-span-2">
                            <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('specialRequirements')}</label>
                            <textarea
                                name="special_requirements"
                                value={formData.special_requirements}
                                onChange={handleInputChange}
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Any special handling requirements..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {estimatedPrice && (
                        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
                            <p className="text-xl font-bold text-blue-900">
                                {t('estimatedPrice')}: €{estimatedPrice.toFixed(2)}
                            </p>
                        </div>
                    )}

                    <div className="mt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 bg-white/50 hover:bg-white text-gray-700 py-4 px-6 rounded-xl font-semibold border border-white/60 shadow-sm backdrop-blur-md transition-all duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : t('postShipment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
