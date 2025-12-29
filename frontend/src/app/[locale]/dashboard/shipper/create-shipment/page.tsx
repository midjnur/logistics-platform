'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import { WizardStepIndicator } from '@/components/ui/WizardStepIndicator';

// Step Components (will be moved to separate files later if large)
import RouteStep from './steps/RouteStep';
import CargoStep from './steps/CargoStep';
import RequirementsStep from './steps/RequirementsStep';
import DetailsStep from './steps/DetailsStep';

export default function CreateShipmentPage() {
    const t = useTranslations('Shipper');
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Scroll to top on step change for better mobile UX
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // Initial State matching the new schema
    const [formData, setFormData] = useState({
        // Step 1: Route
        pickup_address: '',
        pickup_time: '',
        delivery_address: '',
        delivery_time: '',
        pickup_lat: 0,
        pickup_lng: 0,
        delivery_lat: 0,
        delivery_lng: 0,
        distance: 0,

        // Step 2: Cargo
        cargo_type: '',
        hs_code: '',
        weight_kg: '',
        volume_m3: '',
        internal_length: '',
        internal_width: '',
        internal_height: '',
        cbm: '',

        // Step 3: Requirements
        temperature_control: false,
        loading_type: '', // 'Standard', 'Back', etc.
        has_tir: false,
        has_cmr: false,
        has_waybill: false,
        export_declaration: 'NONE',

        // Step 4: Details
        shipper_details: { company: '', address: '' },
        consignee_details: { company: '', address: '' },
        value_of_goods: '',
        value_currency: 'EUR',
        payment_terms: '30_DAYS',
        special_requirements: ''
    });

    const steps = [
        {
            title: 'Journey',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
            isActive: currentStep === 0, isCompleted: currentStep > 0
        },
        {
            title: 'Cargo',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
            isActive: currentStep === 1, isCompleted: currentStep > 1
        },
        {
            title: 'Reqs',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            isActive: currentStep === 2, isCompleted: currentStep > 2
        },
        {
            title: 'Details',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" /></svg>,
            isActive: currentStep === 3, isCompleted: currentStep > 3
        },
    ];

    const updateData = (newData: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Transform data for API if needed
            const payload = {
                ...formData,
                weight_kg: parseFloat(formData.weight_kg) || 0,
                distance: formData.distance || 0,
            };

            await fetchApi('/shipments', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to create shipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Shipment</h1>
                    <p className="text-gray-500 mt-2">Fill in the details to publish your load to the carrier network.</p>
                </div>

                <WizardStepIndicator steps={steps} currentStep={currentStep} />

                <div className="glass p-8 rounded-3xl shadow-xl min-h-[500px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col"
                        >
                            {currentStep === 0 && <RouteStep data={formData} update={updateData} />}
                            {currentStep === 1 && <CargoStep data={formData} update={updateData} />}
                            {currentStep === 2 && <RequirementsStep data={formData} update={updateData} />}
                            {currentStep === 3 && <DetailsStep data={formData} update={updateData} />}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex justify-between pt-6 border-t border-gray-100">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className={`px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 0
                                ? 'opacity-0 cursor-default'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Back
                        </button>

                        {currentStep === steps.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transform hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center gap-2"
                            >
                                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Publish Shipment
                            </button>
                        ) : (
                            <button
                                onClick={nextStep}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:scale-[1.02] transition-all flex items-center gap-2"
                            >
                                Next Step
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

