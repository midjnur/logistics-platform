'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import DocumentPreview from './DocumentPreview';

interface Document {
    id: string;
    type: string;
    status: string;
    file_url: string;
    metadata: any;
    shipment_id?: string;
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
    documents?: Document[];
    readOnly?: boolean;
}

export default function DocumentUpload({ shipmentId, allowedTypes, onUploadComplete, documents: initialDocs, readOnly = false }: DocumentUploadProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    // Default to first allowed type or PASSPORT
    const initialType = allowedTypes && allowedTypes.length > 0 ? allowedTypes[0] : 'PASSPORT';
    const [selectedType, setSelectedType] = useState(initialType);

    const availableTypes = allowedTypes
        ? DOCUMENT_TYPES.filter(t => allowedTypes.includes(t.value))
        : DOCUMENT_TYPES;

    useEffect(() => {
        if (initialDocs) {
            setDocuments(initialDocs);
        } else {
            loadDocuments();
        }
    }, [shipmentId, initialDocs]);

    const loadDocuments = async () => {
        try {
            if (initialDocs) return;

            // Fetch all documents for the user
            const docs = await fetchApi('/documents/my-documents');

            if (shipmentId) {
                // Show ONLY documents for this shipment
                setDocuments(docs.filter((d: Document) => d.shipment_id === shipmentId));
            } else {
                // Show ONLY global documents (not attached to any shipment)
                setDocuments(docs.filter((d: Document) => !d.shipment_id));
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
        <div className="w-full transition-all duration-300">
            {/* Document List */}
            <div className="space-y-8 max-w-4xl">
                {/* Header / Title removed from component, handled by page */}

                {/* Upload Section (Glass) */}
                {!readOnly && (
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
                )}

                {/* Documents List (macOS Settings Style) */}
                <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-xl shadow-sm overflow-hidden">
                    {documents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        documents.map((doc, index) => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={`flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors cursor-pointer group ${index !== documents.length - 1 ? 'border-b border-gray-200/30' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{doc.type}</p>
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

                                    <button
                                        onClick={() => setSelectedDoc(doc)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Document Preview */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-6 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedDoc(null)}
                    />

                    {/* Modal Content - Full screen on mobile, Rounded card on desktop */}
                    <div className="relative w-full h-full sm:max-w-5xl sm:h-[85vh] bg-[#1c1c1e] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <DocumentPreview
                            document={selectedDoc}
                            onClose={() => setSelectedDoc(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

