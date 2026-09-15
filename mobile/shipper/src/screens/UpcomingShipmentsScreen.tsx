import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../lib/api';
import ShipmentCard, { Shipment } from '../components/ShipmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface UpcomingShipmentsScreenProps {
    onNavigate: (screen: string, params?: any) => void;
    onOpenMenu: () => void;
}

export default function UpcomingShipmentsScreen({ onNavigate, onOpenMenu }: UpcomingShipmentsScreenProps) {
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
            // Filter for upcoming shipments (ASSIGNED status)
            const upcomingShipments = response.data.filter((s: Shipment) =>
                s.status === 'ASSIGNED'
            );
            setShipments(upcomingShipments);
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
        return <LoadingSpinner message="Loading upcoming shipments..." />;
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
                        <Text className="text-2xl font-bold text-gray-900">Upcoming Shipments</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Shipments confirmed and ready for pickup
                        </Text>
                    </View>
                </View>
            </View>

            {/* Shipments List */}
            {shipments.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="calendar-outline" size={40} color="#059669" />
                    </View>
                    <Text className="text-gray-600 font-semibold text-center mb-2">
                        No upcoming shipments
                    </Text>
                    <Text className="text-sm text-gray-400 text-center">
                        Shipments that are confirmed will appear here
                    </Text>
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
