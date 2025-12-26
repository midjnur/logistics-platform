'use client';

import { ReactNode } from 'react';
import AnimatedBackground from '@/components/auth/AnimatedBackground';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Content */}
            <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
                {/* Glassmorphism Container */}
                <div className="w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
