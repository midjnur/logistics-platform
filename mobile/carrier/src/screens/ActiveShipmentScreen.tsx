import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import api from '../lib/api';
import { useTracking } from '../context/TrackingContext';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'ActiveShipment'>;

const STEPS = [
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'DRIVER_AT_PICKUP', label: 'Arrived at Pickup' },
    { status: 'LOADING_STARTED', label: 'Loading' },
    { status: 'LOADING_FINISHED', label: 'Loading Done' },
    { status: 'IN_TRANSIT', label: 'In Transit' },
    { status: 'ARRIVED_DELIVERY', label: 'Arrived at Delivery' },
    { status: 'UNLOADING_FINISHED', label: 'Unloading Done' },
    { status: 'DELIVERED', label: 'Delivered' },
];

interface ShipmentDetail {
    id: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    price?: number;
}

export default function ActiveShipmentScreen({ route, navigation }: Props) {
    const { shipmentId } = route.params;
    const { isOnline, refreshActiveShipment } = useTracking();
    const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const load = useCallback(() => {
        api.get(`/shipments/${shipmentId}`)
            .then(({ data }) => setShipment(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [shipmentId]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load]),
    );

    const currentIndex = shipment ? STEPS.findIndex((s) => s.status === shipment.status) : -1;
    const nextStep = currentIndex >= 0 && currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;

    const handleAdvance = async () => {
        if (!nextStep || !shipment) return;
        setUpdating(true);
        try {
            await api.patch(`/shipments/${shipment.id}/status`, { status: nextStep.status });
            await load();
            await refreshActiveShipment();
            if (nextStep.status === 'DELIVERED') {
                Alert.alert('Delivered!', 'Great work. You can go offline now if you’re done for the day.', [
                    { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
                ]);
            }
        } catch (err: any) {
            Alert.alert('Failed to update status', err.response?.data?.message || 'Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading || !shipment) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
            <View className="flex-row items-center gap-2 mb-4">
                <View className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                <Text className="text-sm font-bold text-gray-600">
                    {isOnline ? 'Live tracking active — shipper can see your location' : 'Tracking paused (offline)'}
                </Text>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
                <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Route</Text>
                <View className="flex-row items-start gap-2 mb-2">
                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    <Text className="font-bold text-gray-900 flex-1">{shipment.pickup_address}</Text>
                </View>
                <View className="flex-row items-start gap-2">
                    <View className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                    <Text className="font-bold text-gray-900 flex-1">{shipment.delivery_address}</Text>
                </View>
                <Text className="text-xs text-gray-400 mt-3">{shipment.cargo_type} · {shipment.weight_kg} kg</Text>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
                <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Progress</Text>
                {STEPS.map((step, i) => {
                    const done = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                        <View key={step.status} className="flex-row items-center mb-3 last:mb-0">
                            <View
                                className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${done ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            >
                                {done && <Text className="text-white text-xs font-bold">&#10003;</Text>}
                            </View>
                            <Text className={`font-semibold ${isCurrent ? 'text-blue-700' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                                {step.label}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {nextStep && (
                <TouchableOpacity
                    onPress={handleAdvance}
                    disabled={updating}
                    className={`bg-gray-900 py-4 rounded-xl items-center ${updating ? 'opacity-60' : ''}`}
                >
                    {updating ? <ActivityIndicator color="white" /> : (
                        <Text className="text-white font-bold text-base">Mark as: {nextStep.label}</Text>
                    )}
                </TouchableOpacity>
            )}

            {!nextStep && (
                <View className="items-center py-4">
                    <Text className="text-green-600 font-bold">Shipment complete.</Text>
                </View>
            )}
        </ScrollView>
    );
}
