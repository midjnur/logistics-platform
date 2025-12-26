'use client';

import { useTranslations } from 'next-intl';

export default function CargoStep({ data, update }: { data: any, update: (d: any) => void }) {
    const t = useTranslations('Shipper');

    // Auto-calculate CBM
    const handleDimensionChange = (field: string, value: string) => {
        const newData = { ...data, [field]: value };

        // Calculate CBM if all dimensions are present
        const l = parseFloat(newData.internal_length) || 0;
        const w = parseFloat(newData.internal_width) || 0;
        const h = parseFloat(newData.internal_height) || 0;

        if (l && w && h) {
            newData.cbm = ((l * w * h) / 1000000).toFixed(3); // cm to m3
            newData.volume_m3 = newData.cbm;
        }

        update(newData);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Cargo Details</h2>
            <p className="text-gray-500 -mt-4 mb-8">What are you shipping?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700">Commodity Type</label>
                    <input
                        type="text"
                        value={data.cargo_type}
                        onChange={(e) => update({ cargo_type: e.target.value })}
                        className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g. Electronics, Furniture"
                    />
                </div>

                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700">HS / Customs Tariff Code</label>
                    <input
                        type="text"
                        value={data.hs_code}
                        onChange={(e) => update({ hs_code: e.target.value })}
                        className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g. 1234.56.78"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">For customs purposes when exporting/importing products</p>
                </div>

                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700">Gross Weight (kg)</label>
                    <input
                        type="number"
                        value={data.weight_kg}
                        onChange={(e) => update({ weight_kg: e.target.value })}
                        className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="0.00"
                    />
                </div>

                <div className="group">
                    <label className="block mb-2 font-medium text-gray-700">Total Volume (CBM)</label>
                    <input
                        type="number"
                        value={data.cbm}
                        onChange={(e) => update({ cbm: e.target.value, volume_m3: e.target.value })}
                        className="w-full bg-blue-50/50 border-0 ring-1 ring-blue-200 text-blue-900 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                        placeholder="0.000"
                    />
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Internal Dimensions (cm)</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="group">
                        <label className="block mb-2 text-sm text-gray-500">Length</label>
                        <input
                            type="number"
                            value={data.internal_length}
                            onChange={(e) => handleDimensionChange('internal_length', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                            placeholder="cm"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 text-sm text-gray-500">Width</label>
                        <input
                            type="number"
                            value={data.internal_width}
                            onChange={(e) => handleDimensionChange('internal_width', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                            placeholder="cm"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 text-sm text-gray-500">Height</label>
                        <input
                            type="number"
                            value={data.internal_height}
                            onChange={(e) => handleDimensionChange('internal_height', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                            placeholder="cm"
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Formula: (L * W * H) / 1,000,000 = CBM
                </p>
            </div>
        </div>
    );
}
