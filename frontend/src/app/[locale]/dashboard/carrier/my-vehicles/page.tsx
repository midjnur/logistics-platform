'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

import { VehicleRegistrationWizard } from '@/components/vehicles/VehicleRegistrationWizard';

interface Vehicle {
    id: string;
    type: string;
    plate_number: string;
    capacity_kg: number;
    // Add other fields for display if needed
    make?: string;
    model?: string;
}

export default function MyVehiclesPage() {
    const t = useTranslations('Carrier');
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const loadVehicles = () => {
        fetchApi('/vehicles')
            .then(setVehicles)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadVehicles();
    }, []);

    const handleWizardComplete = () => {
        setShowAddForm(false);
        loadVehicles(); // Reload list to get new vehicle
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('myVehicles')}</h1>
                    <p className="text-gray-500 mt-1">Manage your fleet and transportation assets</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 ${showAddForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                    </svg>
                    {showAddForm ? 'Cancel' : t('addVehicle')}
                </button>
            </header>

            {showAddForm ? (
                <div className="mb-8">
                    <VehicleRegistrationWizard onComplete={handleWizardComplete} onCancel={() => setShowAddForm(false)} />
                </div>
            ) : (
                <div className="w-full">
                    {vehicles.length === 0 ? (
                        <div className="glass p-12 rounded-3xl shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200">
                            <div className="w-20 h-20 bg-blue-100/50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012 0m10 0a2 2 0 012 0" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No vehicles yet</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                Start by adding your first vehicle to unlock shipment offers.
                            </p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                                Register Vehicle
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {vehicles.map((vehicle) => (
                                <div key={vehicle.id} className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-300">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012 0m10 0a2 2 0 012 0" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-gray-900 text-xl">{vehicle.type}</h3>
                                                    {vehicle.make && <span className="text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-md text-sm">{vehicle.make} {vehicle.model}</span>}
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-lg text-sm font-mono font-bold border border-gray-200 tracking-wider">
                                                        {vehicle.plate_number}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${vehicle.capacity_kg && vehicle.capacity_kg > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {vehicle.capacity_kg && vehicle.capacity_kg > 0 ? 'Active' : 'Missing Info'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between w-full md:w-auto gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 mt-4 md:mt-0">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Capacity</p>
                                                <p className={`text-lg font-bold ${vehicle.capacity_kg ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {vehicle.capacity_kg ? `${vehicle.capacity_kg.toLocaleString()} kg` : 'Not Specified'}
                                                </p>
                                            </div>
                                            <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
