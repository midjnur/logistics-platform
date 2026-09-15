import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import api from '../lib/api';
import { setActiveShipmentId, startBackgroundLocation, stopBackgroundLocation } from '../lib/locationTask';
import { useAuth } from './AuthContext';

// Shipment is "active" (carrier has it and must keep tracking) once it's
// been picked up, through to delivery. OPEN/OFFERED aren't assigned yet;
// DELIVERED/CANCELLED are finished — neither locks the online toggle.
const ACTIVE_STATUSES = [
    'ASSIGNED',
    'DRIVER_AT_PICKUP',
    'LOADING_STARTED',
    'LOADING_FINISHED',
    'IN_TRANSIT',
    'ARRIVED_DELIVERY',
    'UNLOADING_FINISHED',
];

const IS_ONLINE_KEY = 'is_online';
const POLL_INTERVAL_MS = 20000;

export interface Shipment {
    id: string;
    status: string;
    pickup_address: string;
    delivery_address: string;
    cargo_type: string;
    weight_kg: number;
    price?: number;
    pickup_time?: string;
    delivery_time?: string;
}

type TrackingContextType = {
    isOnline: boolean;
    activeShipment: Shipment | null;
    canGoOffline: boolean;
    permissionError: string | null;
    goingOnline: boolean;
    goOnline: () => Promise<boolean>;
    goOffline: () => Promise<boolean>;
    refreshActiveShipment: () => Promise<void>;
};

const TrackingContext = createContext<TrackingContextType>({} as TrackingContextType);

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
    const { userToken } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [activeShipment, setActiveShipmentState] = useState<Shipment | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [goingOnline, setGoingOnline] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const applyActiveShipment = useCallback(async (shipment: Shipment | null) => {
        setActiveShipmentState(shipment);
        await setActiveShipmentId(shipment?.id ?? null);
    }, []);

    const refreshActiveShipment = useCallback(async () => {
        try {
            const { data } = await api.get<Shipment[]>('/shipments/my-shipments');
            const active = data.find((s) => ACTIVE_STATUSES.includes(s.status)) ?? null;
            await applyActiveShipment(active);
        } catch (err) {
            console.error('Failed to refresh active shipment', err);
        }
    }, [applyActiveShipment]);

    // Restore persisted online state + start polling once logged in.
    useEffect(() => {
        if (!userToken) {
            if (pollRef.current) clearInterval(pollRef.current);
            return;
        }

        (async () => {
            const stored = await SecureStore.getItemAsync(IS_ONLINE_KEY);
            if (stored === 'true') {
                setIsOnline(true);
                await startBackgroundLocation();
            }
            await refreshActiveShipment();
        })();

        pollRef.current = setInterval(refreshActiveShipment, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [userToken, refreshActiveShipment]);

    const goOnline = useCallback(async (): Promise<boolean> => {
        setGoingOnline(true);
        setPermissionError(null);
        try {
            const fg = await Location.requestForegroundPermissionsAsync();
            if (fg.status !== 'granted') {
                setPermissionError('Location permission is required to go online.');
                return false;
            }
            const bg = await Location.requestBackgroundPermissionsAsync();
            if (bg.status !== 'granted') {
                setPermissionError(
                    'Background location permission is required so tracking keeps running while the app is minimized. Enable "Always Allow" in Settings.',
                );
                return false;
            }

            await startBackgroundLocation();
            await SecureStore.setItemAsync(IS_ONLINE_KEY, 'true');
            setIsOnline(true);
            return true;
        } catch (err) {
            console.error('Failed to go online', err);
            setPermissionError('Something went wrong starting location tracking.');
            return false;
        } finally {
            setGoingOnline(false);
        }
    }, []);

    const goOffline = useCallback(async (): Promise<boolean> => {
        if (activeShipment) {
            setPermissionError(
                `You can't go offline while shipment #${activeShipment.id.slice(0, 8)} is in progress. Complete the delivery first.`,
            );
            return false;
        }
        await stopBackgroundLocation();
        await SecureStore.setItemAsync(IS_ONLINE_KEY, 'false');
        setIsOnline(false);
        return true;
    }, [activeShipment]);

    return (
        <TrackingContext.Provider
            value={{
                isOnline,
                activeShipment,
                canGoOffline: !activeShipment,
                permissionError,
                goingOnline,
                goOnline,
                goOffline,
                refreshActiveShipment,
            }}
        >
            {children}
        </TrackingContext.Provider>
    );
};

export const useTracking = () => useContext(TrackingContext);
