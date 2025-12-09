'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

interface Vehicle {
    id: string;
    type: string;
    plate_number: string;
    capacity_kg: number;
}

export default function MyVehiclesPage() {
    const t = useTranslations('Carrier');
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'TRUCK',
        plate_number: '',
        capacity_kg: '',
    });

    useEffect(() => {
        fetchApi('/vehicles')
            .then(setVehicles)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newVehicle = await fetchApi('/vehicles', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    capacity_kg: parseFloat(formData.capacity_kg),
                }),
            });
            setVehicles(prev => [...prev, newVehicle]);
            setFormData({ type: 'TRUCK', plate_number: '', capacity_kg: '' });
            setShowAddForm(false);
        } catch (err) {
            alert('Failed to add vehicle');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">{t('myVehicles')}</h1>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {showAddForm ? 'Cancel' : t('addVehicle')}
                    </button>
                </div>

                {showAddForm && (
                    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white/40 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">New Vehicle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicleType')}</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="VAN">Van</option>
                                    <option value="TRUCK">Truck</option>
                                    <option value="TRAILER">Trailer</option>
                                    <option value="SPRINTER">Sprinter</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('plateNumber')}</label>
                                <input
                                    type="text"
                                    value={formData.plate_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                                    className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    required
                                    placeholder="e.g. B-12345"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('capacity')}</label>
                                <input
                                    type="number"
                                    value={formData.capacity_kg}
                                    onChange={(e) => setFormData(prev => ({ ...prev, capacity_kg: e.target.value }))}
                                    className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    required
                                    placeholder="kg"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                Add Vehicle
                            </button>
                        </div>
                    </form>
                )}

                <div className="w-full max-w-4xl">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-xl shadow-sm overflow-hidden">
                        {vehicles.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No vehicles registered yet.
                            </div>
                        ) : (
                            vehicles.map((vehicle, index) => (
                                <div key={vehicle.id} className={`flex items-center justify-between px-6 py-4 hover:bg-white/40 transition-colors ${index !== vehicles.length - 1 ? 'border-b border-gray-200/30' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012 0m10 0a2 2 0 012 0" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{vehicle.type}</p>
                                            <p className="text-xs text-gray-500">Plate: {vehicle.plate_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{vehicle.capacity_kg} kg</p>
                                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {vehicles.length === 0 && (
                        <p className="mt-2 text-xs text-gray-500 px-2">
                            Add your fleet vehicles to verify your capacity.
                        </p>
                    )}
                </div>

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
