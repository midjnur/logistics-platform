'use client';

import { useState } from 'react';

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps['size']>, string> = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
};

export default function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const display = hovered ?? value;
    const sizeClass = SIZE_CLASSES[size];

    return (
        <div className="flex items-center gap-1" role={readOnly ? undefined : 'radiogroup'} aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readOnly}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-checked={value === star}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readOnly && setHovered(star)}
                    onMouseLeave={() => !readOnly && setHovered(null)}
                    className={`${readOnly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}`}
                >
                    <svg
                        viewBox="0 0 20 20"
                        className={`${sizeClass} ${star <= display ? 'fill-amber-400 stroke-amber-400' : 'fill-transparent stroke-gray-300'}`}
                        strokeWidth={1.5}
                    >
                        <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85L10 1.5z" strokeLinejoin="round" />
                    </svg>
                </button>
            ))}
        </div>
    );
}
