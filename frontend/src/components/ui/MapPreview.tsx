'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function MapUpdater({ pickup, delivery }: { pickup?: [number, number], delivery?: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        if (pickup && delivery) {
            const bounds = L.latLngBounds([pickup, delivery]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (pickup) {
            map.setView(pickup, 10);
        } else if (delivery) {
            map.setView(delivery, 10);
        }
    }, [pickup, delivery, map]);

    return null;
}

interface MapPreviewProps {
    pickup?: [number, number] | null;
    delivery?: [number, number] | null;
    routeCoordinates?: [number, number][] | null;
}

export default function MapPreview({ pickup, delivery, routeCoordinates }: MapPreviewProps) {
    // Default center (Europe roughly)
    const center: [number, number] = [48.8566, 2.3522];

    // Fix for default marker icons in Leaflet with Next.js
    useEffect(() => {
        const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
        const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
        const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

        const DefaultIcon = L.icon({
            iconUrl,
            iconRetinaUrl,
            shadowUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // @ts-ignore
        delete L.Marker.prototype._getIconUrl;
        L.Marker.prototype.options.icon = DefaultIcon;
    }, []);

    // Unique key to force re-render if component is remounted (fixes AnimatePresence issues)
    // We use a key based on coordinates to ensure fresh map instance when data changes significantly
    const mapKey = `map-${pickup?.[0] || '0'}-${pickup?.[1] || '0'}-${delivery?.[0] || '0'}-${delivery?.[1] || '0'}`;

    return (
        <MapContainer
            key={mapKey}
            center={center}
            zoom={4}
            scrollWheelZoom={false}
            className="h-full w-full rounded-2xl z-0"
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {pickup && (
                <Marker position={pickup}>
                    <Popup>Pickup Location</Popup>
                </Marker>
            )}

            {delivery && (
                <Marker position={delivery}>
                    <Popup>Delivery Location</Popup>
                </Marker>
            )}

            {/* Custom Road Route (from OSRM) */}
            {routeCoordinates && (
                <Polyline
                    positions={routeCoordinates}
                    color="#3B82F6"
                    weight={5}
                    opacity={0.8}
                />
            )}

            {/* Fallback Straight Line (if no route data yet but points exist) */}
            {pickup && delivery && !routeCoordinates && (
                <Polyline
                    positions={[pickup, delivery]}
                    color="#94a3b8" // Slate-400 (Gray)
                    weight={3}
                    dashArray="10, 10" // Dashed line for "calculating" or "direct"
                    opacity={0.6}
                />
            )}

            <MapUpdater pickup={pickup || undefined} delivery={delivery || undefined} />
        </MapContainer>
    );
}
