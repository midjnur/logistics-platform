import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsScreenProps {
    onNavigate: (screen: string) => void;
    onOpenMenu: () => void;
}

export default function TermsScreen({ onNavigate, onOpenMenu }: TermsScreenProps) {
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
                        <Text className="text-2xl font-bold text-gray-900">Terms and Conditions</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Legal terms and policies
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-6">
                <View className="bg-white rounded-2xl p-6">
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        Terms of Service
                    </Text>

                    <Text className="text-sm text-gray-600 mb-4 leading-6">
                        Welcome to Logistics Platform. By using our services, you agree to these terms.
                        Please read them carefully.
                    </Text>

                    <Text className="text-base font-bold text-gray-900 mb-2 mt-4">
                        1. Use of Services
                    </Text>
                    <Text className="text-sm text-gray-600 mb-4 leading-6">
                        You must follow any policies made available to you within the Services.
                        Don't misuse our Services. For example, don't interfere with our Services
                        or try to access them using a method other than the interface and the
                        instructions that we provide.
                    </Text>

                    <Text className="text-base font-bold text-gray-900 mb-2 mt-4">
                        2. Privacy
                    </Text>
                    <Text className="text-sm text-gray-600 mb-4 leading-6">
                        Our privacy policies explain how we treat your personal data and protect
                        your privacy when you use our Services. By using our Services, you agree
                        that we can use such data in accordance with our privacy policies.
                    </Text>

                    <Text className="text-base font-bold text-gray-900 mb-2 mt-4">
                        3. Liability
                    </Text>
                    <Text className="text-sm text-gray-600 mb-4 leading-6">
                        When permitted by law, we will not be responsible for lost profits, revenues,
                        or data, financial losses or indirect, special, consequential, exemplary,
                        or punitive damages.
                    </Text>

                    <Text className="text-base font-bold text-gray-900 mb-2 mt-4">
                        4. Changes
                    </Text>
                    <Text className="text-sm text-gray-600 mb-4 leading-6">
                        We may modify these terms or any additional terms that apply to a Service
                        to, for example, reflect changes to the law or changes to our Services.
                        You should look at the terms regularly.
                    </Text>

                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                        <Text className="text-xs text-blue-700 text-center">
                            Last updated: January 28, 2026
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
