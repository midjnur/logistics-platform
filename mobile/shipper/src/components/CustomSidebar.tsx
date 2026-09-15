import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
    onNavigate: (screen: string) => void;
    currentScreen: string;
}

export default function CustomSidebar({ visible, onClose, onNavigate, currentScreen }: SidebarProps) {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const { logout } = useAuth();

    React.useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [visible]);

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: 'menu-outline' },
        { id: 'create', label: 'Create Shipment', icon: 'add-outline' },
        { id: 'my-shipments', label: 'My Shipments', icon: 'cube-outline' },
        { id: 'upcoming', label: 'Upcoming Shipments', icon: 'calendar-outline' },
        { id: 'active', label: 'Active Shipments', icon: 'flash-outline' },
        { id: 'history', label: 'History', icon: 'time-outline' },
        { id: 'settings', label: 'Settings', icon: 'settings-outline' },
        { id: 'documents', label: 'My Documents', icon: 'document-text-outline' },
        { id: 'terms', label: 'Terms and Conditions', icon: 'book-outline' },
    ];

    const sidebarTranslateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SIDEBAR_WIDTH, 0],
    });

    return (
        <Animated.View
            style={[
                styles.sidebar,
                {
                    width: SIDEBAR_WIDTH,
                    transform: [{ translateX: sidebarTranslateX }]
                }
            ]}
        >
            <ScrollView className="flex-1 bg-white">
                {/* User Profile Header */}
                <View className="bg-gray-50 p-6 pt-16 mb-2 border-b border-gray-200">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center mr-4">
                            <Text className="text-white text-2xl font-bold">S</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-lg">Shipper</Text>
                            <Text className="text-gray-500 text-sm">shipper@test.com</Text>
                        </View>
                    </View>
                </View>

                {/* Account Status */}
                <View className="px-6 py-3 mb-4">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <Text className="text-gray-700 font-medium">Account Active</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="px-2">
                    {menuItems.map((item) => {
                        const isActive = currentScreen === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    onNavigate(item.id);
                                    onClose();
                                }}
                                className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${isActive ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={22}
                                    color={isActive ? '#2563EB' : '#6B7280'}
                                />
                                <Text className={`ml-3 font-semibold ${isActive ? 'text-blue-600' : 'text-gray-700'
                                    }`}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Logout Button */}
            <View className="p-4 border-t border-gray-100 bg-white">
                <TouchableOpacity
                    onPress={() => {
                        onClose();
                        logout();
                    }}
                    className="flex-row items-center p-3"
                >
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                    <Text className="text-red-500 font-bold ml-3">Log Out</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    sidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
});
