import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CreateShipmentScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <Text className="text-xl font-bold text-gray-800">Create Shipment</Text>
            <Text className="text-gray-500">Form coming soon...</Text>
        </SafeAreaView>
    );
}

export function MyShipmentsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <Text className="text-xl font-bold text-gray-800">My Shipments</Text>
            <Text className="text-gray-500">List of all shipments</Text>
        </SafeAreaView>
    );
}

export function ActiveShipmentsScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <Text className="text-xl font-bold text-gray-800">Active Orders</Text>
            <Text className="text-gray-500">Tracking map will be here</Text>
        </SafeAreaView>
    );
}

export function MenuScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <Text className="text-xl font-bold text-gray-800">Menu</Text>
            <Text className="text-gray-500">Settings, Profile, etc.</Text>
        </SafeAreaView>
    );
}
