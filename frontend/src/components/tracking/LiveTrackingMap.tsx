'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

interface Shipment {
    id: string;
    pickup_address: string;
    delivery_address: string;
    pickup_lat: number;
    pickup_lng: number;
    delivery_lat: number;
    delivery_lng: number;
    status: string;
}

interface CarrierLocation {
    latitude: number;
    longitude: number;
    timestamp: number;
    speed?: number;
    heading?: number;
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2'];

function getTruckIcon(color: string) {
    return L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h3l2 3v5h-21v-2" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        `),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
}

function MapBoundsUpdater({ shipments }: { shipments: Shipment[] }) {
    const map = useMap();

    useEffect(() => {
        if (shipments.length > 0) {
            const bounds = L.latLngBounds(
                shipments.flatMap(s => [
                    [s.pickup_lat, s.pickup_lng],
                    [s.delivery_lat, s.delivery_lng]
                ])
            );
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [shipments, map]);

    return null;
}

export default function LiveTrackingMap({ shipments }: { shipments: Shipment[] }) {
    const { socket } = useSocket();
    const [carrierLocations, setCarrierLocations] = useState<Record<string, CarrierLocation>>({});
    const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
    const [selectedShipmentId, setSelectedShipmentId] = useState<string | 'all'>('all');

    // Filter shipments based on selection
    const filteredShipments = selectedShipmentId === 'all'
        ? shipments
        : shipments.filter(s => s.id === selectedShipmentId);

    // Join tracking rooms for ALL shipments
    useEffect(() => {
        if (socket && shipments.length > 0) {
            // Join all rooms
            shipments.forEach(shipment => {
                socket.emit('join-shipment-tracking', { shipmentId: shipment.id });
            });

            // Listen for location updates from any shipment
            const handleLocation = (data: any) => {
                setCarrierLocations(prev => ({
                    ...prev,
                    [data.shipmentId]: {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        timestamp: data.timestamp,
                        speed: data.speed,
                        heading: data.heading,
                    }
                }));
            };

            socket.on('carrier-location', handleLocation);

            return () => {
                shipments.forEach(shipment => {
                    socket.emit('leave-shipment-tracking', { shipmentId: shipment.id });
                });
                socket.off('carrier-location', handleLocation);
            };
        }
    }, [socket, shipments]);

    // Fetch routes for all shipments
    useEffect(() => {
        shipments.forEach(async (shipment) => {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${shipment.pickup_lng},${shipment.pickup_lat};${shipment.delivery_lng},${shipment.delivery_lat}?overview=full&geometries=geojson`
                );
                const data = await response.json();
                if (data.code === 'Ok' && data.routes?.[0]) {
                    setRoutes(prev => ({
                        ...prev,
                        [shipment.id]: data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]])
                    }));
                }
            } catch (e) {
                console.error('Failed to fetch route for', shipment.id, e);
            }
        });
    }, [shipments]);

    if (shipments.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 glass-panel rounded-2xl">
                <p className="text-gray-500">No active shipments to track</p>
            </div>
        );
    }

    const center: [number, number] = [
        filteredShipments.reduce((sum, s) => sum + (s.pickup_lat + s.delivery_lat) / 2, 0) / filteredShipments.length,
        filteredShipments.reduce((sum, s) => sum + (s.pickup_lng + s.delivery_lng) / 2, 0) / filteredShipments.length,
    ];

    return (
        <div className="space-y-4">
            {/* Filter dropdown */}
            {shipments.length > 1 && (
                <div className="glass-panel p-4 rounded-xl">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">View Shipments</label>
                    <select
                        value={selectedShipmentId}
                        onChange={(e) => setSelectedShipmentId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Shipments ({shipments.length})</option>
                        {shipments.map((s, idx) => (
                            <option key={s.id} value={s.id}>
                                Shipment {idx + 1}: {s.pickup_address} → {s.delivery_address}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Status indicators for all shipments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShipments.map((shipment, index) => {
                    const color = COLORS[index % COLORS.length];
                    const hasLocation = !!carrierLocations[shipment.id];

                    return (
                        <div key={shipment.id} className="glass-panel p-4 rounded-xl border-l-4" style={{ borderLeftColor: color }}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {shipment.pickup_address}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        → {shipment.delivery_address}
                                    </p>
                                </div>
                                {hasLocation ? (
                                    <div className="flex items-center gap-1 text-green-600 ml-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-medium">Live</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-gray-400 ml-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                        <span className="text-xs">Waiting</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-600">
                                Status: <span className="font-medium">{shipment.status}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Map with all shipments */}
            <div className="glass-panel rounded-2xl overflow-hidden h-[600px]">
                <MapContainer
                    center={center}
                    zoom={8}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    <MapBoundsUpdater shipments={filteredShipments} />

                    {/* Render all shipments */}
                    {filteredShipments.map((shipment, index) => {
                        const color = COLORS[index % COLORS.length];
                        const route = routes[shipment.id];
                        const carrierLoc = carrierLocations[shipment.id];

                        return (
                            <div key={shipment.id}>
                                {/* Route line */}
                                {route && (
                                    <Polyline positions={route} color={color} weight={4} opacity={0.6} />
                                )}

                                {/* Pickup marker */}
                                <Marker position={[shipment.pickup_lat, shipment.pickup_lng]}>
                                    <Popup>
                                        <strong style={{ color }}>Pickup</strong><br />
                                        {shipment.pickup_address}<br />
                                        <small>Shipment {index + 1}</small>
                                    </Popup>
                                </Marker>

                                {/* Delivery marker */}
                                <Marker position={[shipment.delivery_lat, shipment.delivery_lng]}>
                                    <Popup>
                                        <strong style={{ color }}>Delivery</strong><br />
                                        {shipment.delivery_address}<br />
                                        <small>Shipment {index + 1}</small>
                                    </Popup>
                                </Marker>

                                {/* Carrier location (truck) */}
                                {carrierLoc && (
                                    <Marker
                                        position={[carrierLoc.latitude, carrierLoc.longitude]}
                                        icon={getTruckIcon(color)}
                                    >
                                        <Popup>
                                            <strong style={{ color }}>🚚 Carrier (Shipment {index + 1})</strong><br />
                                            {shipment.pickup_address} → {shipment.delivery_address}<br />
                                            {carrierLoc.speed && <span>Speed: {Math.round(carrierLoc.speed * 3.6)} km/h<br /></span>}
                                            Last updated: {new Date(carrierLoc.timestamp).toLocaleTimeString()}
                                        </Popup>
                                    </Marker>
                                )}
                            </div>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
