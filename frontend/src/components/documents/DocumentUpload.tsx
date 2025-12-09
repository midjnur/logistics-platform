'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface Document {
    id: string;
    type: string;
    status: string;
    file_url: string;
    metadata: any;
}

const DOCUMENT_TYPES = [
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'LICENSE', label: 'Driver License' },
    { value: 'INSURANCE', label: 'Insurance Policy' },
    { value: 'POA', label: 'Power of Attorney' },
    { value: 'CMR', label: 'CMR Blank' },
    { value: 'OTHER', label: 'Other' },
];

interface DocumentUploadProps {
    shipmentId?: string;
    allowedTypes?: string[];
    onUploadComplete?: () => void;
}

export default function DocumentUpload({ shipmentId, allowedTypes, onUploadComplete }: DocumentUploadProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);

    // Default to first allowed type or PASSPORT
    const initialType = allowedTypes && allowedTypes.length > 0 ? allowedTypes[0] : 'PASSPORT';
    const [selectedType, setSelectedType] = useState(initialType);

    const availableTypes = allowedTypes
        ? DOCUMENT_TYPES.filter(t => allowedTypes.includes(t.value))
        : DOCUMENT_TYPES;

    useEffect(() => {
        loadDocuments();
    }, [shipmentId]);

    const loadDocuments = async () => {
        try {
            // If shipmentId is provided, we should fetch documents for that shipment
            // TODO: Add endpoint for shipment documents or filter client-side
            // For now, we'll just show all my documents if no specific endpoint exists yet
            const docs = await fetchApi('/documents/my-documents');

            if (shipmentId) {
                // Filter docs that belong to this shipment (assuming backend returns shipment_id)
                // Since we haven't updated the GET endpoint to return shipment_id yet, this might need adjustment
                // For now, let's just show all to verify upload works
                setDocuments(docs);
            } else {
                setDocuments(docs);
            }
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', selectedType);
        if (shipmentId) {
            formData.append('shipmentId', shipmentId);
        }

        setUploading(true);
        try {
            // We need to use fetch directly here because our fetchApi helper might assume JSON
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            await loadDocuments();
            if (onUploadComplete) onUploadComplete();
            alert('Document uploaded successfully!');
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl space-y-8">
            {/* Header / Title removed from component, handled by page */}

            {/* Upload Section (Glass) */}
            <div className="p-6 bg-white/40 backdrop-blur-xl border border-white/50 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide opacity-70">Upload New Document</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Document Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-white/60 border border-gray-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-48"
                        >
                            {availableTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Select File</label>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                cursor-pointer transition-colors"
                        />
                    </div>

                    {uploading && <span className="text-sm text-blue-600 animate-pulse font-medium">Uploading...</span>}
                </div>
            </div>

            {/* Documents List (macOS Settings Style) */}
            <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-xl shadow-sm overflow-hidden">
                {documents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No documents uploaded yet.
                    </div>
                ) : (
                    documents.map((doc, index) => (
                        <div key={doc.id} className={`flex items-center justify-between px-6 py-4 hover:bg-white/40 transition-colors ${index !== documents.length - 1 ? 'border-b border-gray-200/30' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{doc.type}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]" title={doc.metadata?.originalName}>
                                        {doc.metadata?.originalName}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${doc.status === 'VERIFIED' ? 'bg-green-500/10 text-green-700' :
                                        doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-700' :
                                            'bg-yellow-500/10 text-yellow-700'
                                    }`}>
                                    {doc.status}
                                </span>

                                <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    View
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
