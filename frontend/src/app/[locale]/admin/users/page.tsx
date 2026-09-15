'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

interface AdminUser {
    id: string;
    email: string;
    phone: string;
    role: 'SHIPPER' | 'CARRIER' | 'ADMIN';
    is_active: boolean;
    created_at: string;
    carrier: {
        first_name: string;
        last_name: string;
        company_name: string;
        verification_status: string;
    } | null;
    shipmentCount: number;
    totalEarned: number;
    rating: { avg: number; count: number } | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'' | 'SHIPPER' | 'CARRIER'>('');
    const [search, setSearch] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (role) params.set('role', role);
        if (search) params.set('search', search);
        params.set('limit', '50');
        fetchApi(`/admin/users?${params.toString()}`)
            .then((data) => {
                setUsers(data.users);
                setTotal(data.total);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [role, search]);

    useEffect(() => {
        const timeout = setTimeout(load, 300);
        return () => clearTimeout(timeout);
    }, [load]);

    const handleToggleActive = async (user: AdminUser) => {
        const action = user.is_active ? 'suspend' : 'reactivate';
        if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return;
        try {
            await fetchApi(`/admin/users/${user.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !user.is_active }),
            });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
        } catch (err) {
            alert(`Failed to ${action} user`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Users</h1>
                    <p className="text-gray-500 mt-1">{total} account{total === 1 ? '' : 's'}</p>
                </div>
            </header>

            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by email, phone, or name..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                    {(['', 'SHIPPER', 'CARRIER'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${role === r
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {r === '' ? 'All' : r === 'SHIPPER' ? 'Shippers' : 'Carriers'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-[11px] text-gray-400 uppercase tracking-wider">
                                <th className="px-5 py-3 font-bold">User</th>
                                <th className="px-5 py-3 font-bold">Role</th>
                                <th className="px-5 py-3 font-bold">Shipments</th>
                                <th className="px-5 py-3 font-bold">Earned / Rating</th>
                                <th className="px-5 py-3 font-bold">Status</th>
                                <th className="px-5 py-3 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="px-5 py-3">
                                            <p className="font-bold text-gray-900">
                                                {u.carrier ? `${u.carrier.first_name} ${u.carrier.last_name}`.trim() || u.email : u.email}
                                            </p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                                                {u.role}
                                            </span>
                                            {u.carrier && (
                                                <span
                                                    className={`ml-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${u.carrier.verification_status === 'VERIFIED'
                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                        : u.carrier.verification_status === 'REJECTED'
                                                            ? 'bg-red-50 text-red-600 border-red-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        }`}
                                                >
                                                    {u.carrier.verification_status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-gray-700 font-semibold">{u.shipmentCount}</td>
                                        <td className="px-5 py-3 text-gray-700">
                                            {u.role === 'CARRIER' ? (
                                                <>
                                                    <span className="font-semibold">€{u.totalEarned.toLocaleString()}</span>
                                                    {u.rating && <span className="text-xs text-amber-600 ml-2">★ {u.rating.avg} ({u.rating.count})</span>}
                                                </>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {u.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {u.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${u.is_active
                                                        ? 'text-red-500 hover:bg-red-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {u.is_active ? 'Suspend' : 'Reactivate'}
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
