'use client';

import { useTranslations } from 'next-intl';
import DocumentUpload from '@/components/documents/DocumentUpload';

export default function MyDocumentsPage() {
    const t = useTranslations('Dashboard');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Documents</h1>
                    <p className="text-gray-500 mt-1">Manage your legal and compliance documents</p>
                </div>
            </header>

            <div className="glass p-8 rounded-3xl shadow-sm">
                <DocumentUpload />
            </div>
        </div>
    );
}
