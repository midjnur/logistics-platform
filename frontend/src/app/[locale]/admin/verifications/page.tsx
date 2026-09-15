'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

interface PendingProfile {
    user_id: string;
    first_name: string;
    last_name: string;
    entity_type?: string;
    company_name?: string;
    verification_status: string;
    documents: any[];
}

export default function AdminVerificationsPage() {
    const [role, setRole] = useState<'CARRIER' | 'SHIPPER'>('CARRIER');
    const [items, setItems] = useState<PendingProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = role === 'CARRIER' ? '/carriers/admin/pending' : '/shippers/admin/pending';
            const data = await fetchApi(endpoint);
            // Shippers come back with documents nested under `user.documents`;
            // carriers already flatten it to `documents` server-side.
            const normalized = role === 'SHIPPER'
                ? data.map((s: any) => ({ ...s, documents: s.user?.documents || [] }))
                : data;
            setItems(normalized);
        } catch (err) {
            console.error(`Failed to load pending ${role.toLowerCase()}s:`, err);
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        load();
    }, [load]);

    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        try {
            const endpoint = role === 'CARRIER' ? `/carriers/admin/${id}/verify` : `/shippers/admin/${id}/verify`;
            await fetchApi(endpoint, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            setItems((prev) => prev.filter((c) => c.user_id !== id));
            alert(`${role === 'CARRIER' ? 'Carrier' : 'Shipper'} ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            console.error('Verification failed:', err);
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pending Verifications</h1>
                    <p className="text-gray-500 mt-1">{items.length} {role.toLowerCase()}{items.length === 1 ? '' : 's'} awaiting review</p>
                </div>
                <div className="flex gap-2">
                    {(['CARRIER', 'SHIPPER'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${role === r
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {r === 'CARRIER' ? 'Carriers' : 'Shippers'}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-[40vh]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm text-center text-gray-400">Nothing pending &mdash; all caught up.</div>
            ) : (
                <div className="grid gap-4">
                    {items.map((item) => (
                        <div key={item.user_id} className="glass p-6 rounded-3xl shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {item.first_name} {item.last_name}
                                        {item.company_name && <span className="text-gray-400 font-normal"> &middot; {item.company_name}</span>}
                                    </h3>
                                    <p className="text-gray-400 text-xs font-mono mt-0.5">{item.user_id}</p>
                                    {item.entity_type && (
                                        <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                                            {item.entity_type === 'INDIVIDUAL' ? 'Individual' : 'Legal Entity'}
                                        </span>
                                    )}

                                    <div className="mt-4">
                                        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Uploaded Documents</h4>
                                        {item.documents && item.documents.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {item.documents.map((doc: any) => (
                                                    <a
                                                        key={doc.id}
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                                                    >
                                                        {doc.type} &middot; {doc.status}
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-amber-600 text-sm">No documents uploaded yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 self-start">
                                    <button
                                        onClick={() => handleVerify(item.user_id, 'REJECTED')}
                                        className="px-4 py-2 rounded-xl text-red-500 font-bold text-xs hover:bg-red-50 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(item.user_id, 'VERIFIED')}
                                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all"
                                    >
                                        Approve {role === 'CARRIER' ? 'Carrier' : 'Shipper'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
