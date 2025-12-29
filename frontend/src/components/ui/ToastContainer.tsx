'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ToastPayload } from '@/lib/toast';

interface ToastItem extends Partial<ToastPayload> {
    id: string;
    isSocket?: boolean;
}

export default function ToastContainer() {
    const { notifications } = useSocket();
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Handle Socket Notifications
    useEffect(() => {
        if (notifications.length > 0) {
            const newest = notifications[0];
            const id = newest.id || `socket-${Date.now()}`;

            setToasts(prev => {
                if (prev.find(t => t.id === id)) return prev;
                return [...prev, {
                    id,
                    type: 'INFO',
                    title: newest.title,
                    message: newest.message,
                    isSocket: true
                }];
            });

            setTimeout(() => {
                removeToast(id);
            }, 6000); // Auto dismiss socket toasts
        }
    }, [notifications]);

    // Handle Custom Toasts
    useEffect(() => {
        const handleToast = (event: CustomEvent<ToastPayload>) => {
            const { type, title, message, duration } = event.detail;
            const id = `toast-${Date.now()}`;

            setToasts(prev => [...prev, { id, type, title, message }]);

            if (duration !== 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration || 4000);
            }
        };

        window.addEventListener('show-toast' as any, handleToast);
        return () => window.removeEventListener('show-toast' as any, handleToast);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => removeToast(toast.id)}
                    className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4 fade-in duration-300 cursor-pointer hover:bg-white/90 transition-all transform hover:scale-[1.02]"
                >
                    <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${toast.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                            toast.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                                toast.type === 'WARNING' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-blue-100 text-blue-600'
                        }`}>
                        {toast.type === 'SUCCESS' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        )}
                        {toast.type === 'ERROR' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {toast.type === 'WARNING' && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                        {(toast.type === 'INFO' || !toast.type) && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                        <h4 className="font-bold text-gray-900 text-[15px] leading-tight break-words">{toast.title}</h4>
                        {toast.message && (
                            <p className="text-[13px] text-gray-500 mt-1 font-medium leading-relaxed break-words">{toast.message}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
