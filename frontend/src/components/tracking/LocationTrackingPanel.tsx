'use client';

import { useState } from 'react';

interface LocationTrackingPanelProps {
    shipmentId: string;
    isTracking: boolean;
    hasPermission: boolean | null;
    error: string | null;
    lastUpdate?: Date;
    onStartTracking: () => void;
    onStopTracking: () => void;
}

export default function LocationTrackingPanel({
    shipmentId,
    isTracking,
    hasPermission,
    error,
    lastUpdate,
    onStartTracking,
    onStopTracking,
}: LocationTrackingPanelProps) {
    const isHttpError = error && error.toLowerCase().includes('origin');
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl overflow-hidden transition-all">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isTracking ? 'bg-green-500 shadow-green-500/30 shadow-lg' : 'bg-gray-100'}`}>
                        {isTracking ? (
                            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                        ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">Location Sharing</h3>
                        <div className="flex flex-col">
                            <p className={`text-[10px] font-medium ${isTracking ? 'text-green-600' : 'text-gray-500'}`}>
                                {isTracking ? 'Live • Updating' : 'Off'}
                            </p>
                            {isTracking && lastUpdate && (
                                <p className="text-[9px] text-gray-400 font-mono mt-0.5 animate-pulse" key={lastUpdate.getTime()}>
                                    Sent: {lastUpdate.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={isTracking ? onStopTracking : onStartTracking}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 ${isTracking ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isTracking ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Compact Error / Info Section */}
            {(error || !isTracking) && (
                <div className="px-4 pb-4">
                    {error ? (
                        <div className="bg-red-50/80 rounded-xl p-3 border border-red-100">
                            <div className="flex items-start gap-2 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                                <div className="text-red-500 mt-0.5 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-red-700">Unable to Track</p>
                                    {showDetails && (
                                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                            <p className="text-[11px] text-red-600 leading-snug">{error}</p>
                                            {isHttpError && (
                                                <div className="mt-2 text-[10px] text-red-500 bg-white/50 p-2 rounded-lg">
                                                    <strong>Dev Note:</strong> Browser blocks location on insecure connections (http). Test on <code>localhost</code> or use HTTPS.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!showDetails && <p className="text-[10px] text-red-500 mt-0.5">Tap for details</p>}
                                </div>
                                <div className="text-red-400">
                                    <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[11px] text-gray-400 leading-relaxed text-center px-2">
                            Enable to share live location updates with the shipper.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
