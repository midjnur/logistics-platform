import './global.css';
// Registers the background location task at module load time, so the OS
// can find and invoke it even before any screen has mounted.
import './src/lib/locationTask';

import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TrackingProvider } from './src/context/TrackingContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import ActiveShipmentScreen from './src/screens/ActiveShipmentScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
    const { userToken, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!userToken) {
        return <LoginScreen />;
    }

    return (
        <TrackingProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
                    <Stack.Screen name="ActiveShipment" component={ActiveShipmentScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </TrackingProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
        </AuthProvider>
    );
}
