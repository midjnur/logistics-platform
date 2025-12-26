'use client';

export default function TermsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="glass p-6 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Terms and Conditions</h1>
                <p className="text-gray-500 mt-1">Legal information</p>
            </header>
            <div className="glass p-12 rounded-3xl shadow-sm">
                <div className="prose max-w-none text-gray-600">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    {/* Add real terms later */}
                </div>
            </div>
        </div>
    );
}
