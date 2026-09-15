import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTracking, Shipment } from '../context/TrackingContext';
import api from '../lib/api';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
    const { user, logout } = useAuth();
    const { isOnline, activeShipment, canGoOffline, permissionError, goingOnline, goOnline, goOffline, refreshActiveShipment } = useTracking();
    const [jobs, setJobs] = useState<Shipment[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadJobs = useCallback(async () => {
        try {
            const { data } = await api.get<Shipment[]>('/shipments');
            setJobs(data);
        } catch (err) {
            console.error('Failed to load jobs', err);
        } finally {
            setLoadingJobs(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshActiveShipment();
            if (!activeShipment) loadJobs();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [activeShipment?.id]),
    );

    useEffect(() => {
        if (activeShipment) {
            navigation.navigate('ActiveShipment', { shipmentId: activeShipment.id });
        }
    }, [activeShipment, navigation]);

    const handleToggleOnline = async () => {
        if (isOnline) {
            await goOffline();
        } else {
            await goOnline();
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadJobs();
    };

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-gray-900 pt-14 pb-6 px-5 rounded-b-3xl">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Welcome back</Text>
                        <Text className="text-white text-xl font-bold mt-0.5">
                            {user?.carrier ? `${user.carrier.first_name} ${user.carrier.last_name}`.trim() : user?.email}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={logout} className="bg-white/10 px-3 py-2 rounded-lg">
                        <Text className="text-white text-xs font-bold">Logout</Text>
                    </TouchableOpacity>
                </View>

                <View className="bg-white/10 rounded-2xl p-4 mt-5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <View className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                        <Text className="text-white font-bold text-base ml-2">{isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleToggleOnline}
                        disabled={goingOnline || (isOnline && !canGoOffline)}
                        className={`px-5 py-2.5 rounded-xl ${isOnline ? (canGoOffline ? 'bg-red-500' : 'bg-gray-600') : 'bg-green-500'} ${goingOnline ? 'opacity-60' : ''}`}
                    >
                        {goingOnline ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-white font-bold text-sm">{isOnline ? 'Go Offline' : 'Go Online'}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {isOnline && !canGoOffline && (
                    <Text className="text-amber-300 text-xs mt-2 px-1">
                        Locked online — you have a delivery in progress.
                    </Text>
                )}
                {permissionError && <Text className="text-red-300 text-xs mt-2 px-1">{permissionError}</Text>}
            </View>

            <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-900">Available Jobs</Text>
                <Text className="text-xs text-gray-400 font-semibold">{jobs.length} open</Text>
            </View>

            {loadingJobs ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 12 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View className="items-center py-16">
                            <Text className="text-gray-400 font-medium">No open jobs right now.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('JobDetails', { shipmentId: item.id })}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                        >
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-2 h-2 rounded-full bg-blue-500" />
                                <Text className="font-bold text-gray-900 flex-1" numberOfLines={1}>
                                    {item.pickup_address.split(',')[0]}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2 mb-3">
                                <View className="w-2 h-2 rounded-full bg-red-500" />
                                <Text className="font-bold text-gray-900 flex-1" numberOfLines={1}>
                                    {item.delivery_address.split(',')[0]}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-xs text-gray-500">{item.cargo_type} · {item.weight_kg}kg</Text>
                                {item.price ? <Text className="text-blue-600 font-black">€{item.price}</Text> : null}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}
