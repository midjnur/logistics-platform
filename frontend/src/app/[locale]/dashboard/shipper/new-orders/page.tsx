'use client';

import ShipmentList from '@/components/dashboard/ShipmentList';
import { useTranslations } from 'next-intl';

export default function NewOrdersPage() {
    return (
        <ShipmentList
            statusFilter={['OPEN']}
            title="New Orders"
            description="Shipments waiting for carrier offers"
            emptyMessage="You have no open orders at the moment."
        />
    );
}
