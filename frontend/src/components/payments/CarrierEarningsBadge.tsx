'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface EarningsSummary {
    totalPaid: number;
    paidCount: number;
    totalPending: number;
    pendingCount: number;
}

export default function CarrierEarningsBadge() {
    const [summary, setSummary] = useState<EarningsSummary | null>(null);

    useEffect(() => {
        fetchApi('/payments/carrier/earnings-summary')
            .then(setSummary)
            .catch(() => setSummary(null));
    }, []);

    if (!summary) return null;

    return (
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <div>
                <p className="text-[10px] text-emerald-600/70 uppercase font-bold tracking-wider">Earned</p>
                <p className="text-sm font-black text-emerald-900">&euro;{summary.totalPaid.toLocaleString()}</p>
            </div>
            {summary.totalPending > 0 && (
                <div className="border-l border-emerald-200 pl-4">
                    <p className="text-[10px] text-emerald-600/70 uppercase font-bold tracking-wider">Pending</p>
                    <p className="text-sm font-bold text-emerald-700">&euro;{summary.totalPending.toLocaleString()}</p>
                </div>
            )}
        </div>
    );
}
