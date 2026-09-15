import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface SettingsScreenProps {
    onNavigate: (screen: string) => void;
    onOpenMenu: () => void;
}

export default function SettingsScreen({ onNavigate, onOpenMenu }: SettingsScreenProps) {
    const { logout } = useAuth();

    const settingsOptions = [
        { id: 'profile', label: 'Profile Information', icon: 'person-outline', color: '#2563eb' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications-outline', color: '#7c3aed' },
        { id: 'security', label: 'Security & Privacy', icon: 'shield-checkmark-outline', color: '#059669' },
        { id: 'language', label: 'Language', icon: 'language-outline', color: '#ea580c' },
        { id: 'help', label: 'Help & Support', icon: 'help-circle-outline', color: '#0891b2' },
    ];

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-6 border-b border-gray-100">
                <View className="flex-row items-center mb-2">
                    <TouchableOpacity
                        onPress={onOpenMenu}
                        className="mr-3"
                    >
                        <Ionicons name="menu" size={32} color="#111827" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Manage your account and preferences
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Settings Options */}
                <View className="bg-white rounded-2xl overflow-hidden mb-4">
                    {settingsOptions.map((option, index) => (
                        <TouchableOpacity
                            key={option.id}
                            className={`flex-row items-center p-4 ${index !== settingsOptions.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                            onPress={() => console.log('Navigate to:', option.id)}
                        >
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                                style={{ backgroundColor: `${option.color}15` }}
                            >
                                <Ionicons name={option.icon as any} size={22} color={option.color} />
                            </View>
                            <Text className="flex-1 text-gray-900 font-semibold">{option.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View className="bg-white rounded-2xl p-4 mb-4">
                    <Text className="text-xs text-gray-400 text-center mb-1">Version 1.0.0</Text>
                    <Text className="text-xs text-gray-400 text-center">© 2026 Logistics Platform</Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={logout}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center justify-center"
                >
                    <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                    <Text className="text-red-600 font-bold ml-2">Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
