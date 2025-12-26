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
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="text-center mb-2">
                <h2 className="text-3xl font-bold text-white mb-2">{t('register')}</h2>
                <p className="text-white/70 text-sm">Create your Logistics Platform account</p>
            </div>

            {error && <div className="bg-red-500/20 border border-red-300/30 text-red-200 p-3 rounded-lg text-sm">{error}</div>}

            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-medium">{t('email')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/10 border border-white/30 text-white placeholder-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-medium">{t('phone')}</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-white/10 border border-white/30 text-white placeholder-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        placeholder="+1 234 567 890"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-medium">{t('password')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/10 border border-white/30 text-white placeholder-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-white/90 text-sm font-medium">{t('role')}</label>
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-white/10 border border-white/30 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all appearance-none"
                        >
                            <option value="SHIPPER" className="bg-gray-800">{t('shipper')}</option>
                            <option value="CARRIER" className="bg-gray-800">{t('carrier')}</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/70">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-white text-blue-600 font-semibold p-3 rounded-lg hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
                {t('submit')}
            </button>

            <Link href="/auth/login" className="text-white/80 hover:text-white text-sm text-center transition-colors">
                {t('haveAccount')}
            </Link>
        </form>
    );
}
