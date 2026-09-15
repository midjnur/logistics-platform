import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../lib/api';
import ShipmentCard, { Shipment } from '../components/ShipmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface MyShipmentsScreenProps {
    onNavigate: (screen: string, params?: any) => void;
    onOpenMenu: () => void;
}

export default function MyShipmentsScreen({ onNavigate, onOpenMenu }: MyShipmentsScreenProps) {
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
            // Filter for active shipments (OPEN, OFFERED)
            const activeShipments = response.data.filter((s: Shipment) =>
                ['OPEN', 'OFFERED'].includes(s.status)
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
        return <LoadingSpinner message="Loading shipments..." />;
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-6 border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity
                        onPress={onOpenMenu}
                        className="mr-3"
                    >
                        <Ionicons name="menu" size={32} color="#1F2937" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-900">My Shipments</Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Track and manage all your shipments
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => onNavigate('create')}
                    className="bg-blue-600 px-4 py-3 rounded-xl flex-row items-center justify-center mt-4"
                >
                    <Ionicons name="add" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">Create Shipment</Text>
                </TouchableOpacity>
            </View>

            {/* Shipments List */}
            {shipments.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="cube-outline" size={40} color="#2563eb" />
                    </View>
                    <Text className="text-gray-600 font-semibold text-center mb-2">
                        No shipments yet
                    </Text>
                    <Text className="text-sm text-gray-400 text-center mb-6">
                        Create your first shipment to get started
                    </Text>
                    <TouchableOpacity
                        onPress={() => onNavigate('create')}
                        className="bg-blue-600 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold">Create Shipment</Text>
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
