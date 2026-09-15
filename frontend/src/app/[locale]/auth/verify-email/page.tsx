'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import AuthLayout from '@/components/layouts/AuthLayout';
import { fetchApi } from '@/lib/api';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        fetchApi(`/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'));
    }, [token]);

    return (
        <AuthLayout>
            <div className="text-center py-6">
                {status === 'checking' && (
                    <>
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white font-medium">Confirming your email...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-white text-xl font-bold mb-2">Email confirmed</h1>
                        <p className="text-gray-300 mb-6">Your email address is now verified.</p>
                        <Link href="/dashboard" className="text-blue-400 font-bold hover:underline">
                            Go to Dashboard &rarr;
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-white text-xl font-bold mb-2">Link invalid or expired</h1>
                        <p className="text-gray-300 mb-6">You can request a new confirmation email from your dashboard.</p>
                        <Link href="/dashboard" className="text-blue-400 font-bold hover:underline">
                            Go to Dashboard &rarr;
                        </Link>
                    </>
                )}
            </div>
        </AuthLayout>
    );
}
