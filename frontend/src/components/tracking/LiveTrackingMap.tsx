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

// Status labels and colors
const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    'ASSIGNED': { label: 'Assigned', color: '#6366f1', icon: '📋' },
    'DRIVER_AT_PICKUP': { label: 'At Pickup Location', color: '#f59e0b', icon: '📍' },
    'LOADING_STARTED': { label: 'Loading in Progress', color: '#f97316', icon: '📦' },
    'LOADING_FINISHED': { label: 'Loading Complete', color: '#10b981', icon: '✅' },
    'IN_TRANSIT': { label: 'In Transit', color: '#3b82f6', icon: '🚛' },
    'ARRIVED_DELIVERY': { label: 'Arrived at Delivery', color: '#8b5cf6', icon: '🏁' },
    'UNLOADING_FINISHED': { label: 'Unloading Complete', color: '#22c55e', icon: '📤' },
    'DELIVERED': { label: 'Delivered', color: '#16a34a', icon: '🎉' },
};

function getTruckIcon(color: string, isMoving: boolean = false) {
    // Modern 3D truck icon with drop shadow and gradient
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
            <defs>
                <linearGradient id="truckBody_${color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${color}CC;stop-opacity:1" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
                </filter>
            </defs>
            
            <!-- Drop shadow circle -->
            <ellipse cx="32" cy="56" rx="20" ry="5" fill="rgba(0,0,0,0.15)"/>
            
            <!-- Truck body (cargo area) -->
            <rect x="6" y="18" width="30" height="24" rx="3" fill="url(#truckBody_${color.replace('#', '')})" filter="url(#shadow)"/>
            
            <!-- Cargo area shine -->
            <rect x="8" y="20" width="26" height="6" rx="2" fill="rgba(255,255,255,0.2)"/>
            
            <!-- Cabin -->
            <rect x="36" y="24" width="16" height="18" rx="3" fill="url(#truckBody_${color.replace('#', '')})" filter="url(#shadow)"/>
            
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
    const { socket, isConnected } = useSocket();
    const [carrierLocations, setCarrierLocations] = useState<Record<string, CarrierLocation>>({});
    const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
    const [selectedShipmentId, setSelectedShipmentId] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter shipments based on selection
    const filteredShipments = selectedShipmentId === 'all'
        ? shipments
        : shipments.filter(s => s.id === selectedShipmentId);

    // Join tracking rooms for ALL shipments
    useEffect(() => {
        if (socket && isConnected && shipments.length > 0) {
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
    }, [socket, isConnected, shipments]);

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
                <div className="glass-panel p-4 rounded-xl relative z-[2000]">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Search & View Shipments</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-10 py-2.5 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all text-gray-900 placeholder-gray-500"
                            placeholder="Search by ID, City..."
                            value={searchQuery}
                            onFocus={() => setIsDropdownOpen(true)}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                        />
                        {/* Close button if open */}
                        {isDropdownOpen && (
                            <button
                                onClick={() => setIsDropdownOpen(false)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Only show list if there is a query or if user focuses (but for now let's just show results if query exists or maybe distinct list behavior) 
                        Actually, replace the dropdown logic. 
                        If we want a selector behavior:
                        1. Show selected item or placeholder.
                        2. On click, show search input + list.
                        
                        Or simpler: Just a search box that filters the map? 
                        User said: "pop up selectro of shipment the search". 
                        
                        Let's support both search filtering AND selection.
                        
                        Let's make a custom dropdown.
                    */}
                    {/* Dropdown List */}
                    {isDropdownOpen && (
                        <div className="mt-2 text-left bg-white shadow-xl max-h-60 overflow-y-auto border border-gray-100 rounded-lg absolute w-full left-0 z-50">
                            <div
                                className={`p-3 hover:bg-gray-50 cursor-pointer text-sm ${selectedShipmentId === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                onClick={() => {
                                    setSelectedShipmentId('all');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                All Shipments
                            </div>
                            {shipments
                                .filter(s =>
                                    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    s.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    s.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(s => (
                                    <div
                                        key={s.id}
                                        className={`p-3 hover:bg-gray-50 cursor-pointer text-sm border-t border-gray-50 ${selectedShipmentId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                        onClick={() => {
                                            setSelectedShipmentId(s.id);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <span className="font-semibold">{s.id.split('-')[0]}</span>: {s.pickup_address} → {s.delivery_address}
                                    </div>
                                ))}
                            {shipments.filter(s => s.id.toLowerCase().includes(searchQuery.toLowerCase()) || s.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) || s.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                <div className="p-3 text-sm text-gray-500 text-center">No shipments found</div>
                            )}
                        </div>
                    )}
                    {/* Mobile optimized simple select fallback or better mobile UI? 
                        The previous select was fine for mobile but didn't support search. 
                        Let's keep the custom UI for now, it's responsive enough.
                    */}
                </div>
            )}



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
                                        <small>Shipment {shipment.id.split('-')[0]}</small>
                                    </Popup>
                                </Marker>

                                {/* Delivery marker */}
                                <Marker position={[shipment.delivery_lat, shipment.delivery_lng]}>
                                    <Popup>
                                        <strong style={{ color }}>Delivery</strong><br />
                                        {shipment.delivery_address}<br />
                                        <small>Shipment {shipment.id.split('-')[0]}</small>
                                    </Popup>
                                </Marker>

                                {/* Carrier location (truck) */}
                                {carrierLoc && (() => {
                                    const statusInfo = STATUS_LABELS[shipment.status] || { label: shipment.status, color: '#6b7280', icon: '📦' };
                                    const isMoving = carrierLoc.speed && carrierLoc.speed > 1;
                                    const timeAgo = Math.floor((Date.now() - carrierLoc.timestamp) / 1000);
                                    const timeAgoStr = timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;

                                    return (
                                        <Marker
                                            position={[carrierLoc.latitude, carrierLoc.longitude]}
                                            icon={getTruckIcon(color, Boolean(isMoving))}
                                        >
                                            <Popup className="carrier-popup-modern">
                                                <div style={{
                                                    minWidth: '280px',
                                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                                    margin: '-13px -20px -13px -20px',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden'
                                                }}>
                                                    {/* Header with gradient */}
                                                    <div style={{
                                                        background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
                                                        padding: '16px',
                                                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                background: color,
                                                                borderRadius: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '18px',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                            }}>
                                                                🚚
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1f2937' }}>
                                                                    Carrier #{shipment.id.split('-')[0]}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                                                    {isMoving ? '● Moving' : '○ Stationary'} • Updated {timeAgoStr}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div style={{ padding: '12px 16px', background: 'white' }}>
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 14px',
                                                            background: `${statusInfo.color}15`,
                                                            border: `1px solid ${statusInfo.color}30`,
                                                            borderRadius: '20px',
                                                            width: '100%',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
                                                            <span style={{
                                                                fontWeight: '600',
                                                                fontSize: '13px',
                                                                color: statusInfo.color,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                {statusInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Route Info */}
                                                    <div style={{ padding: '0 16px 14px', background: 'white' }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '12px',
                                                            color: '#4b5563'
                                                        }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                                                                <div style={{ width: '1px', height: '16px', background: '#d1d5db' }} />
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                                                                    {shipment.pickup_address}
                                                                </div>
                                                                <div style={{ fontWeight: '500', color: '#374151' }}>
                                                                    {shipment.delivery_address}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Speed indicator */}
                                                    {carrierLoc.speed !== undefined && (
                                                        <div style={{
                                                            padding: '10px 16px',
                                                            background: '#f9fafb',
                                                            borderTop: '1px solid #f3f4f6',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '14px' }}>⚡</span>
                                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Current Speed</span>
                                                            </div>
                                                            <div style={{
                                                                fontWeight: '700',
                                                                fontSize: '16px',
                                                                color: isMoving ? '#059669' : '#9ca3af'
                                                            }}>
                                                                {Math.round(carrierLoc.speed * 3.6)} km/h
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })()}
                            </div>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
