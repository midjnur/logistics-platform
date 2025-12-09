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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 bg-white shadow-md rounded">
            <h2 className="text-2xl font-bold mb-4">{t('login')}</h2>
            {error && <p className="text-red-500">{error}</p>}

            <div className="flex flex-col">
                <label className="mb-1">{t('email')}</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
            </div>

            <div className="flex flex-col">
                <label className="mb-1">{t('password')}</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 rounded"
                    required
                />
            </div>

            <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                {t('submit')}
            </button>

            <Link href="/auth/register" className="text-blue-500 text-sm text-center">
                {t('noAccount')}
            </Link>
        </form>
    );
}
