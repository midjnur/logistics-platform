'use client';

const DESKTOP_VIDEO_URL = 'https://vzmssuwhgoxdndzgjftm.supabase.co/storage/v1/object/sign/Auth_Page_Backgrounds/donkey_nocking.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hYmM3Yjg4Yy1iZTA0LTQwNGQtYTQ4Yy04OWU0NjY3Mjc3NTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdXRoX1BhZ2VfQmFja2dyb3VuZHMvZG9ua2V5X25vY2tpbmcubXA0IiwiaWF0IjoxNzY3MzAwNjMxLCJleHAiOjE5MjQ5ODA2MzF9._YlbkdWQ-X1aRB0yooDJlKPlST8ht0REc4GkAoIe2ac';
const MOBILE_VIDEO_URL = DESKTOP_VIDEO_URL; // TODO: Replace with a vertical video URL for better mobile experience

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 -z-10 bg-black">
            {/* Desktop Video (Hidden on mobile) */}
            <video
                src={DESKTOP_VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
                className="hidden md:block absolute inset-0 w-full h-full object-cover"
            />

            {/* Mobile Video (Visible only on mobile) */}
            <video
                src={MOBILE_VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
                className="block md:hidden absolute inset-0 w-full h-full object-cover"
            />

            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/30 backdrop-blur-[2px]" />
        </div>
    );
}
