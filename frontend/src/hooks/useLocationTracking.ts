'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number | null;
    heading?: number | null;
}

export function useLocationTracking(shipmentId: string | null, enabled: boolean = false) {
    const { socket } = useSocket();
    const [isTracking, setIsTracking] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    const startTracking = useCallback(async () => {
        if (!shipmentId || !socket) {
            setError('Socket not connected or shipment ID missing');
            return;
        }

        // Request permission
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setHasPermission(false);
            return;
        }

        try {
            // Test permission first
            const testPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
            });

            setHasPermission(true);
            setError(null);

            // Start watching position
            const id = navigator.geolocation.watchPosition(
                (position) => {
                    const locationData: LocationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed,
                        heading: position.coords.heading,
                    };

                    // Emit location to backend
                    socket.emit('location-update', {
                        shipmentId,
                        ...locationData,
                        timestamp: Date.now(),
                    });

                    console.log('Location sent:', locationData);
                },
                (err) => {
                    console.error('Location error:', err);
                    setError(err.message);
                    setIsTracking(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                }
            );

            setWatchId(id);
            setIsTracking(true);
        } catch (err: any) {
            setHasPermission(false);
            setError(err.message || 'Failed to get location permission');
        }
    }, [shipmentId, socket]);

    const stopTracking = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsTracking(false);
    }, [watchId]);

    // Auto-start if enabled
    useEffect(() => {
        if (enabled && !isTracking && shipmentId) {
            startTracking();
        }
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [enabled, shipmentId]);

    return {
        isTracking,
        hasPermission,
        error,
        startTracking,
        stopTracking,
    };
}
