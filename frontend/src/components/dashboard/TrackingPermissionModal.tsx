'use client';

import { useState, useEffect } from 'react';

interface TrackingPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPermissionGranted: () => void;
}

export default function TrackingPermissionModal({ isOpen, onClose, onPermissionGranted }: TrackingPermissionModalProps) {
    const [step, setStep] = useState<'intro' | 'requesting' | 'error'>('intro');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGrantPermission = () => {
        setStep('requesting');

        if (!navigator.geolocation) {
            setErrorMsg("Geolocation is not supported by your browser.");
            setStep('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success!
                onPermissionGranted();
                onClose();
            },
            (err) => {
                console.error("Geolocation error:", err);
                let msg = "We couldn't access your location.";

                if (err.code === 1) { // PERMISSION_DENIED
                    msg = "Location permission was denied. Please enable it in your browser settings.";
                } else if (err.message.includes("Origin") || err.message.includes("secure")) {
                    msg = "Browser security blocks location on HTTP. Please use HTTPS or localhost.";
                }

                setErrorMsg(msg);
                setStep('error');
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="relative z-10 text-center">
                    {step === 'intro' && (
                        <>
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enable Location Tracking</h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                To receive shipments and let shippers track your delivery progress, we need access to your location while you are online.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleGrantPermission}
                                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95"
                                >
                                    Allow Location Access
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 px-4 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>

                            {!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.protocol !== 'https:' && (
                                <p className="mt-6 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    ⚠️ You are not using a secure connection (HTTPS). Some browsers may block location access.
                                </p>
                            )}
                        </>
                    )}

                    {step === 'requesting' && (
                        <div className="py-12">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Requesting permission...</p>
                            <p className="text-sm text-gray-400 mt-2">Please click "Allow" in your browser popup.</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                            <p className="text-gray-500 mb-4 text-sm">{errorMsg}</p>

                            {!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.protocol !== 'https:' && (
                                <div className="text-left bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 text-xs text-gray-700">
                                    <strong>How to fix on Chrome (Android):</strong>
                                    <ol className="list-decimal list-inside mt-1 space-y-1">
                                        <li>Go to <code>chrome://flags</code></li>
                                        <li>Search <strong>"insecure origins treated as secure"</strong></li>
                                        <li>Enable it & add: <code>{window.location.origin}</code></li>
                                        <li>Relaunch Chrome</li>
                                    </ol>
                                </div>
                            )}

                            <button
                                onClick={() => setStep('intro')}
                                className="w-full py-3 px-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 px-4 text-gray-500 font-medium mt-2 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
