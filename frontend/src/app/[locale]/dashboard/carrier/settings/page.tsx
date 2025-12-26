'use client';

import { useTranslations } from 'next-intl';

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center glass p-6 rounded-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your account preferences</p>
                </div>
            </header>

            <div className="glass p-8 rounded-3xl shadow-sm min-h-[400px]">
                <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="bg-white/50 rounded-xl p-4 border border-white/60 mb-6">
                        <p className="text-sm text-gray-500">Email: carrier@test.com</p>
                        <p className="text-sm text-gray-500 mt-1">Role: Carrier</p>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                            <span className="text-gray-700">New shipment alerts</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                            <span className="text-gray-700">Offer updates</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
