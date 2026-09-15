import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MyDocumentsScreenProps {
    onNavigate: (screen: string) => void;
    onOpenMenu: () => void;
}

export default function MyDocumentsScreen({ onNavigate, onOpenMenu }: MyDocumentsScreenProps) {
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
                        <Text className="text-2xl font-bold text-gray-900">My Documents</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Manage your shipping documents
                        </Text>
                    </View>
                </View>
            </View>

            {/* Empty State */}
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="document-text-outline" size={40} color="#7c3aed" />
                </View>
                <Text className="text-gray-600 font-semibold text-center mb-2">
                    No documents yet
                </Text>
                <Text className="text-sm text-gray-400 text-center mb-6">
                    Upload and manage your shipping documents here
                </Text>
                <TouchableOpacity className="bg-purple-600 px-6 py-3 rounded-xl flex-row items-center">
                    <Ionicons name="cloud-upload-outline" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Upload Document</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
