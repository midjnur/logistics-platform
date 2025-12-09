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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Pending Carrier Verifications</h1>

            {carriers.length === 0 ? (
                <div className="text-gray-500">No pending verifications.</div>
            ) : (
                <div className="grid gap-6">
                    {carriers.map(carrier => (
                        <div key={carrier.user_id} className="bg-white p-6 rounded shadow border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold">{carrier.first_name} {carrier.last_name}</h3>
                                    <p className="text-gray-500 text-sm">ID: {carrier.user_id}</p>

                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Uploaded Documents:</h4>
                                        {carrier.documents && carrier.documents.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm">
                                                {carrier.documents.map((doc: any) => (
                                                    <li key={doc.id}>
                                                        <a href={doc.file_url} target="_blank" className="text-blue-600 hover:underline">
                                                            {doc.type} ({doc.status})
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-yellow-600 text-sm">No documents uploaded yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleVerify(carrier.user_id, 'REJECTED')}
                                        className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(carrier.user_id, 'VERIFIED')}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
