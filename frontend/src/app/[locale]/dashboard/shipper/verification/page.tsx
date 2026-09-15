'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import DocumentUpload from '@/components/documents/DocumentUpload';

type EntityType = 'INDIVIDUAL' | 'LEGAL_ENTITY';

interface ShipperProfile {
    entity_type: EntityType;
    verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    first_name: string;
    last_name: string;
    personal_number?: string;
    physical_address?: string;
    company_name?: string;
    company_id?: string;
    director_name?: string;
    contact_person?: string;
    operation_field?: string;
    legal_address?: string;
    office_address?: string;
    bank_name?: string;
    bank_code?: string;
    bank_account?: string;
    currency?: string;
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    VERIFIED: 'bg-green-50 text-green-700 border-green-100',
    REJECTED: 'bg-red-50 text-red-600 border-red-100',
};

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">{label}</label>
            <input
                {...props}
                className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
            />
        </div>
    );
}

export default function ShipperVerificationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ShipperProfile | null>(null);
    const [entityType, setEntityType] = useState<EntityType>('INDIVIDUAL');
    const [form, setForm] = useState<Record<string, string>>({
        first_name: '', last_name: '', personal_number: '', physical_address: '',
        company_name: '', company_id: '', director_name: '', contact_person: '', operation_field: '',
        legal_address: '', office_address: '',
        bank_name: '', bank_code: '', bank_account: '', currency: 'EUR',
    });

    useEffect(() => {
        fetchApi('/shippers/profile')
            .then((data) => {
                if (data) {
                    setProfile(data);
                    setEntityType(data.entity_type);
                    setForm((prev) => ({ ...prev, ...data }));
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = { ...form, entity_type: entityType };
            const saved = await fetchApi('/shippers/profile', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setProfile(saved);
            alert('Verification details submitted. An admin will review them shortly.');
        } catch (err: any) {
            alert(err.message || 'Failed to save your details');
        } finally {
            setSaving(false);
        }
    };

    const allowedDocTypes = entityType === 'INDIVIDUAL' ? ['ID_CARD'] : ['ID_CARD', 'PHOTO', 'COMPANY_REGISTRY'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Verification</h1>
                    <p className="text-gray-500 mt-1">Complete this once to start creating shipments.</p>
                </div>
                {profile && (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase ${STATUS_STYLES[profile.verification_status]}`}>
                        {profile.verification_status}
                    </span>
                )}
            </header>

            {profile?.verification_status === 'REJECTED' && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
                    Your previous submission was rejected. Please review your details and documents below, then resubmit.
                </div>
            )}
            {profile?.verification_status === 'PENDING' && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-sm text-yellow-700">
                    Your details are submitted and awaiting admin review. You can still update them below before it's reviewed.
                </div>
            )}
            {profile?.verification_status === 'VERIFIED' && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-700">
                    You're verified — you can create shipments freely.
                </div>
            )}

            <div className="glass p-6 rounded-3xl shadow-sm space-y-5">
                <div className="flex gap-2">
                    {(['INDIVIDUAL', 'LEGAL_ENTITY'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setEntityType(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${entityType === t
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {t === 'INDIVIDUAL' ? 'Individual' : 'Legal Entity (Company)'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="First Name" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
                    <Field label="Last Name" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
                </div>

                {entityType === 'INDIVIDUAL' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Personal Number" value={form.personal_number} onChange={(e) => update('personal_number', e.target.value)} />
                        <Field label="Physical Address" value={form.physical_address} onChange={(e) => update('physical_address', e.target.value)} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Company Name" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
                        <Field label="Company ID" value={form.company_id} onChange={(e) => update('company_id', e.target.value)} />
                        <Field label="Director Name / Surname" value={form.director_name} onChange={(e) => update('director_name', e.target.value)} />
                        <Field label="Contact Person" value={form.contact_person} onChange={(e) => update('contact_person', e.target.value)} />
                        <Field label="Company Operation Field" value={form.operation_field} onChange={(e) => update('operation_field', e.target.value)} />
                        <div />
                        <Field label="Company Legal Address" value={form.legal_address} onChange={(e) => update('legal_address', e.target.value)} />
                        <Field label="Company Office Address" value={form.office_address} onChange={(e) => update('office_address', e.target.value)} />
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Bank Account</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Bank Name" value={form.bank_name} onChange={(e) => update('bank_name', e.target.value)} />
                        <Field label="Bank Code" value={form.bank_code} onChange={(e) => update('bank_code', e.target.value)} />
                        <Field label="Bank Account" value={form.bank_account} onChange={(e) => update('bank_account', e.target.value)} />
                        <Field label="Currency" value={form.currency} onChange={(e) => update('currency', e.target.value)} />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : profile ? 'Update Details' : 'Submit for Review'}
                </button>
            </div>

            <div className="glass p-6 rounded-3xl shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Required Documents</h2>
                <p className="text-sm text-gray-500 mb-4">
                    {entityType === 'INDIVIDUAL' ? 'Upload your ID Card or Passport.' : 'Upload an ID Card, a photo, and your company registry extract.'}
                </p>
                <DocumentUpload allowedTypes={allowedDocTypes} />
            </div>
        </div>
    );
}
