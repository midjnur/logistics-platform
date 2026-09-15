import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

type AuthContextType = {
    userToken: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on startup
        const bootstrapAsync = async () => {
            let token;
            try {
                token = await SecureStore.getItemAsync('access_token');
            } catch (e) {
                console.error('Restoring token failed');
            }
            setUserToken(token || null);
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    const login = async (token: string) => {
        try {
            await SecureStore.setItemAsync('access_token', token);
            setUserToken(token);
        } catch (e) {
            Alert.alert('Login Error', 'Could not save login info');
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('access_token');
            setUserToken(null);
        } catch (e) {
            console.error('Logout failed');
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
