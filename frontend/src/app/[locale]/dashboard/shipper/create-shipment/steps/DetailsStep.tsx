'use client';

import { useTranslations } from 'next-intl';

export default function DetailsStep({ data, update }: { data: any, update: (d: any) => void }) {
    const t = useTranslations('Shipper');

    const handleNestedChange = (parent: string, field: string, value: string) => {
        update({ [parent]: { ...data[parent], [field]: value } });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Final Details</h2>
            <p className="text-gray-500 -mt-6">Parties and Payment Information.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipper Details */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Shipper</h3>
                    <div className="group">
                        <label className="block mb-2 text-sm font-medium text-gray-600">Company Name</label>
                        <input
                            type="text"
                            value={data.shipper_details?.company || ''}
                            onChange={(e) => handleNestedChange('shipper_details', 'company', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Shipper Company"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 text-sm font-medium text-gray-600">Address</label>
                        <input
                            type="text"
                            value={data.shipper_details?.address || ''}
                            onChange={(e) => handleNestedChange('shipper_details', 'address', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Shipper Address"
                        />
                    </div>
                </div>

                {/* Consignee Details */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Consignee</h3>
                    <div className="group">
                        <label className="block mb-2 text-sm font-medium text-gray-600">Company Name</label>
                        <input
                            type="text"
                            value={data.consignee_details?.company || ''}
                            onChange={(e) => handleNestedChange('consignee_details', 'company', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Consignee Company"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 text-sm font-medium text-gray-600">Address</label>
                        <input
                            type="text"
                            value={data.consignee_details?.address || ''}
                            onChange={(e) => handleNestedChange('consignee_details', 'address', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Consignee Address"
                        />
                    </div>
                </div>
            </div>

            {/* Financials */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6">
                <h3 className="font-bold text-gray-900 text-lg">Financial Agreement</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block mb-2 text-sm font-medium text-gray-600">Value of Goods (for insurance)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={data.value_of_goods}
                                onChange={(e) => update({ value_of_goods: e.target.value })}
                                className="w-full bg-white border-0 ring-1 ring-gray-300 p-3 pl-4 pr-16 rounded-xl focus:ring-2 focus:ring-green-500 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                placeholder="0.00"
                            />
                            <div className="absolute right-3 top-2 bottom-2">
                                <select
                                    value={data.value_currency}
                                    onChange={(e) => update({ value_currency: e.target.value })}
                                    className="h-full bg-gray-100 border-0 rounded-lg text-sm font-bold text-gray-600"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block mb-2 text-sm font-medium text-gray-600">Payment Terms</label>
                        <select
                            value={data.payment_terms}
                            onChange={(e) => update({ payment_terms: e.target.value })}
                            className="w-full bg-white border-0 ring-1 ring-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900"
                        >
                            <option value="ON_ARRIVAL">Upon Arrival</option>
                            <option value="0-7_DAYS">0 - 7 Days</option>
                            <option value="8-14_DAYS">8 - 14 Days</option>
                            <option value="15-30_DAYS">15 - 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
