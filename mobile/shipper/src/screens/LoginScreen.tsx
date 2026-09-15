import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const VIDEO_URL = 'https://vzmssuwhgoxdndzgjftm.supabase.co/storage/v1/object/sign/Auth_Page_Backgrounds/donkey_nocking.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hYmM3Yjg4Yy1iZTA0LTQwNGQtYTQ4Yy04OWU0NjY3Mjc3NTgiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJBdXRoX1BhZ2VfQmFja2dyb3VuZHMvZG9ua2V5X25vY2tpbmcubXA0IiwiaWF0IjoxNzY3MzAwNjMxLCJleHAiOjE5MjQ5ODA2MzF9._YlbkdWQ-X1aRB0yooDJlKPlST8ht0REc4GkAoIe2ac';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('shipper@test.com'); // Default for easier testing
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            console.log('Attempting login with:', email, 'at', api.defaults.baseURL);
            const response = await api.post('/auth/login', { email, password });

            console.log('Login success:', response.data);
            const { access_token } = response.data;

            if (access_token) {
                await login(access_token);
            } else {
                Alert.alert('Error', 'No access token received');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 'Connection failed. Check your API URL.';
            Alert.alert('Login Failed', Array.isArray(message) ? message.join(', ') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            {/* Video Background */}
            <Video
                source={{ uri: VIDEO_URL }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />

            <View className="absolute inset-0 bg-black/50" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-6"
            >
                <View className="items-center mb-10">
                    <Text className="text-white text-4xl font-extrabold tracking-tighter text-center">
                        Logistics Platform
                    </Text>
                    <Text className="text-gray-300 text-lg mt-2 font-medium">
                        Shipper Portal
                    </Text>
                </View>

                <View className="space-y-4 w-full">
                    <View>
                        <Text className="text-gray-300 mb-2 ml-1 font-medium">Email Address</Text>
                        <TextInput
                            className="bg-white/10 text-white px-4 py-4 rounded-xl border border-white/20 font-medium"
                            placeholder="name@company.com"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-gray-300 mb-2 ml-1 font-medium">Password</Text>
                        <TextInput
                            className="bg-white/10 text-white px-4 py-4 rounded-xl border border-white/20 font-medium"
                            placeholder="••••••••"
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        className={`mt-8 bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-900/40 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
