import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import api from '../lib/api';

type CarrierUser = {
    id: string;
    email: string;
    role: string;
    carrier?: {
        first_name: string;
        last_name: string;
        verification_status: string;
    };
};

type AuthContextType = {
    userToken: string | null;
    user: CarrierUser | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userToken, setUserToken] = useState<string | null>(null);
    const [user, setUser] = useState<CarrierUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data);
        } catch (e) {
            console.error('Failed to load profile', e);
        }
    };

    useEffect(() => {
        const bootstrapAsync = async () => {
            let token;
            try {
                token = await SecureStore.getItemAsync('access_token');
            } catch (e) {
                console.error('Restoring token failed');
            }
            setUserToken(token || null);
            if (token) await refreshUser();
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const login = async (token: string) => {
        try {
            await SecureStore.setItemAsync('access_token', token);
            setUserToken(token);
            await refreshUser();
        } catch (e) {
            Alert.alert('Login Error', 'Could not save login info');
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('access_token');
            setUserToken(null);
            setUser(null);
        } catch (e) {
            console.error('Logout failed');
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, user, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
