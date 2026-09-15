import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MapTemplate = (pickup: [number, number], delivery: [number, number], route: [number, number][]) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false });
        
        // Add Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Custom Icons
        const pickupIcon = L.divIcon({
            html: '<div style="background-color: #22c55e; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
            className: 'custom-div-icon',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        
        const removeIcon = L.divIcon({
            html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
            className: 'custom-div-icon',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        // Add Markers
        L.marker([${pickup[0]}, ${pickup[1]}], {icon: pickupIcon}).addTo(map);
        L.marker([${delivery[0]}, ${delivery[1]}], {icon: removeIcon}).addTo(map);

        // Add Route
        const routeCoords = ${JSON.stringify(route)};
        if (routeCoords.length > 0) {
            const polyline = L.polyline(routeCoords, {color: '#3b82f6', weight: 4, opacity: 0.8}).addTo(map);
            map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
        } else {
             const group = new L.featureGroup([
                L.marker([${pickup[0]}, ${pickup[1]}]),
                L.marker([${delivery[0]}, ${delivery[1]}])
            ]);
            map.fitBounds(group.getBounds(), {padding: [50, 50]});
        }
    </script>
</body>
</html>
`;

interface ShipmentDetailsScreenProps {
    shipmentId: string;
    onBack: () => void;
}

export default function ShipmentDetailsScreen({ shipmentId, onBack }: ShipmentDetailsScreenProps) {
    // const { shipmentId } = route.params; // Removed in favor of prop
    const [shipment, setShipment] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const [processingOffer, setProcessingOffer] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Initial load
    useEffect(() => {
        loadData();
    }, [shipmentId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [shipmentRes, offersRes] = await Promise.all([
                api.get(`/shipments/${shipmentId}`),
                api.get(`/offers/shipment/${shipmentId}`).catch(() => ({ data: [] }))
            ]);
            setShipment(shipmentRes.data);
            setOffers(offersRes.data);

            if (shipmentRes.data.pickup_lat && shipmentRes.data.delivery_lat) {
                fetchRoute(shipmentRes.data);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load shipment details');
            onBack();
        } finally {
            setLoading(false);
        }
    };

    const fetchRoute = async (data: any) => {
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${data.pickup_lng},${data.pickup_lat};${data.delivery_lng},${data.delivery_lat}?overview=full&geometries=geojson`
            );
            const routeData = await response.json();
            if (routeData.code === 'Ok' && routeData.routes?.[0]) {
                const coords = routeData.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
                setRouteCoords(coords);
            }
        } catch (e) {
            // Ignore route error
        }
    };

    const handleAcceptOffer = async (offerId: string) => {
        Alert.alert(
            'Accept Offer',
            'Are you sure? This will reject all other offers.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    style: 'default',
                    onPress: async () => {
                        setProcessingOffer(offerId);
                        try {
                            await api.patch(`/offers/${offerId}/accept`);
                            // Reject others locally for UI update or reload
                            await loadData(); // Reload to see status change
                            Alert.alert('Success', 'Offer accepted! Shipment is now assigned.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to accept offer');
                        } finally {
                            setProcessingOffer(null);
                        }
                    }
                }
            ]
        );
    };

    const handleRejectOffer = async (offerId: string) => {
        Alert.alert(
            'Reject Offer',
            'Are you sure you want to reject this offer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingOffer(offerId);
                        try {
                            await api.patch(`/offers/${offerId}/reject`);
                            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'REJECTED' } : o));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject offer');
                        } finally {
                            setProcessingOffer(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <LoadingSpinner message="Loading details..." />;

    if (!shipment) return null;

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-100 flex-row items-center justify-between z-10">
                <TouchableOpacity onPress={onBack} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text className="font-bold text-lg text-gray-900">#{shipment.id.split('-')[0]}</Text>
                <View className="w-10" />
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Map Section */}
                <View className="h-64 bg-gray-200 w-full relative">
                    {shipment.pickup_lat && shipment.delivery_lat ? (
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: MapTemplate([shipment.pickup_lat, shipment.pickup_lng], [shipment.delivery_lat, shipment.delivery_lng], routeCoords) }}
                            style={{ flex: 1 }}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-gray-500">No map data available</Text>
                        </View>
                    )}
                    {/* Distance Badge */}
                    {shipment.distance && (
                        <View className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-md z-10">
                            <Text className="text-sm font-bold text-gray-800">≈ {shipment.distance.toLocaleString()} km</Text>
                        </View>
                    )}
                    {/* Gradient overlay for smooth transition */}
                    <View className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent" />
                </View>

                <View className="px-5 -mt-6">
                    {/* Route Info Cards */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
                        <View className="flex-row items-start relative">
                            {/* Line */}
                            <View className="absolute left-[11px] top-3 bottom-8 w-0.5 bg-gray-200" />

                            <View className="flex-1 mb-6">
                                <View className="flex-row items-center mb-1">
                                    <View className="w-6 h-6 rounded-full bg-green-100 border-2 border-white shadow-sm items-center justify-center mr-3 z-10">
                                        <View className="w-2 h-2 rounded-full bg-green-500" />
                                    </View>
                                    <Text className="text-xs font-bold text-gray-400 uppercase">Pickup</Text>
                                </View>
                                <View className="pl-9">
                                    <Text className="font-bold text-gray-900 text-base">{shipment.pickup_address}</Text>
                                    <Text className="text-gray-500 text-xs mt-1">{new Date(shipment.pickup_time).toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                        <View className="flex-row items-start">
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <View className="w-6 h-6 rounded-full bg-red-100 border-2 border-white shadow-sm items-center justify-center mr-3 z-10">
                                        <View className="w-2 h-2 rounded-full bg-red-500" />
                                    </View>
                                    <Text className="text-xs font-bold text-gray-400 uppercase">Delivery</Text>
                                </View>
                                <View className="pl-9">
                                    <Text className="font-bold text-gray-900 text-base">{shipment.delivery_address}</Text>
                                    <Text className="text-gray-500 text-xs mt-1">{new Date(shipment.delivery_time).toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Offers Section */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-gray-900">Offers</Text>
                            <View className="bg-gray-900 px-2 py-0.5 rounded-full">
                                <Text className="text-white text-xs font-bold">{offers.length}</Text>
                            </View>
                        </View>

                        {offers.length === 0 ? (
                            <View className="bg-white p-8 rounded-2xl border border-gray-100 items-center justify-center border-dashed">
                                <Text className="text-gray-400 font-medium">No offers received yet.</Text>
                            </View>
                        ) : (
                            offers.map((offer) => (
                                <View key={offer.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-3">
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View>
                                            <Text className="text-2xl font-bold text-gray-900">€{offer.offered_price}</Text>
                                            <Text className="text-xs text-gray-500 mt-0.5">Carrier #{offer.carrier_id.substring(0, 5)}</Text>
                                        </View>
                                        <View className={`px-2 py-1 rounded ${offer.status === 'ACCEPTED' ? 'bg-green-100' :
                                            offer.status === 'REJECTED' ? 'bg-gray-100' : 'bg-blue-100'
                                            }`}>
                                            <Text className={`text-xs font-bold ${offer.status === 'ACCEPTED' ? 'text-green-700' :
                                                offer.status === 'REJECTED' ? 'text-gray-500' : 'text-blue-700'
                                                }`}>{offer.status}</Text>
                                        </View>
                                    </View>

                                    {offer.message && (
                                        <View className="bg-gray-50 p-3 rounded-lg mb-4">
                                            <Text className="text-gray-600 italic text-sm">"{offer.message}"</Text>
                                        </View>
                                    )}

                                    {offer.status === 'PENDING' && (
                                        <View className="flex-row gap-3">
                                            <TouchableOpacity
                                                onPress={() => handleRejectOffer(offer.id)}
                                                disabled={!!processingOffer}
                                                className="flex-1 py-3 bg-gray-100 rounded-xl items-center active:bg-gray-200"
                                            >
                                                <Text className="font-bold text-gray-600">Reject</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleAcceptOffer(offer.id)}
                                                disabled={!!processingOffer}
                                                className="flex-1 py-3 bg-gray-900 rounded-xl items-center active:bg-gray-800"
                                            >
                                                {processingOffer === offer.id ? (
                                                    <ActivityIndicator color="white" size="small" />
                                                ) : (
                                                    <Text className="font-bold text-white">Accept</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Cargo Specification */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="cube-outline" size={20} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase ml-2">Cargo Specification</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-4">
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-400 mb-1">Type</Text>
                                <Text className="font-bold text-gray-900">{shipment.cargo_type}</Text>
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-400 mb-1">HS Code</Text>
                                <Text className="font-bold text-gray-900">{shipment.hs_code || '123456'}</Text>
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-400 mb-1">Weight</Text>
                                <Text className="font-bold text-gray-900">{shipment.weight_kg} kg</Text>
                            </View>
                            <View className="w-[48%]">
                                <Text className="text-xs text-gray-400 mb-1">Volume</Text>
                                <Text className="font-bold text-gray-900">{shipment.cbm || '-'} m³</Text>
                            </View>
                        </View>
                    </View>

                    {/* Requirements */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase mb-3">Requirements</Text>
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="thermometer-outline" size={16} color="#6B7280" />
                            <Text className="text-gray-700">{shipment.temp_control ? 'Temperature Controlled' : 'Standard Temp'}</Text>
                        </View>
                    </View>

                    {/* Documents */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase mb-3">Documents</Text>
                        {shipment.export_declaration ? (
                            <View className="bg-gray-50 px-3 py-2 rounded-lg">
                                <Text className="text-gray-700 text-sm">Export Dec: {shipment.export_declaration}</Text>
                            </View>
                        ) : (
                            <View className="bg-gray-50 px-3 py-2 rounded-lg">
                                <Text className="text-gray-700 text-sm">Export Dec: Shipper</Text>
                            </View>
                        )}
                    </View>

                    {/* Financials */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                        <View className="flex-row items-center mb-4">
                            <Ionicons name="wallet-outline" size={20} color="#6B7280" />
                            <Text className="text-xs font-bold text-gray-500 uppercase ml-2">Financials</Text>
                        </View>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-xs text-gray-400 mb-1">Value</Text>
                                <Text className="font-bold text-gray-900">
                                    {shipment.value_of_goods ? `${shipment.value_of_goods.toLocaleString()} ${shipment.value_currency || 'EUR'}` : '5000.00 EUR'}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xs text-gray-400 mb-1">Terms of Payment</Text>
                                <Text className="font-bold text-gray-900">{shipment.payment_terms || '0 - 7 Days'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Consignee */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase mb-3">Consignee</Text>
                        <Text className="font-bold text-base text-gray-900">
                            {shipment.consignee_details?.company_name || 'Unknown Company'}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-1">
                            {shipment.consignee_details?.address || 'Str2'}
                        </Text>
                    </View>

                    {/* Shipment Log */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                        <Text className="text-xs font-bold text-gray-500 uppercase mb-4">Shipment Log</Text>

                        {(() => {
                            let timelineData = shipment.timeline;
                            if (typeof timelineData === 'string') {
                                try { timelineData = JSON.parse(timelineData); } catch (e) { }
                            }

                            if (timelineData && Array.isArray(timelineData) && timelineData.length > 0) {
                                return (
                                    <View>
                                        {timelineData.map((event: any, index: number) => {
                                            const date = new Date(event.timestamp);
                                            const timeStr = `${date.toLocaleDateString()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

                                            return (
                                                <View key={index} className="flex-row mb-4 last:mb-0">
                                                    <View className="items-center mr-4">
                                                        <View className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                                                        {index < timelineData.length - 1 && (
                                                            <View className="w-0.5 min-h-[30px] flex-1 bg-blue-100" />
                                                        )}
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="font-bold text-gray-900 text-sm">
                                                            {event.description || event.status}
                                                        </Text>
                                                        <Text className="text-gray-400 text-[10px] mt-0.5">
                                                            {timeStr}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            } else {
                                const createDate = new Date(shipment.created_at);
                                const createTimeStr = `${createDate.toLocaleDateString()} ${createDate.getHours()}:${createDate.getMinutes().toString().padStart(2, '0')}`;
                                return (
                                    <View className="flex-row items-start">
                                        <View className="w-3 h-3 rounded-full bg-blue-600 mr-4 mt-1 border-2 border-white shadow-sm" />
                                        <View>
                                            <Text className="font-bold text-gray-900 text-sm">Shipment created</Text>
                                            <Text className="text-gray-400 text-[10px] mt-0.5">{createTimeStr}</Text>
                                        </View>
                                    </View>
                                );
                            }
                        })()}
                    </View>

                    {/* Shipment Documents */}
                    <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <Text className="text-xs font-bold text-gray-500 uppercase mb-3">Shipment Documents</Text>
                        <View className="bg-gray-50 p-6 rounded-xl items-center border border-dashed border-gray-200">
                            <Ionicons name="document-outline" size={32} color="#9CA3AF" />
                            <Text className="text-gray-500 text-sm mt-2">No documents uploaded yet.</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
