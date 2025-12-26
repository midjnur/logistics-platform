'use client';

import { useTranslations } from 'next-intl';

export default function TermsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Terms and Conditions</h1>
                    <p className="text-gray-500 mt-1">Legal information and usage guidelines</p>
                </div>
            </header>

            <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                <div className="prose prose-blue max-w-none">
                    <h3>1. Introduction</h3>
                    <p>Welcome to our Logistics Platform. By accessing or using our services, you agree to be bound by these terms.</p>

                    <h3>2. Carrier Responsibilities</h3>
                    <p>Carriers are responsible for ensuring timely and safe delivery of shipments...</p>

                    <h3>3. Payment Terms</h3>
                    <p>Payments will be processed within 30 days of delivery confirmation...</p>
                </div>
            </div>
        </div>
    );
}
