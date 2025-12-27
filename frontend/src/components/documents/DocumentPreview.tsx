'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Document {
    id: string;
    type: string;
    status: string;
    file_url: string;
    metadata: any;
}

interface DocumentPreviewProps {
    document: Document;
    onClose: () => void;
}

export default function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
    const [imageError, setImageError] = useState(false);

    // Robust File Type Detection
    const getFileType = () => {
        // 1. Check metadata mime type (if available)
        const mimeType = document.metadata?.mimetype || document.metadata?.contentType;
        if (mimeType) {
            if (mimeType.startsWith('image/')) return 'image';
            if (mimeType === 'application/pdf') return 'pdf';
        }

        // 2. Check file extension from URL or Original Name
        const nameToCheck = document.metadata?.originalName || document.file_url.split('?')[0];
        const extension = nameToCheck.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(extension || '')) return 'image';
        if (extension === 'pdf') return 'pdf';

        return 'unknown';
    };

    const fileType = getFileType();
    const isImage = fileType === 'image';
    const isPDF = fileType === 'pdf';

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(document.file_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = document.metadata?.originalName || `document-${document.id}`;
            window.document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(document.file_url, '_blank');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1c1c1e] text-white overflow-hidden">
            {/* Immersive Header (Glassmorphism) */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10">
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex-1 text-center px-4">
                    <h3 className="text-sm font-medium text-white/90 truncate">
                        {document.metadata?.originalName || document.type}
                    </h3>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">
                        {document.type}
                    </p>
                </div>

                <div className="w-8 flex justify-end">
                    {/* Placeholder for symmetry or secondary action */}
                    <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-blue-500/80 hover:bg-blue-600/80 flex items-center justify-center transition-colors backdrop-blur-sm"
                        title="Open in new tab"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex items-center justify-center p-0 md:p-8 overflow-hidden relative ${isPDF ? 'bg-[#2c2c2e]' : ''}`}>
                {isImage && !imageError ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={document.file_url}
                            alt={document.type}
                            className="object-contain max-w-full max-h-full transition-transform duration-300"
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                            onError={() => setImageError(true)}
                        />
                    </div>
                ) : isPDF ? (
                    <div className="w-full h-full bg-white rounded-none md:rounded-lg overflow-hidden shadow-2xl pt-[60px] md:pt-0">
                        {/* Added top padding on mobile to account for absolute header if overlaying */}
                        <iframe
                            src={document.file_url}
                            className="w-full h-full"
                            title={`Preview of ${document.type}`}
                        />
                    </div>
                ) : (
                    <div className="text-center p-8 max-w-sm mx-auto">
                        <div className="w-20 h-20 mx-auto bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">Preview Unavailable</h4>
                        <p className="text-sm text-white/50 mb-8">
                            This file type ({fileType}) cannot be viewed directly.
                        </p>
                        <button
                            onClick={handleDownload}
                            className="w-full py-3 px-6 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-all active:scale-95"
                        >
                            Download File
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Status Overlay (Optional - keep it minimal) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-md shadow-lg
                    ${document.status === 'VERIFIED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        document.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                    {document.status}
                </span>
            </div>
        </div>
    );
}
