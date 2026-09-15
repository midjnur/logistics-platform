import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../lib/api';
import ShipmentCard, { Shipment } from '../components/ShipmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface ActiveShipmentsScreenProps {
    onNavigate: (screen: string, params?: any) => void;
    onOpenMenu: () => void;
}

export default function ActiveShipmentsScreen({ onNavigate, onOpenMenu }: ActiveShipmentsScreenProps) {
    const { userToken } = useAuth();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchShipments = async () => {
        if (!userToken) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const response = await api.get('/shipments');
            // Filter for active shipments - matching web app statuses
            const activeShipments = response.data.filter((s: Shipment) =>
                [
                    'DRIVER_AT_PICKUP',
                    'LOADING_STARTED',
                    'LOADING_FINISHED',
                    'IN_TRANSIT',
                    'ARRIVED_DELIVERY',
                    'UNLOADING_FINISHED'
                ].includes(s.status)
            );
            setShipments(activeShipments);
        } catch (error) {
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchShipments();
        }
    }, [userToken]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchShipments();
    };

    if (loading) {
        return <LoadingSpinner message="Loading active shipments..." />;
    }

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
                        <Text className="text-2xl font-bold text-gray-900">Active Shipments</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Track your shipments in real-time
                        </Text>
                    </View>
                </View>
            </View>

            {/* Shipments List */}
            {shipments.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="flash-outline" size={40} color="#2563eb" />
                    </View>
                    <Text className="text-xl font-semibold text-gray-900 mb-2">No active shipments in transit.</Text>
                    <TouchableOpacity onPress={() => onNavigate('create')} className="mt-2">
                        <Text className="text-blue-600 font-medium text-lg">Create a new shipment</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={shipments}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ShipmentCard
                            shipment={item}
                            onPress={() => {
                                onNavigate('shipment-details', { shipmentId: item.id });
                            }}
                        />
                    )}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#2563eb"
                        />
                    }
                />
            )}
        </View>
    );
}
