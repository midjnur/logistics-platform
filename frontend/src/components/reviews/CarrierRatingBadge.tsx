'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import StarRating from './StarRating';

interface CarrierRatingBadgeProps {
    carrierId: string;
    compact?: boolean;
}

export default function CarrierRatingBadge({ carrierId, compact = false }: CarrierRatingBadgeProps) {
    const [summary, setSummary] = useState<{ averageRating: number; totalReviews: number } | null>(null);

    useEffect(() => {
        if (!carrierId) return;
        fetchApi(`/reviews/carrier/${carrierId}/summary`)
            .then(setSummary)
            .catch(() => setSummary(null));
    }, [carrierId]);

    if (!summary || summary.totalReviews === 0) {
        if (compact) {
            return <span className="text-[11px] text-gray-400 font-medium">No reviews yet</span>;
        }
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-sm text-gray-400 font-medium">No reviews yet</span>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1.5">
                <StarRating value={Math.round(summary.averageRating)} readOnly size="sm" />
                <span className="text-xs font-bold text-gray-700">{summary.averageRating.toFixed(1)}</span>
                <span className="text-[11px] text-gray-400">({summary.totalReviews})</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <StarRating value={Math.round(summary.averageRating)} readOnly size="sm" />
            <div className="leading-tight">
                <span className="text-sm font-bold text-gray-900">{summary.averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-500 ml-1">({summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'})</span>
            </div>
        </div>
    );
}
