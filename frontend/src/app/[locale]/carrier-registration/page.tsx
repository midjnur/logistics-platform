'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';

export default function CarrierRegistrationPage() {
    const t = useTranslations('Auth');
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        passport_number: '',
        passport_date_of_issue: '',
        driver_license_number: '',
        id_card_number: '',
        bank_name: '',
        bank_code: '',
        bank_account: '',
        currency: 'EUR',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        languages: [] as string[],
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLanguageToggle = (lang: string) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await fetchApi('/carriers/profile', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            alert('Carrier profile created successfully! You can now add vehicles and upload documents.');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create carrier profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">Complete Carrier Registration</h1>

                <div className="bg-white p-6 rounded shadow-md mb-6">
                    <div className="flex justify-between mb-8">
                        <div className={`flex-1 text-center ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                            1. Personal Info
                        </div>
                        <div className={`flex-1 text-center ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                            2. Bank Details
                        </div>
                        <div className={`flex-1 text-center ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                            3. Address
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold">First Name *</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">Last Name *</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold">Passport Number *</label>
                                        <input
                                            type="text"
                                            name="passport_number"
                                            value={formData.passport_number}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">Passport Issue Date *</label>
                                        <input
                                            type="date"
                                            name="passport_date_of_issue"
                                            value={formData.passport_date_of_issue}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2font-semibold">Driver License Number *</label>
                                        <input
                                            type="text"
                                            name="driver_license_number"
                                            value={formData.driver_license_number}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">ID Card Number</label>
                                        <input
                                            type="text"
                                            name="id_card_number"
                                            value={formData.id_card_number}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-2 font-semibold">Languages Spoken</label>
                                    <div className="flex gap-4">
                                        {['English', 'German', 'Georgian', 'Russian'].map(lang => (
                                            <label key={lang} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.languages.includes(lang)}
                                                    onChange={() => handleLanguageToggle(lang)}
                                                />
                                                {lang}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                                >
                                    Next →
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold mb-4">Bank Details</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold">Bank Name *</label>
                                        <input
                                            type="text"
                                            name="bank_name"
                                            value={formData.bank_name}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">Bank Code / BIC *</label>
                                        <input
                                            type="text"
                                            name="bank_code"
                                            value={formData.bank_code}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold">Account Number / IBAN *</label>
                                        <input
                                            type="text"
                                            name="bank_account"
                                            value={formData.bank_account}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">Currency *</label>
                                        <select
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        >
                                            <option value="EUR">EUR (€)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="GEL">GEL (₾)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold mb-4">Address</h2>

                                <div>
                                    <label className="block mb-2 font-semibold">Address Line 1 *</label>
                                    <input
                                        type="text"
                                        name="address_line1"
                                        value={formData.address_line1}
                                        onChange={handleInputChange}
                                        className="border p-2 rounded w-full"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 font-semibold">Address Line 2</label>
                                    <input
                                        type="text"
                                        name="address_line2"
                                        value={formData.address_line2}
                                        onChange={handleInputChange}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block mb-2 font-semibold">City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">State/Province</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-semibold">Postal Code *</label>
                                        <input
                                            type="text"
                                            name="postal_code"
                                            value={formData.postal_code}
                                            onChange={handleInputChange}
                                            className="border p-2 rounded w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-2 font-semibold">Country *</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="border p-2 rounded w-full"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        {loading ? 'Creating Profile...' : 'Complete Registration'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <h3 className="font-semibold mb-2">📋 Next Steps After Registration:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Upload required documents (passport, driver license, insurance, etc.)</li>
                        <li>Add your vehicles to your fleet</li>
                        <li>Wait for admin verification (24-48 hours)</li>
                        <li>Start accepting jobs!</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
