'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import StarRating from './StarRating';

interface Review {
    id: string;
    rating: number;
    comment?: string;
    created_at: string;
}

interface ShipmentReviewPanelProps {
    shipmentId: string;
}

export default function ShipmentReviewPanel({ shipmentId }: ShipmentReviewPanelProps) {
    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchApi(`/reviews/shipment/${shipmentId}`)
            .then(setReview)
            .catch(() => setReview(null))
            .finally(() => setLoading(false));
    }, [shipmentId]);

    const handleSubmit = async () => {
        if (rating < 1) {
            setError('Please select a star rating.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const created = await fetchApi('/reviews', {
                method: 'POST',
                body: JSON.stringify({ shipment_id: shipmentId, rating, comment: comment.trim() || undefined }),
            });
            setReview(created);
        } catch (err: any) {
            setError(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel p-6 rounded-3xl flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (review) {
        return (
            <div className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Your Review</h3>
                    <StarRating value={review.rating} readOnly size="sm" />
                </div>
                {review.comment && (
                    <p className="text-sm text-gray-600 italic bg-gray-50/80 rounded-lg p-3 border border-gray-100">
                        &ldquo;{review.comment}&rdquo;
                    </p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                    Submitted {new Date(review.created_at).toLocaleDateString()}
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Rate your carrier</h3>
            <p className="text-sm text-gray-500 mb-4">Your shipment was delivered — let others know how it went.</p>

            <StarRating value={rating} onChange={setRating} size="lg" />

            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment about your experience..."
                rows={3}
                className="mt-4 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-4 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-gray-900/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </div>
    );
}
