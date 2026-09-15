'use client';

import { useState } from 'react';

interface CounterOfferPanelProps {
    onSubmit: (price: number, message?: string) => Promise<void>;
    onCancel: () => void;
    initialPrice?: number;
}

export default function CounterOfferPanel({ onSubmit, onCancel, initialPrice }: CounterOfferPanelProps) {
    const [price, setPrice] = useState(initialPrice ? String(initialPrice) : '');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const parsed = parseFloat(price);
        if (!parsed || parsed <= 0) {
            setError('Enter a valid price');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit(parsed, message.trim() || undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to submit counter-offer');
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold">€</span>
                <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Your counter price"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                />
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Optional message"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-gray-500 font-bold text-xs hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Sending...' : 'Send Counter-Offer'}
                </button>
            </div>
        </div>
    );
}
