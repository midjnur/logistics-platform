'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WizardStepProps {
    title: string;
    description?: string;
    isActive: boolean;
    isCompleted: boolean;
    icon: React.ReactNode;
}

export const WizardStepIndicator = ({ steps, currentStep }: { steps: WizardStepProps[]; currentStep: number }) => {
    return (
        <div className="flex justify-between items-center mb-12 relative px-4">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />
            <div
                className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center gap-2 bg-white px-2">
                    <motion.div
                        initial={false}
                        animate={{
                            scale: index === currentStep ? 1.2 : 1,
                            backgroundColor: index <= currentStep ? '#2563EB' : '#E5E7EB',
                            borderColor: index <= currentStep ? '#2563EB' : '#D1D5DB',
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 transition-colors duration-300 relative`}
                    >
                        {index < currentStep ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            step.icon
                        )}
                    </motion.div>
                    <div className="hidden md:block text-center">
                        <p className={`text-sm font-bold ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>{step.title}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
