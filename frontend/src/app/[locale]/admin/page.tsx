'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

interface Stats {
    totalShippers: number;
    totalCarriers: number;
    totalAdmins: number;
    totalShipments: number;
    shipmentsByStatus: Record<string, number>;
    deliverySuccessRate: number | null;
    avgDeliveryHours: number | null;
    totalRevenuePaid: number;
    totalRevenuePending: number;
    pendingVerifications: number;
}

const STATUS_LABELS: Record<string, string> = {
    OPEN: 'Open',
    OFFERED: 'Offered',
    ASSIGNED: 'Assigned',
    DRIVER_AT_PICKUP: 'At Pickup',
    LOADING_STARTED: 'Loading',
    LOADING_FINISHED: 'Loaded',
    IN_TRANSIT: 'In Transit',
    ARRIVED_DELIVERY: 'At Delivery',
    UNLOADING_FINISHED: 'Unloading Done',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

function StatCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
    return (
        <div className="glass p-5 rounded-2xl shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-black ${accent || 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const [broadcastRole, setBroadcastRole] = useState<'SHIPPER' | 'CARRIER' | 'ALL'>('ALL');
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        fetchApi('/admin/stats')
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
        setSending(true);
        setSent(false);
        try {
            await fetchApi('/admin/broadcast', {
                method: 'POST',
                body: JSON.stringify({ role: broadcastRole, title: broadcastTitle, message: broadcastMessage }),
            });
            setSent(true);
            setBroadcastTitle('');
            setBroadcastMessage('');
        } catch (err) {
            alert('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Overview</h1>
                <p className="text-gray-500 mt-1">Live stats across the whole platform.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Shippers" value={stats.totalShippers} />
                <StatCard label="Carriers" value={stats.totalCarriers} />
                <StatCard label="Total Shipments" value={stats.totalShipments} />
                <StatCard
                    label="Pending Verifications"
                    value={stats.pendingVerifications}
                    accent={stats.pendingVerifications > 0 ? 'text-amber-600' : undefined}
                />
                <StatCard
                    label="Delivery Success Rate"
                    value={stats.deliverySuccessRate !== null ? `${stats.deliverySuccessRate}%` : '—'}
                    accent="text-green-600"
                />
                <StatCard
                    label="Avg Delivery Time"
                    value={stats.avgDeliveryHours !== null ? `${stats.avgDeliveryHours}h` : '—'}
                />
                <StatCard label="Revenue Paid" value={`€${stats.totalRevenuePaid.toLocaleString()}`} accent="text-emerald-600" />
                <StatCard label="Revenue Pending" value={`€${stats.totalRevenuePending.toLocaleString()}`} accent="text-yellow-600" />
            </div>

            <div className="glass p-6 rounded-3xl shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Shipments by Status</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {Object.entries(stats.shipmentsByStatus).map(([status, count]) => (
                        <div key={status} className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{STATUS_LABELS[status] || status}</p>
                            <p className="text-xl font-bold text-gray-900">{count}</p>
                        </div>
                    ))}
                    {Object.keys(stats.shipmentsByStatus).length === 0 && (
                        <p className="text-sm text-gray-400 col-span-full">No shipments yet.</p>
                    )}
                </div>
            </div>

            <div className="glass p-6 rounded-3xl shadow-sm max-w-2xl">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Broadcast Notification</h2>
                <p className="text-sm text-gray-500 mb-4">Send an in-app + email notification to every user of a role.</p>

                <div className="flex gap-2 mb-3">
                    {(['ALL', 'SHIPPER', 'CARRIER'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setBroadcastRole(r)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${broadcastRole === r
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {r === 'ALL' ? 'Everyone' : r === 'SHIPPER' ? 'Shippers' : 'Carriers'}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Message"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {sent && <p className="text-sm text-green-600 mb-3">Broadcast sent.</p>}

                <button
                    onClick={handleBroadcast}
                    disabled={sending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? 'Sending...' : 'Send Broadcast'}
                </button>
            </div>
        </div>
    );
}
