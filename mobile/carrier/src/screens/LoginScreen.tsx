import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('demo.carrier@logistics.app');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token } = response.data;
            if (access_token) {
                await login(access_token);
            } else {
                Alert.alert('Error', 'No access token received');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Connection failed. Check your API URL.';
            Alert.alert('Login Failed', Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-6"
            >
                <View className="items-center mb-10">
                    <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-4">
                        <Text className="text-white text-2xl font-black">L</Text>
                    </View>
                    <Text className="text-white text-3xl font-extrabold tracking-tight text-center">
                        Logistics Platform
                    </Text>
                    <Text className="text-gray-400 text-lg mt-1 font-medium">Carrier</Text>
                </View>

                <View className="w-full">
                    <Text className="text-gray-300 mb-2 ml-1 font-medium">Email Address</Text>
                    <TextInput
                        className="bg-white/10 text-white px-4 py-4 rounded-xl border border-white/20 font-medium mb-4"
                        placeholder="name@company.com"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text className="text-gray-300 mb-2 ml-1 font-medium">Password</Text>
                    <TextInput
                        className="bg-white/10 text-white px-4 py-4 rounded-xl border border-white/20 font-medium"
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        className={`mt-8 bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-900/40 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Sign In</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
