'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';

interface WizardProps {
    initialData?: {
        email?: string;
        phone?: string;
        password?: string;
    };
}

export default function CarrierRegistrationWizard({ initialData }: WizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: initialData?.email || '',
        password: initialData?.password || '',
        phone: initialData?.phone || '',
        role: 'CARRIER',
        firstName: '',
        lastName: '',
        companyName: '',
        taxId: '',
        passportNumber: '',
        bankName: '',
        bankCode: '',
        bankAccount: '',
        currency: 'EUR',
        addressLine1: '',
        city: '',
        country: '',
        driverLicense: null as File | null,
        passport: null as File | null,
        insurance: null as File | null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            // Append text fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value && typeof value === 'string') {
                    data.append(key, value);
                }
            });

            // Append files
            if (formData.driverLicense) data.append('driverLicense', formData.driverLicense);
            if (formData.passport) data.append('passport', formData.passport);
            if (formData.insurance) data.append('insurance', formData.insurance);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                body: data,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const result = await response.json();
            localStorage.setItem('token', result.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    return (
        <div className="w-full max-w-2xl mx-auto glass p-10 rounded-3xl shadow-2xl text-gray-800">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 tracking-tight">Carrier Registration</h2>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-4 rounded-xl mb-6 backdrop-blur-sm">{error}</div>}

            <div className="mb-8 flex justify-between items-center text-sm font-medium px-4">
                <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200'}`}>1</div>
                    <span>Account</span>
                </div>
                <div className="h-1 flex-1 mx-4 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full bg-blue-500 transition-all duration-500 ${step >= 2 ? 'w-full' : step > 1 ? 'w-1/2' : 'w-0'}`}></div>
                </div>
                <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200'}`}>2</div>
                    <span>Company</span>
                </div>
                <div className="h-1 flex-1 mx-4 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full bg-blue-500 transition-all duration-500 ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${step >= 3 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200'}`}>3</div>
                    <span>Documents</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Account Details</h3>
                        <input
                            name="email" placeholder="Email Address" type="email" required
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            value={formData.email} onChange={handleChange}
                        />
                        <input
                            name="password" placeholder="Password" type="password" required
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            value={formData.password} onChange={handleChange}
                        />
                        <input
                            name="phone" placeholder="Phone Number" required
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            value={formData.phone} onChange={handleChange}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="firstName" placeholder="First Name" required
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.firstName} onChange={handleChange}
                            />
                            <input
                                name="lastName" placeholder="Last Name" required
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.lastName} onChange={handleChange}
                            />
                        </div>
                        <button type="button" onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02]">
                            Continue to Company
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Company & Bank Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="companyName" placeholder="Company Name (Optional)"
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.companyName} onChange={handleChange}
                            />
                            <input
                                name="taxId" placeholder="Tax ID"
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.taxId} onChange={handleChange}
                            />
                            <input
                                name="passportNumber" placeholder="Passport Number" required
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.passportNumber} onChange={handleChange}
                            />
                            <input
                                name="bankName" placeholder="Bank Name"
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.bankName} onChange={handleChange}
                            />
                            <input
                                name="bankAccount" placeholder="IBAN / Account Number"
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.bankAccount} onChange={handleChange}
                            />
                            <select
                                name="currency"
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.currency} onChange={handleChange}
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GEL">GEL</option>
                            </select>
                        </div>
                        <input
                            name="addressLine1" placeholder="Address Line 1" required
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            value={formData.addressLine1} onChange={handleChange}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                name="city" placeholder="City" required
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.city} onChange={handleChange}
                            />
                            <input
                                name="country" placeholder="Country" required
                                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.country} onChange={handleChange}
                            />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button type="button" onClick={prevStep} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 p-4 rounded-xl font-medium border border-gray-200 shadow-sm transition-all">Back</button>
                            <button type="button" onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02]">Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-xl font-semibold text-gray-700">Upload Documents</h3>

                        <div className="space-y-4">
                            {[
                                { label: 'Driver License', name: 'driverLicense' },
                                { label: 'Passport Copy', name: 'passport' },
                                { label: 'Insurance Policy', name: 'insurance' }
                            ].map((doc) => (
                                <div key={doc.name} className="border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 rounded-2xl hover:bg-blue-50/50 hover:border-blue-200 transition-all group cursor-pointer">
                                    <label className="block mb-2 font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{doc.label}</label>
                                    <input type="file" name={doc.name} onChange={handleFileChange} accept="image/*,.pdf" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={prevStep} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 p-4 rounded-xl font-medium border border-gray-200 shadow-sm transition-all">Back</button>
                            <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all transform hover:scale-[1.02]">
                                {loading ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
