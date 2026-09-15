import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Your computer's LAN IP — update this if your network changes (check with
// `ipconfig getifaddr en0` on Mac). Your phone must be on the same Wi-Fi/hotspot.
export const API_URL = 'http://172.20.10.8:4000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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
