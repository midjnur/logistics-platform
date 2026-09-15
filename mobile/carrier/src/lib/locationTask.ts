import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from './api';

export const LOCATION_TASK_NAME = 'carrier-background-location';
const ACTIVE_SHIPMENT_KEY = 'active_shipment_id';
const TOKEN_KEY = 'access_token';

// Defined at module scope (not inside a component) so the OS can invoke it
// even when the app is backgrounded or the screen is locked. It has no
// access to React state, so it reads whatever it needs straight from
// SecureStore — TrackingContext keeps that in sync whenever the carrier's
// active shipment changes.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }
    if (!data) return;

    const { locations } = data as { locations: Location.LocationObject[] };
    const latest = locations?.[locations.length - 1];
    if (!latest) return;

    try {
        const [shipmentId, token] = await Promise.all([
            SecureStore.getItemAsync(ACTIVE_SHIPMENT_KEY),
            SecureStore.getItemAsync(TOKEN_KEY),
        ]);

        // Online but no active shipment yet — nothing to attach the point to.
        if (!shipmentId || !token) return;

        await axios.post(
            `${API_URL}/notifications/location/${shipmentId}`,
            {
                latitude: latest.coords.latitude,
                longitude: latest.coords.longitude,
                accuracy: latest.coords.accuracy ?? undefined,
                speed: latest.coords.speed ?? undefined,
                heading: latest.coords.heading ?? undefined,
                timestamp: latest.timestamp,
            },
            { headers: { Authorization: `Bearer ${token}` } },
        );
    } catch (err) {
        // Background task — nowhere to surface this to the user. It'll
        // simply try again on the next location sample.
        console.error('Failed to post background location:', err);
    }
});

export async function setActiveShipmentId(shipmentId: string | null) {
    if (shipmentId) {
        await SecureStore.setItemAsync(ACTIVE_SHIPMENT_KEY, shipmentId);
    } else {
        await SecureStore.deleteItemAsync(ACTIVE_SHIPMENT_KEY);
    }
}

export async function startBackgroundLocation() {
    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyStarted) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000, // ms between updates
        distanceInterval: 50, // meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: 'You’re online',
            notificationBody: 'Sharing your location so shippers can track their delivery.',
        },
        pausesUpdatesAutomatically: false,
    });
}

export async function stopBackgroundLocation() {
    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    await setActiveShipmentId(null);
}
