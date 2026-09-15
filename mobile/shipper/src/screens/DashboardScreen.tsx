import React, { useEffect, useState, useRef } from 'react';
import { Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import ShipmentCard, { Shipment } from '../components/ShipmentCard';
import CustomSidebar from '../components/CustomSidebar';
import MyShipmentsScreen from './MyShipmentsScreen';
import CreateShipmentScreen from './CreateShipmentScreen';
import UpcomingShipmentsScreen from './UpcomingShipmentsScreen';
import ActiveShipmentsScreen from './ActiveShipmentsScreen';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';
import MyDocumentsScreen from './MyDocumentsScreen';
import TermsScreen from './TermsScreen';
import ShipmentDetailsScreen from './ShipmentDetailsScreen';

interface DashboardStats {
    totalShipments: number;
    pendingActions: number;
    earnings: number;
    growthPercent: string;
}

export default function DashboardScreen() {
    const { logout, userToken } = useAuth();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalShipments: 0,
        pendingActions: 0,
        earnings: 0,
        growthPercent: '0%'
    });
    const [loading, setLoading] = useState(true);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('overview');
    const [screenParams, setScreenParams] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const contentScale = useRef(new Animated.Value(1)).current;

    const loadData = async () => {
        if (!userToken) {
            console.log('No user token, skipping data load');
            setLoading(false);
            return;
        }

        try {
            // Parallel requests for speed, mirroring web app logic
            const [authRes, statsRes, shipmentsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/shipments/dashboard-stats'),
                api.get('/shipments')
            ]);

            setUserEmail(authRes.data.email);
            setStats(statsRes.data);

            // Web app filters for "Active" shipments for the list view usually, 
            // but here we just show what returns or filter similarly if needed.
            // The web dashboard actually separates "Quick Actions" from the list.
            // We will show stats + quick actions + recent active shipments.
            // Filter for truly active shipments (excluding OPEN/OFFERED)
            const active = shipmentsRes.data.filter((s: Shipment) =>
                ['ASSIGNED', 'IN_TRANSIT', 'LOADING_STARTED', 'LOADING_FINISHED', 'DRIVER_AT_PICKUP'].includes(s.status)
            );
            setShipments(active);

        } catch (error: any) {
            if (error.response?.status === 401) {
                console.log('Session expired, logging out');
                logout();
                return;
            }
            console.error('Dashboard load error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        Animated.timing(contentScale, {
            toValue: sidebarVisible ? 0.75 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [sidebarVisible]);

    useEffect(() => {
        loadData();
    }, []);

    const handleNavigate = (screen: string, params?: any) => {
        setCurrentScreen(screen);
        if (params) setScreenParams(params);
        setSidebarVisible(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const Header = () => (
        <View className="mb-6">
            <View className="flex-row items-center mb-6">
                <TouchableOpacity onPress={() => setSidebarVisible(true)} className="mr-4">
                    <Ionicons name="menu" size={32} color="#1F2937" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</Text>
                    <Text className="text-gray-500 text-sm mt-1">Welcome back, {userEmail}</Text>
                </View>
            </View>

            {/* Stats Cards Row */}
            <View className="flex-row gap-4 mb-6">
                {/* Total Shipments Card */}
                <View className="flex-1 bg-white/80 p-4 rounded-3xl border border-white shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="p-2 bg-blue-50 rounded-xl">
                            <Text className="text-blue-600 font-bold">📦</Text>
                        </View>
                        <Text className={`text-[10px] font-bold px-2 py-1 rounded-lg ${stats.growthPercent.includes('+') ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                            {stats.growthPercent}
                        </Text>
                    </View>
                    <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Shipments</Text>
                    <Text className="text-2xl font-black text-gray-900 mt-1">{stats.totalShipments}</Text>
                </View>

                {/* Pending Actions Card */}
                <View className="flex-1 bg-white/80 p-4 rounded-3xl border border-white shadow-sm">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="p-2 bg-orange-50 rounded-xl">
                            <Text className="text-orange-600 font-bold">⚠️</Text>
                        </View>
                    </View>
                    <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">Pending Actions</Text>
                    <Text className="text-2xl font-black text-gray-900 mt-1">{stats.pendingActions}</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <Text className="text-xl font-bold text-gray-900 mb-4">Quick Actions</Text>
            <View className="gap-4 mb-8">
                <TouchableOpacity
                    className="flex-row items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                    onPress={() => handleNavigate('create')}
                >
                    <View className="p-3 bg-blue-100 rounded-xl mr-4">
                        <Text className="text-2xl text-blue-600">+</Text>
                    </View>
                    <View>
                        <Text className="font-bold text-gray-900 text-lg">Create New Shipment</Text>
                        <Text className="text-gray-500 text-xs">Post a new load for carriers</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-row items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                    onPress={() => handleNavigate('my-shipments')}
                >
                    <View className="p-3 bg-purple-100 rounded-xl mr-4">
                        <Text className="text-2xl text-purple-600">📋</Text>
                    </View>
                    <View>
                        <Text className="font-bold text-gray-900 text-lg">View My Shipments</Text>
                        <Text className="text-gray-500 text-xs">Track status and history</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <Text className="text-xl font-bold text-gray-900 mb-4">Active Shipments</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1 flex-row">
                <CustomSidebar
                    visible={sidebarVisible}
                    onClose={() => setSidebarVisible(false)}
                    onNavigate={(screen) => setCurrentScreen(screen)}
                    currentScreen={currentScreen}
                />
                <Animated.View
                    className="flex-1"
                    style={{
                        transform: [{ scale: contentScale }],
                    }}
                >
                    {renderScreen()}
                </Animated.View>
            </View>
        </SafeAreaView>
    );

    function renderScreen() {

        switch (currentScreen) {
            case 'my-shipments':
                return <MyShipmentsScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'shipment-details':
                return (
                    <ShipmentDetailsScreen
                        shipmentId={screenParams?.shipmentId}
                        onBack={() => handleNavigate('my-shipments')}
                    />
                );
            case 'create':
                return <CreateShipmentScreen onNavigate={handleNavigate} />;
            case 'upcoming':
                return <UpcomingShipmentsScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'active':
                return <ActiveShipmentsScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'history':
                return <HistoryScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'settings':
                return <SettingsScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'documents':
                return <MyDocumentsScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'terms':
                return <TermsScreen onNavigate={handleNavigate} onOpenMenu={() => setSidebarVisible(true)} />;
            case 'overview':
            default:
                return (
                    <>
                        {loading ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" color="#2563EB" />
                            </View>
                        ) : (
                            <FlatList
                                data={shipments}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => <ShipmentCard shipment={item} />}
                                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                                ListHeaderComponent={Header}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                }
                                ListEmptyComponent={
                                    <View className="items-center justify-center py-10 opacity-50 bg-white rounded-3xl border border-dashed border-gray-200">
                                        <Text className="text-gray-400 text-lg font-medium">No active shipments found</Text>
                                    </View>
                                }
                            />
                        )}
                    </>
                );
        }
    }
}
