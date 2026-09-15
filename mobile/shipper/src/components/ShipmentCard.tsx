import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    distance?: number;
    status: string;
    price: number;
    created_at: string;
    offers?: any[];
}

interface ShipmentCardProps {
    shipment: Shipment;
    onPress?: () => void;
}

export default function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
            case 'OFFERED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ASSIGNED': return 'bg-green-100 text-green-800 border-green-200';
            case 'DELIVERED': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const CardContent = () => (
        <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100 shadow-sm">
            {/* Header: Type & Status */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                    {shipment.cargo_type}
                </Text>
                {/* Status badge removed as per user request */}
            </View>

            {/* Route */}
            <View className="space-y-3 mb-4">
                <View className="flex-row items-center space-x-3">
                    <View className="w-2 h-2 rounded-full bg-blue-500" />
                    <Text className="text-gray-900 font-bold flex-1" numberOfLines={1}>
                        {shipment.pickup_address.split(',')[0]}
                    </Text>
                </View>
                <View className="ml-1 border-l border-dashed border-gray-300 h-3" />
                <View className="flex-row items-center space-x-3">
                    <View className="w-2 h-2 rounded-full bg-red-500" />
                    <Text className="text-gray-900 font-bold flex-1" numberOfLines={1}>
                        {shipment.delivery_address.split(',')[0]}
                    </Text>
                </View>
            </View>

            {/* Metadata Grid - Match Web App */}
            <View className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 mb-3">
                <View className="flex-row flex-wrap">
                    <View className="w-1/3 mb-2">
                        <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Weight</Text>
                        <Text className="text-sm font-bold text-gray-700">{shipment.weight_kg} kg</Text>
                    </View>
                    <View className="w-1/3 mb-2">
                        <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Pickup</Text>
                        <Text className="text-sm font-bold text-gray-700">Flexible</Text>
                    </View>
                    <View className="w-1/3 mb-2">
                        <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Distance</Text>
                        <Text className="text-sm font-bold text-gray-700">{shipment.distance ? `${shipment.distance.toLocaleString()} km` : '-'}</Text>
                    </View>
                    <View className="w-1/2">
                        <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Created</Text>
                        <Text className="text-sm font-bold text-gray-700">{new Date(shipment.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View className="w-1/2">
                        <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">ID</Text>
                        <Text className="text-xs font-mono text-gray-700">{shipment.id.split('-')[0]}</Text>
                    </View>
                </View>
            </View>

            {/* Price & Action - Separate section */}
            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Price</Text>
                    <Text className="text-2xl font-black text-gray-900">€{shipment.price?.toLocaleString() || '0'}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                    <Text className="text-sm font-bold text-blue-600">View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                </View>
            </View>

            {/* Offers Badge */}
            {shipment.offers && shipment.offers.length > 0 && (
                <View className="mt-3 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                    <Text className="text-xs font-bold text-blue-700">
                        {shipment.offers.length} offer{shipment.offers.length !== 1 ? 's' : ''} received
                    </Text>
                </View>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <CardContent />
            </TouchableOpacity>
        );
    }

    return <CardContent />;
}
