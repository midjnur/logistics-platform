import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your computer's local IP address
// Make sure your phone is on the same Wi-Fi network
const API_URL = 'https://68c7a6916e8e17f0-80-187-113-220.serveousercontent.com';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true', // Required for localtunnel
    },
});

// Add a request interceptor to attach the Token
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status !== 401) {
            console.error('API Error:', {
                message: error.message,
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
            });
        }
        return Promise.reject(error);
    }
);

export default api;
