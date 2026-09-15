'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

interface AdminShipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    status: string;
    price: number;
    created_at: string;
    shipper?: { email: string };
    carrier?: { first_name: string; last_name: string } | null;
}

const STATUSES = [
    'OPEN', 'OFFERED', 'ASSIGNED', 'DRIVER_AT_PICKUP', 'LOADING_STARTED', 'LOADING_FINISHED',
    'IN_TRANSIT', 'ARRIVED_DELIVERY', 'UNLOADING_FINISHED', 'DELIVERED', 'CANCELLED',
];

export default function AdminShipmentsPage() {
    const [shipments, setShipments] = useState<AdminShipment[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (search) params.set('search', search);
        params.set('limit', '50');
        fetchApi(`/admin/shipments?${params.toString()}`)
            .then((data) => {
                setShipments(data.shipments);
                setTotal(data.total);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [status, search]);

    useEffect(() => {
        const timeout = setTimeout(load, 300);
        return () => clearTimeout(timeout);
    }, [load]);

    const handleOverride = async (id: string, newStatus: string) => {
        try {
            await fetchApi(`/admin/shipments/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setEditingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shipments</h1>
                <p className="text-gray-500 mt-1">{total} shipment{total === 1 ? '' : 's'} across the platform</p>
            </header>

            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by address or shipper email..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            <div className="glass rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-[11px] text-gray-400 uppercase tracking-wider">
                                <th className="px-5 py-3 font-bold">Route</th>
                                <th className="px-5 py-3 font-bold">Shipper</th>
                                <th className="px-5 py-3 font-bold">Carrier</th>
                                <th className="px-5 py-3 font-bold">Price</th>
                                <th className="px-5 py-3 font-bold">Status</th>
                                <th className="px-5 py-3 font-bold text-right">Override</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">No shipments found.</td>
                                </tr>
                            ) : (
                                shipments.map((s) => (
                                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900">{s.pickup_address.split(',')[0]} &rarr; {s.delivery_address.split(',')[0]}</p>
                                            <p className="text-xs text-gray-400">{s.cargo_type} &middot; #{s.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">{s.shipper?.email || '—'}</td>
                                        <td className="px-5 py-3 text-gray-600">
                                            {s.carrier ? `${s.carrier.first_name} ${s.carrier.last_name}`.trim() : <span className="text-gray-300">Unassigned</span>}
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-gray-900">{s.price ? `€${s.price}` : '—'}</td>
                                        <td className="px-5 py-3">
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                                                {s.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {editingId === s.id ? (
                                                <select
                                                    autoFocus
                                                    defaultValue={s.status}
                                                    onBlur={() => setEditingId(null)}
                                                    onChange={(e) => handleOverride(s.id, e.target.value)}
                                                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                                                >
                                                    {STATUSES.map((st) => (
                                                        <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingId(s.id)}
                                                    className="text-xs text-blue-600 font-bold hover:underline"
                                                >
                                                    Change
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
