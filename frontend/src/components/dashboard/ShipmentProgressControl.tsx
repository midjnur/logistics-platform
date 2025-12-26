'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api';

interface Shipment {
    id: string;
    status: string;
}

interface ShipmentProgressControlProps {
    shipment: Shipment;
    onStatusUpdate: () => void;
}

const STEPS = [
    { status: 'ASSIGNED', label: 'Assigned', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { status: 'DRIVER_AT_PICKUP', label: 'Driver Arrived', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { status: 'LOADING_STARTED', label: 'Loading', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { status: 'LOADING_FINISHED', label: 'Loading Done', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { status: 'IN_TRANSIT', label: 'In Transit', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }, // This happens after picking docs
    { status: 'ARRIVED_DELIVERY', label: 'At Delivery', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { status: 'UNLOADING_FINISHED', label: 'Unloading Done', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { status: 'DELIVERED', label: 'Completed', icon: 'M5 13l4 4L19 7' },
];

const DOC_TYPES = {
    LOADING: [
        { type: 'INVOICE', label: 'Invoice' },
        { type: 'PACKING_LIST', label: 'Packing List' },
        { type: 'EXPORT_DECLARATION', label: 'Export Declaration' },
        { type: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin(Optional)' },
        { type: 'OTHER', label: 'Other Documents' }
    ],
    UNLOADING: [
        { type: 'CMR', label: 'Signed CMR (Cell 24)' }
    ]
};

export default function ShipmentProgressControl({ shipment, onStatusUpdate }: ShipmentProgressControlProps) {
    const currentStepIndex = STEPS.findIndex(s => s.status === shipment.status);
    const [uploading, setUploading] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState<string[]>([]); // simplified tracking

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            await fetchApi(`/shipments/${shipment.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            onStatusUpdate();
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('type', type);
        formData.append('shipmentId', shipment.id);

        try {
            // Updated endpoint to match backend controller
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            setUploadedDocs([...uploadedDocs, type]);
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const renderActionArea = () => {
        switch (shipment.status) {
            case 'ASSIGNED':
                return (
                    // Handled in Upcoming page usually, but if here:
                    <button
                        onClick={() => handleStatusUpdate('DRIVER_AT_PICKUP')}
                        className="btn-primary"
                    >
                        Driver Arrived at Pickup
                    </button>
                );
            case 'DRIVER_AT_PICKUP':
                return (
                    <button
                        onClick={() => handleStatusUpdate('LOADING_STARTED')}
                        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Start Loading
                    </button>
                );
            case 'LOADING_STARTED':
                return (
                    <button
                        onClick={() => handleStatusUpdate('LOADING_FINISHED')}
                        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        Finish Loading
                    </button>
                );
            case 'LOADING_FINISHED':
                const requiredLoadingDocs = ['INVOICE', 'PACKING_LIST', 'EXPORT_DECLARATION'];
                const hasRequiredLoadingDocs = requiredLoadingDocs.every(t => uploadedDocs.includes(t));

                return (
                    <div className="space-y-4 w-full">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                            <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Required Documents
                            </h4>
                            <p className="text-sm text-orange-600 mb-4">You must upload photos of these documents before proceeding.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {DOC_TYPES.LOADING.map(doc => (
                                    <div key={doc.type} className={`p-3 rounded-lg border flex items-center justify-between ${uploadedDocs.includes(doc.type) ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                        <span className={`text-sm font-medium ${uploadedDocs.includes(doc.type) ? 'text-green-700' : 'text-gray-600'}`}>
                                            {doc.label} {['CERTIFICATE_OF_ORIGIN', 'OTHER'].includes(doc.type) ? '' : '*'}
                                        </span>
                                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${uploadedDocs.includes(doc.type) ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                                            {uploadedDocs.includes(doc.type) ? 'Uploaded' : 'Upload'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleFileUpload(e, doc.type)}
                                                disabled={uploading || uploadedDocs.includes(doc.type)}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => handleStatusUpdate('IN_TRANSIT')}
                            disabled={!hasRequiredLoadingDocs || uploading}
                            className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${hasRequiredLoadingDocs && !uploading ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            Start Transit (Documents Verified)
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </div>
                );
            case 'IN_TRANSIT':
                return (
                    <button
                        onClick={() => handleStatusUpdate('ARRIVED_DELIVERY')}
                        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Truck Arrived at Delivery
                    </button>
                );
            case 'ARRIVED_DELIVERY':
                return (
                    <button
                        onClick={() => handleStatusUpdate('UNLOADING_FINISHED')}
                        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        Finish Unloading
                    </button>
                );
            case 'UNLOADING_FINISHED':
                const hasCMR = uploadedDocs.includes('CMR');
                return (
                    <div className="space-y-4 w-full">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <h4 className="font-bold text-blue-800 mb-2">Final Verification: Signed CMR</h4>
                            <p className="text-sm text-blue-600 mb-4">Please scan and upload the CMR with the receiver's signature/stamp in Cell 24.</p>

                            <div className={`p-3 rounded-lg border flex items-center justify-between ${hasCMR ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                                <span className={`text-sm font-medium ${hasCMR ? 'text-green-700' : 'text-gray-600'}`}>
                                    Signed CMR (Cell 24) *
                                </span>
                                <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${hasCMR ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                                    {hasCMR ? 'Uploaded' : 'Upload Photo'}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleFileUpload(e, 'CMR')}
                                        disabled={uploading || hasCMR}
                                    />
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={() => handleStatusUpdate('DELIVERED')}
                            disabled={!hasCMR || uploading}
                            className={`w-full px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${hasCMR && !uploading ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            Complete Shipment
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Horizontal Stepper (Simplified) */}
            <div className="flex items-center justify-between px-2 overflow-x-auto pb-4 scrollbar-hide">
                {STEPS.map((step, idx) => {
                    const isCompleted = STEPS.findIndex(s => s.status === shipment.status) > idx;
                    const isCurrent = step.status === shipment.status;

                    return (
                        <div key={step.status} className="flex flex-col items-center min-w-[80px] relative group">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-200' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} /></svg>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                            {/* Horizontal Line Connector */}
                            {idx < STEPS.length - 1 && (
                                <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: 'calc(100% + 20px)' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Action Area */}
            <div className="bg-white/50 rounded-2xl p-2">
                {renderActionArea()}
            </div>
        </div>
    );
}
