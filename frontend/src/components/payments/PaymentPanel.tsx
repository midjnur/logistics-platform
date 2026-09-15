'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
    due_date?: string;
    paid_at?: string;
}

interface PaymentPanelProps {
    shipmentId: string;
    justReturnedStatus?: 'success' | 'cancelled' | null;
}

export default function PaymentPanel({ shipmentId, justReturnedStatus }: PaymentPanelProps) {
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        fetchApi(`/payments/shipment/${shipmentId}`)
            .then(setPayment)
            .catch(() => setPayment(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentId]);

    useEffect(() => {
        if (justReturnedStatus === 'success') {
            // Webhook may take a moment to land — poll briefly for the PAID status.
            const interval = setInterval(load, 2000);
            const timeout = setTimeout(() => clearInterval(interval), 15000);
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [justReturnedStatus]);

    const handlePay = async () => {
        setRedirecting(true);
        setError(null);
        try {
            const { url } = await fetchApi(`/payments/checkout/${shipmentId}`, { method: 'POST' });
            window.location.href = url;
        } catch (err: any) {
            setError(err.message || 'Failed to start checkout');
            setRedirecting(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-center h-24">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const status = payment?.status ?? 'PENDING';

    return (
        <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">Payment</h3>
                {status === 'PAID' && (
                    <span className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100 uppercase">Paid</span>
                )}
                {status === 'PROCESSING' && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase">Processing</span>
                )}
                {status === 'PENDING' && (
                    <span className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-100 uppercase">Pending</span>
                )}
                {status === 'FAILED' && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100 uppercase">Failed</span>
                )}
            </div>

            {payment && (
                <p className="text-2xl font-black text-gray-900 mt-2">
                    &euro;{Number(payment.amount).toLocaleString()}
                </p>
            )}

            {status === 'PAID' && payment?.paid_at && (
                <p className="text-sm text-gray-500 mt-1">Paid on {new Date(payment.paid_at).toLocaleDateString()}</p>
            )}

            {payment?.due_date && status !== 'PAID' && (
                <p className="text-sm text-gray-500 mt-1">Due {new Date(payment.due_date).toLocaleDateString()}</p>
            )}

            {justReturnedStatus === 'success' && status !== 'PAID' && (
                <p className="text-sm text-blue-600 mt-2">Confirming your payment with Stripe&hellip;</p>
            )}
            {justReturnedStatus === 'cancelled' && (
                <p className="text-sm text-gray-500 mt-2">Checkout was cancelled &mdash; no charge was made.</p>
            )}

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            {status !== 'PAID' && (
                <button
                    onClick={handlePay}
                    disabled={redirecting}
                    className="mt-4 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-gray-900/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {redirecting ? 'Redirecting to Stripe...' : 'Pay Now'}
                </button>
            )}
        </div>
    );
}
