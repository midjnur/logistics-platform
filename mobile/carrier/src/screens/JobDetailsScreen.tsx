import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import api from '../lib/api';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'JobDetails'>;

interface ShipmentDetail {
    id: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    pickup_time?: string;
    delivery_time?: string;
    distance?: number;
    temperature_control?: boolean;
    has_tir?: boolean;
    has_cmr?: boolean;
    has_waybill?: boolean;
}

export default function JobDetailsScreen({ route, navigation }: Props) {
    const { shipmentId } = route.params;
    const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(`/shipments/${shipmentId}`)
            .then(({ data }) => setShipment(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [shipmentId]);

    const handleSubmitOffer = async () => {
        const parsedPrice = parseFloat(price);
        if (!parsedPrice || parsedPrice <= 0) {
            Alert.alert('Invalid price', 'Enter a valid offer price.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/offers', {
                shipment_id: shipmentId,
                offered_price: parsedPrice,
                message: message.trim() || undefined,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });
            Alert.alert('Offer sent', 'The shipper will be notified.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Failed to submit offer', err.response?.data?.message || 'Please try again.');
        } finally {
            setSubmitting(false);
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
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
                <Text className="text-blue-600 font-bold">&larr; Back</Text>
            </TouchableOpacity>

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
                {shipment.distance ? <Text className="text-xs text-gray-400 mt-3">{shipment.distance} km</Text> : null}
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
                <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Cargo</Text>
                <Text className="text-gray-900 font-semibold">{shipment.cargo_type} · {shipment.weight_kg} kg</Text>
                <View className="flex-row flex-wrap gap-2 mt-3">
                    {shipment.temperature_control && (
                        <View className="bg-blue-50 px-2.5 py-1 rounded-lg"><Text className="text-blue-700 text-xs font-bold">Refrigerated</Text></View>
                    )}
                    {shipment.has_tir && <View className="bg-indigo-50 px-2.5 py-1 rounded-lg"><Text className="text-indigo-700 text-xs font-bold">TIR</Text></View>}
                    {shipment.has_cmr && <View className="bg-purple-50 px-2.5 py-1 rounded-lg"><Text className="text-purple-700 text-xs font-bold">CMR</Text></View>}
                    {shipment.has_waybill && <View className="bg-pink-50 px-2.5 py-1 rounded-lg"><Text className="text-pink-700 text-xs font-bold">Waybill</Text></View>}
                </View>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100">
                <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Submit Your Offer</Text>
                <Text className="text-gray-600 mb-1.5 font-medium text-sm">Price (€)</Text>
                <TextInput
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base mb-4"
                />
                <Text className="text-gray-600 mb-1.5 font-medium text-sm">Message (optional)</Text>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Anything the shipper should know..."
                    multiline
                    numberOfLines={3}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base mb-4"
                    style={{ textAlignVertical: 'top' }}
                />
                <TouchableOpacity
                    onPress={handleSubmitOffer}
                    disabled={submitting}
                    className={`bg-gray-900 py-4 rounded-xl items-center ${submitting ? 'opacity-60' : ''}`}
                >
                    {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Submit Offer</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
