'use client';

import ShipmentList from '@/components/dashboard/ShipmentList';

export default function HistoryPage() {
    return (
        <ShipmentList
            statusFilter={['DELIVERED', 'CANCELLED']}
            title="History"
            description="Past shipments"
            emptyMessage="No shipment history available."
        />
    );
}
