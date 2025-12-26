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

    // Determine if the document is an image or PDF based on file extension
    // Handle URLs with query parameters by splitting at '?' first
    const cleanUrl = document.file_url.split('?')[0];
    const fileExtension = cleanUrl.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
    const isPDF = fileExtension === 'pdf';

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(document.file_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = document.metadata?.originalName || `document.${fileExtension}`; // Try to use original name
            window.document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback
            window.open(document.file_url, '_blank');
        }
    };

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-xl border-b border-white/50">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {document.type}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                        {document.metadata?.originalName || 'Document'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 w-8 h-8 rounded-full bg-gray-200/50 hover:bg-gray-300/50 flex items-center justify-center transition-colors"
                    aria-label="Close preview"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Document Status Badge */}
            <div className="px-4 py-3 bg-white/30 backdrop-blur-xl border-b border-white/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${document.status === 'VERIFIED' ? 'bg-green-500/10 text-green-700' :
                        document.status === 'REJECTED' ? 'bg-red-500/10 text-red-700' :
                            'bg-yellow-500/10 text-yellow-700'
                        }`}>
                        {document.status}
                    </span>
                </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-white/20 backdrop-blur-xl">
                <div className="p-6 flex items-center justify-center min-h-full">
                    {isImage && !imageError ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="relative max-w-full max-h-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={document.file_url}
                                    alt={document.type}
                                    className="rounded-lg shadow-2xl object-contain max-h-[70vh] max-w-full"
                                    onError={(e) => {
                                        console.error('Image load failed for URL:', document.file_url);
                                        setImageError(true);
                                    }}
                                />
                            </div>
                        </div>
                    ) : isPDF ? (
                        <div className="w-full h-full min-h-[600px] rounded-lg overflow-hidden shadow-2xl bg-white">
                            <iframe
                                src={document.file_url}
                                className="w-full h-full min-h-[600px]"
                                title={`Preview of ${document.type}`}
                            />
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-white/40 rounded-xl">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600 font-medium mb-2">Preview not available</p>
                            <p className="text-sm text-gray-500 mb-4">This file type cannot be previewed in the browser</p>
                            <button
                                onClick={handleDownload}
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Download File
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer with Actions */}
            <div className="p-4 bg-white/40 backdrop-blur-xl border-t border-white/50">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        Document ID: {document.id.substring(0, 8)}...
                    </div>
                    <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Open in New Tab
                    </a>
                </div>
            </div>
        </div>
    );
}
