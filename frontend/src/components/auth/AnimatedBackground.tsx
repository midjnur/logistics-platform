'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const frames = [
    '/auth-bg/frame1.png',
    '/auth-bg/frame2.png',
    '/auth-bg/frame3.png',
];

export default function AnimatedBackground() {
    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % frames.length);
        }, 3000); // Change frame every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 -z-10">
            {frames.map((frame, index) => (
                <Image
                    key={frame}
                    src={frame}
                    alt="Background"
                    fill
                    priority={index === 0}
                    className={`object-cover transition-opacity duration-1000 ${index === currentFrame ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                />
            ))}
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/30 backdrop-blur-[2px]" />
        </div>
    );
}
