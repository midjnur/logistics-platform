import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

// Dynamic import for Map to avoid SSR issues
const MapPreview = dynamic(() => import('@/components/ui/MapPreview'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-blue-50/50 animate-pulse flex items-center justify-center text-blue-300">Loading Map...</div>
});

const geocodeAddress = async (address: string) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await response.json();
        if (data && data[0]) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
        }
    } catch (error) {
        console.error("Geocoding failed", error);
    }
    return null;
};

// Helper removed (OSRM used instead)

export default function RouteStep({ data, update }: { data: any, update: (d: any) => void }) {
    const t = useTranslations('Shipper');
    const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
    const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [calculating, setCalculating] = useState(false);

    const handleAddressBlur = useCallback(async (type: 'pickup' | 'delivery', value: string) => {
        if (!value) return;
        setCalculating(true);
        const coords = await geocodeAddress(value);
        if (coords) {
            if (type === 'pickup') {
                setPickupCoords(coords);
                // Optionally update lat/lng in parent data if needed
                update({ pickup_lat: coords[0], pickup_lng: coords[1] });
            } else {
                setDeliveryCoords(coords);
                update({ delivery_lat: coords[0], delivery_lng: coords[1] });
            }
        }
        setCalculating(false);
    }, [update]);

    // OSRM Route Fetching
    useEffect(() => {
        const fetchRouteData = async () => {
            if (!pickupCoords || !deliveryCoords) return;

            setCalculating(true);
            try {
                // OSRM requires lon,lat format
                const pLonLat = `${pickupCoords[1]},${pickupCoords[0]}`;
                const dLonLat = `${deliveryCoords[1]},${deliveryCoords[0]}`;

                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${pLonLat};${dLonLat}?overview=full&geometries=geojson`
                );

                const data = await response.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];

                    // OSRM returns distance in meters
                    const distKm = Math.round(route.distance / 1000);
                    setDistance(distKm);
                    update({ distance: distKm });

                    // OSRM returns geometry as [lon, lat], Leaflet needs [lat, lon]
                    const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                    setRouteCoordinates(coordinates);
                }
            } catch (error) {
                console.error("Failed to fetch route", error);
            } finally {
                setCalculating(false);
            }
        };

        fetchRouteData();
    }, [pickupCoords, deliveryCoords]);

    // Initial check (in case data came pre-filled)
    useEffect(() => {
        if (data.pickup_lat && data.pickup_lng) setPickupCoords([data.pickup_lat, data.pickup_lng]);
        if (data.delivery_lat && data.delivery_lng) setDeliveryCoords([data.delivery_lat, data.delivery_lng]);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-gray-800">The Journey</h2>
            <p className="text-gray-500 -mt-4 mb-8">Where is the cargo going?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pickup Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 font-semibold uppercase text-xs tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Pickup
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            value={data.pickup_address}
                            onChange={(e) => update({ pickup_address: e.target.value })}
                            onBlur={(e) => handleAddressBlur('pickup', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="City, Country (e.g. Paris, France)"
                        />
                    </div>
                    <div className="group">
                        <div className="flex justify-between">
                            <label className="block mb-2 font-medium text-gray-700">Date & Time</label>
                            <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-md h-fit">Min: +24h</span>
                        </div>
                        <input
                            type="datetime-local"
                            value={data.pickup_time ? data.pickup_time.slice(0, 16) : ''}
                            min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                            onChange={(e) => update({ pickup_time: new Date(e.target.value).toISOString() })}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                        />
                        <p className="text-xs text-gray-400 mt-1.5 ml-1">Must be at least 24 hours from now</p>
                    </div>
                </div>

                {/* Delivery Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-600 font-semibold uppercase text-xs tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Delivery
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            value={data.delivery_address}
                            onChange={(e) => update({ delivery_address: e.target.value })}
                            onBlur={(e) => handleAddressBlur('delivery', e.target.value)}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="City, Country (e.g. Berlin, Germany)"
                        />
                    </div>
                    <div className="group">
                        <label className="block mb-2 font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={data.delivery_time ? data.delivery_time.slice(0, 16) : ''}
                            min={data.pickup_time ? new Date(new Date(data.pickup_time).getTime() + 3600000).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                                // Basic validation: Delivery must be after pickup
                                const dTime = new Date(e.target.value);
                                const pTime = data.pickup_time ? new Date(data.pickup_time) : null;

                                if (pTime && dTime <= pTime) {
                                    alert('Delivery time must be after pickup time');
                                    return;
                                }
                                update({ delivery_time: dTime.toISOString() });
                            }}
                            className="w-full bg-gray-50/50 border-0 ring-1 ring-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!data.pickup_time}
                        />
                        {!data.pickup_time ? (
                            <p className="text-xs text-amber-500 mt-1.5 ml-1 font-medium">Please select a pickup time first</p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1.5 ml-1">Must be after pickup time</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Map & Distance */}
            <div className="mt-8 relative h-64 md:h-80 bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden shadow-inner group">
                {distance && (
                    <div className="absolute top-4 right-4 z-[9999] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50 flex items-center gap-2 animate-in slide-in-from-top-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Road Distance</p>
                            <p className="text-lg font-bold text-gray-900">{distance.toLocaleString()} km</p>
                        </div>
                    </div>
                )}

                {calculating && (
                    <div className="absolute inset-0 z-[10000] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Calculating Route...
                        </div>
                    </div>
                )}

                <MapPreview pickup={pickupCoords} delivery={deliveryCoords} routeCoordinates={routeCoordinates} />
            </div>
        </div>
    );
}
