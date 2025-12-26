'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';
import { Link, useRouter } from '@/i18n/routing';

export default function LoginForm() {
    const t = useTranslations('Auth');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const data = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            localStorage.setItem('token', data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            <div className="text-center mb-2">
                <h2 className="text-3xl font-bold text-white mb-2">{t('login')}</h2>
                <p className="text-white/70 text-sm">Welcome back to Logistics Platform</p>
            </div>

            {error && <p className="text-red-300 bg-red-500/20 p-3 rounded-lg text-sm">{error}</p>}

            <div className="flex flex-col gap-2">
                <label className="text-white/90 text-sm font-medium">{t('email')}</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border border-white/30 text-white placeholder-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    placeholder="your@email.com"
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

            <button
                type="submit"
                className="bg-white text-blue-600 font-semibold p-3 rounded-lg hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
                {t('submit')}
            </button>

            <Link href="/auth/register" className="text-white/80 hover:text-white text-sm text-center transition-colors">
                {t('noAccount')}
            </Link>
        </form>
    );
}
