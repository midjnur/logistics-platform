'use client';

import { useTranslations } from 'next-intl';

export default function RequirementsStep({ data, update }: { data: any, update: (d: any) => void }) {
    const t = useTranslations('Shipper');

    const toggleRequirement = (req: string) => {
        update({ [req]: !data[req] });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-gray-800">Requirements</h2>
            <p className="text-gray-500 -mt-6">Special handling and documentation.</p>

            {/* Temperature Control */}
            <div className="bg-white/50 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.temperature_control ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Temperature Control</h3>
                            <p className="text-sm text-gray-500">Does the cargo require refrigerated transport?</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={data.temperature_control} onChange={(e) => update({ temperature_control: e.target.checked })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {/* Loading Type */}
            <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Type of Loading</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Standard', 'Back', 'Side', 'Top'].map((type) => (
                        <button
                            key={type}
                            onClick={() => update({ loading_type: type })}
                            className={`p-4 rounded-xl border-2 transition-all font-medium text-sm ${data.loading_type === type
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents & Compliance */}
            <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Documents & Compliance</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => toggleRequirement('has_tir')}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${data.has_tir ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${data.has_tir ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                            {data.has_tir && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`font-medium ${data.has_tir ? 'text-indigo-900' : 'text-gray-600'}`}>Need TIR</span>
                    </button>

                    <button
                        onClick={() => toggleRequirement('has_cmr')}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${data.has_cmr ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${data.has_cmr ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                            {data.has_cmr && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`font-medium ${data.has_cmr ? 'text-indigo-900' : 'text-gray-600'}`}>Need CMR</span>
                    </button>

                    <button
                        onClick={() => toggleRequirement('has_waybill')}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${data.has_waybill ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${data.has_waybill ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                            {data.has_waybill && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`font-medium ${data.has_waybill ? 'text-indigo-900' : 'text-gray-600'}`}>Need Waybill</span>
                    </button>
                </div>
            </div>

            {/* Export Declaration */}
            <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Who Submits Export Declaration?</label>
                <div className="grid grid-cols-3 gap-4">
                    {['SHIPPER', 'TRANSPORT', 'NONE'].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => update({ export_declaration: opt })}
                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${data.export_declaration === opt
                                    ? 'bg-gray-800 text-white border-gray-800 shadow-md'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {opt === 'TRANSPORT' ? 'Transporter' : opt.charAt(0) + opt.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
