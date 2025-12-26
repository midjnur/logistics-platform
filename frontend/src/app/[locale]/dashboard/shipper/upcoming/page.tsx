'use client';

import ShipmentList from '@/components/dashboard/ShipmentList';

export default function UpcomingPage() {
    return (
        <ShipmentList
            statusFilter={['ASSIGNED']} // filtering for Confirmed/Assigned shipments
            title="Upcoming Shipments"
            description="Shipments confirmed and ready for pickup"
            emptyMessage="No upcoming shipments."
        />
    );
}
