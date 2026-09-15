'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface Carrier {
    user_id: string;
    first_name: string;
    last_name: string;
    verification_status: string;
    documents: any[];
}

export default function AdminVerificationsPage() {
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingCarriers();
    }, []);

    const loadPendingCarriers = async () => {
        try {
            const data = await fetchApi('/carriers/admin/pending');
            setCarriers(data);
        } catch (err) {
            console.error('Failed to load pending carriers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
        try {
            await fetchApi(`/carriers/admin/${id}/verify`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            // Remove from list
            setCarriers(prev => prev.filter(c => c.user_id !== id));
            alert(`Carrier ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            console.error('Verification failed:', err);
            alert('Action failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pending Verifications</h1>
                <p className="text-gray-500 mt-1">{carriers.length} carrier{carriers.length === 1 ? '' : 's'} awaiting review</p>
            </header>

            {carriers.length === 0 ? (
                <div className="glass p-12 rounded-3xl shadow-sm text-center text-gray-400">Nothing pending &mdash; all caught up.</div>
            ) : (
                <div className="grid gap-4">
                    {carriers.map(carrier => (
                        <div key={carrier.user_id} className="glass p-6 rounded-3xl shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{carrier.first_name} {carrier.last_name}</h3>
                                    <p className="text-gray-400 text-xs font-mono mt-0.5">{carrier.user_id}</p>

                                    <div className="mt-4">
                                        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Uploaded Documents</h4>
                                        {carrier.documents && carrier.documents.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {carrier.documents.map((doc: any) => (
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
                                        onClick={() => handleVerify(carrier.user_id, 'REJECTED')}
                                        className="px-4 py-2 rounded-xl text-red-500 font-bold text-xs hover:bg-red-50 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(carrier.user_id, 'VERIFIED')}
                                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all"
                                    >
                                        Approve Carrier
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
