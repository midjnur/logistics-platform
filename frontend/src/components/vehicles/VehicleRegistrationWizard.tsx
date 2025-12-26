import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchApi } from '@/lib/api';

interface VehicleRegistrationWizardProps {
    onComplete: () => void;
    onCancel: () => void;
}

export function VehicleRegistrationWizard({ onComplete, onCancel }: VehicleRegistrationWizardProps) {
    const t = useTranslations('Carrier');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Type
        type: 'TRUCK',

        // Step 2: Basic Info
        plate_number: '',
        make: '',
        model: '',
        vin_number: '',
        production_year: new Date().getFullYear(),
        country_code: '',

        // Step 3: Specs
        capacity_kg: '',
        volume_m3: '',
        loading_type: 'Back', // Default
        emission_class: 'EUR6', // Default
        has_tir: false,
        has_cmr: false,
        has_waybill: false,

        // Step 4: Trailer (if applicable)
        trailer_plate_number: '',
        trailer_make: '',
        trailer_model: '',
        trailer_vin_number: '',
        cargo_fixing_tools: false,

        // Step 5: Documents
        photos: [] as string[],
        insurance_policy: '',
        poa: '',
        truck_id_doc: '',
        trailer_id_doc: '',
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await fetchApi('/vehicles', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    capacity_kg: Number(formData.capacity_kg),
                    volume_m3: Number(formData.volume_m3),
                    production_year: Number(formData.production_year),
                }),
            });
            onComplete();
        } catch (error) {
            console.error('Failed to register vehicle', error);
            alert('Failed to register vehicle. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: 'Type' },
        { number: 2, title: 'Details' },
        { number: 3, title: 'Specs' },
        { number: 4, title: 'Trailer' },
        { number: 5, title: 'Docs' },
    ];

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-300 overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-white/50 border-b border-white/50 px-6 py-4">
                <div className="flex items-center justify-between">
                    {steps.map((s) => (
                        <div key={s.number} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s.number ? 'bg-blue-600 text-white shadow-md' : 'bg-white/60 text-gray-400 border border-gray-200'
                                }`}>
                                {s.number}
                            </div>
                            <span className={`text-sm font-medium hidden md:block ${step >= s.number ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.title}
                            </span>
                            {s.number < steps.length && (
                                <div className={`h-0.5 w-8 mx-2 ${step > s.number ? 'bg-blue-200' : 'bg-gray-200/50'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8">
                {/* Step 1: Vehicle Type */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-gray-900">Select Vehicle Type</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['TRUCK', 'TRAILER', 'VAN', 'SPRINTER'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => updateField('type', type)}
                                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${formData.type === type
                                        ? 'border-blue-500 bg-blue-50/50 shadow-md text-blue-700'
                                        : 'border-transparent bg-white/60 hover:bg-white/80 text-gray-600'
                                        }`}
                                >
                                    <span className="font-bold">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Basic Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-gray-900">Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Plate Number" value={formData.plate_number} onChange={v => updateField('plate_number', v)} placeholder="e.g. B-12345" />
                            <Input label="VIN Number" value={formData.vin_number} onChange={v => updateField('vin_number', v)} />
                            <Input label="Make" value={formData.make} onChange={v => updateField('make', v)} placeholder="e.g. Volvo" />
                            <Input label="Model" value={formData.model} onChange={v => updateField('model', v)} placeholder="e.g. FH16" />
                            <Input label="Production Year" type="number" value={formData.production_year} onChange={v => updateField('production_year', v)} />
                            <Input label="Country Code" value={formData.country_code} onChange={v => updateField('country_code', v)} placeholder="e.g. DE" />
                        </div>
                    </div>
                )}

                {/* Step 3: Specs & Permissions */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-gray-900">Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Capacity (kg)" type="number" value={formData.capacity_kg} onChange={v => updateField('capacity_kg', v)} />
                            <Input label="Volume (m³)" type="number" value={formData.volume_m3} onChange={v => updateField('volume_m3', v)} />

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Loading Type</label>
                                <select
                                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.loading_type}
                                    onChange={(e) => updateField('loading_type', e.target.value)}
                                >
                                    <option>Back</option>
                                    <option>Side</option>
                                    <option>Top</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Emission Class</label>
                                <select
                                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.emission_class}
                                    onChange={(e) => updateField('emission_class', e.target.value)}
                                >
                                    <option>EUR6</option>
                                    <option>EUR5</option>
                                    <option>EUR4</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <Checkbox label="TIR" checked={formData.has_tir} onChange={v => updateField('has_tir', v)} />
                            <Checkbox label="CMR" checked={formData.has_cmr} onChange={v => updateField('has_cmr', v)} />
                            <Checkbox label="Waybill" checked={formData.has_waybill} onChange={v => updateField('has_waybill', v)} />
                        </div>
                    </div>
                )}

                {/* Step 4: Trailer (Conditional) */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-gray-900">Trailer Details</h3>
                        {formData.type === 'VAN' || formData.type === 'SPRINTER' ? (
                            <div className="text-center py-10 text-gray-500">
                                Not applicable for {formData.type}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Trailer Plate" value={formData.trailer_plate_number} onChange={v => updateField('trailer_plate_number', v)} />
                                <Input label="Trailer VIN" value={formData.trailer_vin_number} onChange={v => updateField('trailer_vin_number', v)} />
                                <Input label="Trailer Make" value={formData.trailer_make} onChange={v => updateField('trailer_make', v)} />
                                <Checkbox label="Cargo Fixing Tools (Straps)" checked={formData.cargo_fixing_tools} onChange={v => updateField('cargo_fixing_tools', v)} />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Documents */}
                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-xl font-bold text-gray-900">Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DocUploadField label="Insurance Policy" onUpload={url => updateField('insurance_policy', url)} />
                            <DocUploadField label="Power of Attorney (POA)" onUpload={url => updateField('poa', url)} />
                            <DocUploadField label="Truck ID" onUpload={url => updateField('truck_id_doc', url)} />
                            {formData.type === 'TRUCK' && (
                                <DocUploadField label="Trailer ID" onUpload={url => updateField('trailer_id_doc', url)} />
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200/50">
                    <button
                        onClick={step === 1 ? onCancel : handleBack}
                        className="text-gray-500 font-medium px-4 py-2 hover:text-gray-700 transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : 'Complete Registration'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner code
const Input = ({ label, value, onChange, type = 'text', placeholder = '' }: { label: string, value: string | number, onChange: (val: string) => void, type?: string, placeholder?: string }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            placeholder={placeholder}
        />
    </div>
);

const Checkbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
            {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
);

const DocUploadField = ({ label, onUpload }: { label: string, onUpload: (url: string) => void }) => {
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            // Use the generic upload endpoint or documents endpoint
            // Assuming we use the existing /documents/upload for now, which takes form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'OTHER'); // Default type for vehicle docs

            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            // Assuming response contains file_url or we construct it
            // Adjust based on actual API response. For now assuming data.file_url or data.url
            const fileUrl = data.file_url || data.url || URL.createObjectURL(file);

            setFileName(file.name);
            onUpload(fileUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="relative">
                <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id={`file-${label}`}
                />
                <label
                    htmlFor={`file-${label}`}
                    className={`flex items-center justify-between w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl cursor-pointer hover:bg-white/80 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className="text-sm text-gray-500 truncate max-w-[200px]">
                        {uploading ? 'Uploading...' : (fileName || 'Choose file...')}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium uppercase">
                        Upload
                    </span>
                </label>
            </div>
        </div>
    );
};
