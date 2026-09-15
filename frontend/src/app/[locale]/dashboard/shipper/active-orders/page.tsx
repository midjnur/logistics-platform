'use client';

import { useTranslations } from 'next-intl';
import ActiveShipmentContainer from '@/components/dashboard/ActiveShipmentContainer';

export default function ActiveOrdersPage() {
    const t = useTranslations('Shipper');

    const activeStatuses = [
        'DRIVER_AT_PICKUP',
        'LOADING_STARTED',
        'LOADING_FINISHED',
        'IN_TRANSIT',
        'ARRIVED_DELIVERY',
        'UNLOADING_FINISHED'
    ];

    return (
        <ActiveShipmentContainer statusFilter={activeStatuses} />
    );
}
