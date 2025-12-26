'use client';

import ShipmentList from '@/components/dashboard/ShipmentList';

export default function ActiveOrdersPage() {
    return (
        <ShipmentList
            statusFilter={[
                'DRIVER_AT_PICKUP',
                'LOADING_STARTED',
                'LOADING_FINISHED',
                'IN_TRANSIT',
                'ARRIVED_DELIVERY',
                'UNLOADING_FINISHED'
            ]}
            title="Active Orders"
            description="Shipments currently on the road"
            emptyMessage="No active shipments in transit."
        />
    );
}
