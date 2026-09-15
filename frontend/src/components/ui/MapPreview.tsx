'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';

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

interface CarrierLocation {
    latitude: number;
    longitude: number;
    timestamp: number;
    speed?: number;
    heading?: number;
}

interface MapPreviewProps {
    pickup?: [number, number] | null;
    delivery?: [number, number] | null;
    routeCoordinates?: [number, number][] | null;
    shipmentId?: string; // Add shipmentId to enable live tracking
    shipmentStatus?: string; // Add status for detailed popup
}

function getTruckIcon(isMoving: boolean = false) {
    const color = '#dc2626';
    // Modern 3D truck icon with drop shadow and gradient
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
            <defs>
                <linearGradient id="truckBodyPreview" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color}CC;stop-opacity:1" />
                </linearGradient>
                <filter id="shadowPreview" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
                </filter>
            </defs>
            
            <!-- Drop shadow circle -->
            <ellipse cx="32" cy="56" rx="20" ry="5" fill="rgba(0,0,0,0.15)"/>
            
            <!-- Truck body (cargo area) -->
            <rect x="6" y="18" width="30" height="24" rx="3" fill="url(#truckBodyPreview)" filter="url(#shadowPreview)"/>
            
            <!-- Cargo area shine -->
            <rect x="8" y="20" width="26" height="6" rx="2" fill="rgba(255,255,255,0.2)"/>
            
            <!-- Cabin -->
            <rect x="36" y="24" width="16" height="18" rx="3" fill="url(#truckBodyPreview)" filter="url(#shadowPreview)"/>
            
            <!-- Windshield -->
            <rect x="38" y="26" width="12" height="8" rx="2" fill="#1e3a5f"/>
            <rect x="39" y="27" width="10" height="6" rx="1" fill="#4a90d9"/>
            
            <!-- Windshield reflection -->
            <rect x="40" y="28" width="3" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
            
            <!-- Wheels -->
            <circle cx="16" cy="46" r="6" fill="#2d3748"/>
            <circle cx="16" cy="46" r="4" fill="#4a5568"/>
            <circle cx="16" cy="46" r="2" fill="#718096"/>
            
            <circle cx="44" cy="46" r="6" fill="#2d3748"/>
            <circle cx="44" cy="46" r="4" fill="#4a5568"/>
            <circle cx="44" cy="46" r="2" fill="#718096"/>
            
            <!-- Headlight -->
            <rect x="50" y="36" width="3" height="4" rx="1" fill="#fef3c7"/>
            
            <!-- GPS indicator (pulsing dot) -->
            ${isMoving ? `
            <circle cx="6" cy="18" r="4" fill="#22c55e">
                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
            </circle>
            ` : ''}
        </svg>
    `;

    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
    });
}

export default function MapPreview({ pickup, delivery, routeCoordinates, shipmentId }: MapPreviewProps) {
    const { socket, isConnected } = useSocket();
    const [carrierLocation, setCarrierLocation] = useState<CarrierLocation | null>(null);

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

    // WebSocket integration for live carrier tracking
    useEffect(() => {
        if (socket && isConnected && shipmentId) {
            // Join the tracking room for this shipment
            socket.emit('join-shipment-tracking', { shipmentId });

            // Listen for carrier location updates
            const handleLocation = (data: any) => {
                if (data.shipmentId === shipmentId) {
                    setCarrierLocation({
                        latitude: data.latitude,
                        longitude: data.longitude,
                        timestamp: data.timestamp,
                        speed: data.speed,
                        heading: data.heading,
                    });
                }
            };

            socket.on('carrier-location', handleLocation);

            return () => {
                socket.emit('leave-shipment-tracking', { shipmentId });
                socket.off('carrier-location', handleLocation);
            };
        }
    }, [socket, isConnected, shipmentId]);

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

            {/* Live Carrier Location (Truck Icon) */}
            {carrierLocation && (
                <Marker
                    position={[carrierLocation.latitude, carrierLocation.longitude]}
                    icon={getTruckIcon()}
                >
                    <Popup>
                        <strong>🚚 Carrier Location</strong><br />
                        {carrierLocation.speed && <span>Speed: {Math.round(carrierLocation.speed * 3.6)} km/h<br /></span>}
                        Last updated: {new Date(carrierLocation.timestamp).toLocaleTimeString()}
                    </Popup>
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
