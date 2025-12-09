'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { Link, useRouter } from '@/i18n/routing';
import CarrierRegistrationWizard from '../auth/CarrierRegistrationWizard';

export default function RegisterForm() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('SHIPPER');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const data = await fetchApi('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, phone, password, role }),
            });
            localStorage.setItem('token', data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (role === 'CARRIER') {
        return (
            <div className="w-full">
                <button
                    onClick={() => setRole('SHIPPER')}
                    className="mb-4 text-blue-600 underline text-sm"
                >
                    ← Back to Standard Registration
                </button>
                <CarrierRegistrationWizard initialData={{ email, phone, password }} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-md mx-auto p-10 glass rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 tracking-tight">{t('register')}</h2>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-4 rounded-xl backdrop-blur-sm text-center">{error}</div>}

            <div className="space-y-5">
                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('email')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('phone')}</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        placeholder="+1 234 567 890"
                        required
                    />
                </div>

                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('password')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">{t('role')}</label>
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
                        >
                            <option value="SHIPPER">{t('shipper')}</option>
                            <option value="CARRIER">{t('carrier')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] mt-4">
                {t('submit')}
            </button>

            <Link href="/auth/login" className="block text-center text-gray-600 hover:text-blue-600 font-medium transition-colors mt-2">
                {t('haveAccount')}
            </Link>
        </form>
    );
}
