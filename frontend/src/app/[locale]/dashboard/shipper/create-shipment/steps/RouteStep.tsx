'use client';

import { useTranslations } from 'next-intl';

export default function RouteStep({ data, update }: { data: any, update: (d: any) => void }) {
    const t = useTranslations('Shipper');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-gray-800">The Journey</h2>
            <p className="text-gray-500 -mt-4 mb-8">Where is the cargo going?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pickup Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 font-semibold uppercase text-xs tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Pickup
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            value={data.pickup_address}
                            onChange={(e) => update({ pickup_address: e.target.value })}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Enter pickup address"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={data.pickup_time ? data.pickup_time.slice(0, 16) : ''}
                            onChange={(e) => update({ pickup_time: new Date(e.target.value).toISOString() })}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Delivery Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-600 font-semibold uppercase text-xs tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Delivery
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            value={data.delivery_address}
                            onChange={(e) => update({ delivery_address: e.target.value })}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Enter delivery address"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={data.delivery_time ? data.delivery_time.slice(0, 16) : ''}
                            onChange={(e) => update({ delivery_time: new Date(e.target.value).toISOString() })}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-8 h-48 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-blue-400">
                <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    Interactive Map Preview
                </span>
            </div>
        </div>
    );
}
