import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Switch, Platform, Modal, KeyboardAvoidingView, InputAccessoryView, Keyboard, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreateShipmentScreenProps {
    onNavigate: (screen: string) => void;
}

// Map HTML logic (Leaflet)
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .leaflet-control-container .leaflet-routing-container-hide { display: none; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {zoomControl: false}).setView([41.7151, 44.8271], 7); // Default to Georgia
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        var pickupMarker, deliveryMarker, routeLine;
        var pickupIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#16A34A; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);'></div>",
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        
        var deliveryIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#DC2626; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);'></div>",
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        window.updateMap = function(dataStr) {
            try {
                var data = JSON.parse(dataStr);
                
                if (pickupMarker) map.removeLayer(pickupMarker);
                if (deliveryMarker) map.removeLayer(deliveryMarker);
                if (routeLine) map.removeLayer(routeLine);
                
                var bounds = [];
                
                if (data.pickup) {
                    pickupMarker = L.marker(data.pickup, {icon: pickupIcon}).addTo(map);
                    bounds.push(data.pickup);
                }
                if (data.delivery) {
                    deliveryMarker = L.marker(data.delivery, {icon: deliveryIcon}).addTo(map);
                    bounds.push(data.delivery);
                }
                if (data.route) {
                    routeLine = L.polyline(data.route, {color: '#3B82F6', weight: 4, opacity: 0.7}).addTo(map);
                    map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});
                } else if (bounds.length > 0) {
                    map.fitBounds(L.latLngBounds(bounds), {padding: [50, 50], maxZoom: 13});
                }
            } catch(e) {
                // console.log(e);
            }
        }
    </script>
</body>
</html>
`;

export default function CreateShipmentScreen({ onNavigate }: CreateShipmentScreenProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const webViewRef = useRef<WebView>(null);

    // Map & Geocoding State
    const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
    const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
    const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Journey
        pickup_address: '',
        delivery_address: '',
        pickup_date: new Date(),
        delivery_date: new Date(Date.now() + 86400000 * 2),
        // Step 2: Cargo
        commodity_type: '',
        hs_code: '',
        weight: '',
        volume: '',
        dims_length: '',
        dims_width: '',
        dims_height: '',
        description: '',
        // Step 3: Requirements
        temp_control: false,
        loading_type: 'Standard',
        need_tir: false,
        need_cmr: false,
        need_waybill: false,
        export_declaration: 'None',
        // Step 4: Details
        price: '',
        currency: 'EUR',
        shipper_company: '',
        shipper_address: '',
        consignee_company: '',
        consignee_address: '',
        cargo_value: '',
        payment_terms: 'Upon Arrival'
    });

    // Date Picker State
    const [iosModalVisible, setIosModalVisible] = useState(false);
    const [activeDateMode, setActiveDateMode] = useState<'pickup' | 'delivery'>('pickup');
    const [tempDate, setTempDate] = useState(new Date());
    const [showAndroidPicker, setShowAndroidPicker] = useState(false);

    // Dropdown State
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
    const [termsModalVisible, setTermsModalVisible] = useState(false);
    const currencyOptions = ['EUR', 'USD', 'GBP', 'PLN', 'TRY'];
    const termsOptions = ['Upon Arrival', '0 - 7 Days', '8 - 14 Days', '15 - 30 Days', '30 - 60 Days'];

    // Refs for Next Focus
    const lengthRef = useRef<TextInput>(null);
    const widthRef = useRef<TextInput>(null);
    const heightRef = useRef<TextInput>(null);

    const updateForm = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Auto-calculate volume
    useEffect(() => {
        const l = parseFloat(formData.dims_length);
        const w = parseFloat(formData.dims_width);
        const h = parseFloat(formData.dims_height);

        if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
            const vol = (l * w * h) / 1000000;
            setFormData(prev => {
                const newVol = vol.toFixed(3);
                if (prev.volume !== newVol) return { ...prev, volume: newVol };
                return prev;
            });
        }
    }, [formData.dims_length, formData.dims_width, formData.dims_height]);

    // Geocoding Logic (SMART PROXIMITY)
    const geocodeAddress = async (address: string, type: 'pickup' | 'delivery') => {
        if (!address || address.length < 3) return;
        setCalculating(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`, {
                headers: { 'User-Agent': 'LogisticsApp/1.0' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                let bestMatch = data[0];

                // Smart selection: if other point exists, pick closest result
                const otherCoords = type === 'pickup' ? deliveryCoords : pickupCoords;
                if (otherCoords) {
                    let minDist = Infinity;
                    for (const item of data) {
                        const lat = parseFloat(item.lat);
                        const lon = parseFloat(item.lon);
                        const dist = Math.sqrt(Math.pow(lat - otherCoords[0], 2) + Math.pow(lon - otherCoords[1], 2));
                        if (dist < minDist) {
                            minDist = dist;
                            bestMatch = item;
                        }
                    }
                }

                const lat = parseFloat(bestMatch.lat);
                const lon = parseFloat(bestMatch.lon);
                if (type === 'pickup') setPickupCoords([lat, lon]);
                else setDeliveryCoords([lat, lon]);
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        } finally {
            setCalculating(false);
        }
    };

    // Routing Logic
    useEffect(() => {
        const fetchRoute = async () => {
            if (!pickupCoords || !deliveryCoords) {
                updateMapDisplay();
                return;
            }
            setCalculating(true);
            try {
                const pLonLat = `${pickupCoords[1]},${pickupCoords[0]}`;
                const dLonLat = `${deliveryCoords[1]},${deliveryCoords[0]}`;
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${pLonLat};${dLonLat}?overview=full&geometries=geojson`);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const distKm = Math.round(route.distance / 1000);
                    setDistance(distKm);
                    const coordinates = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    setRouteCoords(coordinates);
                }
            } catch (error) {
                console.error("Routing failed", error);
            } finally {
                setCalculating(false);
            }
        };
        fetchRoute();
    }, [pickupCoords, deliveryCoords]);

    const updateMapDisplay = () => {
        if (!webViewRef.current) return;
        const data = { pickup: pickupCoords, delivery: deliveryCoords, route: routeCoords };
        webViewRef.current.injectJavaScript(`window.updateMap('${JSON.stringify(data)}'); true;`);
    };

    useEffect(() => { updateMapDisplay(); }, [pickupCoords, deliveryCoords, routeCoords]);

    // HANDLERS
    const handleDatePress = (mode: 'pickup' | 'delivery') => {
        setActiveDateMode(mode);
        setTempDate(mode === 'pickup' ? formData.pickup_date : formData.delivery_date);
        if (Platform.OS === 'ios') setIosModalVisible(true);
        else setShowAndroidPicker(true);
    };

    const handleAndroidDateChange = (event: any, selectedDate?: Date) => {
        setShowAndroidPicker(false);
        if (selectedDate) updateForm(activeDateMode === 'pickup' ? 'pickup_date' : 'delivery_date', selectedDate);
    };

    const saveIosDate = () => {
        updateForm(activeDateMode === 'pickup' ? 'pickup_date' : 'delivery_date', tempDate);
        setIosModalVisible(false);
    };

    const handleNext = () => {
        Keyboard.dismiss();
        if (step === 1 && (!formData.pickup_address || !formData.delivery_address)) { Alert.alert('Error', 'Please fill in addresses'); return; }
        if (step === 1 && formData.delivery_date < formData.pickup_date) { Alert.alert('Error', 'Delivery cannot be before pickup'); return; }
        if (step === 2 && (!formData.weight || !formData.commodity_type)) { Alert.alert('Error', 'Please fill in weight and commodity type'); return; }
        if (step === 3) setStep(4);
        else if (step < 3) setStep(step + 1);
    };

    const handleSubmit = async () => {
        // if (!formData.price) { Alert.alert('Error', 'Please enter a price'); return; }
        setLoading(true);
        try {
            await api.post('/shipments', {
                ...formData,
                pickup_date: formData.pickup_date.toISOString(),
                delivery_date: formData.delivery_date.toISOString(),
                weight_kg: parseFloat(formData.weight),
                price: formData.price ? parseFloat(formData.price) : 0,
                status: 'OPEN',
                distance: distance,
                // Coordinates
                pickup_lat: pickupCoords?.[0] || 0,
                pickup_lng: pickupCoords?.[1] || 0,
                delivery_lat: deliveryCoords?.[0] || 0,
                delivery_lng: deliveryCoords?.[1] || 0,
                // Mappings
                cargo_type: formData.commodity_type,
                value_of_goods: formData.cargo_value ? parseFloat(formData.cargo_value) : 0,
                value_currency: formData.currency,
                shipper_details: {
                    company_name: formData.shipper_company,
                    address: formData.shipper_address
                },
                consignee_details: {
                    company_name: formData.consignee_company,
                    address: formData.consignee_address
                }
            });
            Alert.alert('Success', 'Shipment published!', [{ text: 'OK', onPress: () => onNavigate('my-shipments') }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to create shipment');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { id: 1, label: 'Journey', icon: 'map' },
            { id: 2, label: 'Cargo', icon: 'cube' },
            { id: 3, label: 'Reqs', icon: 'document-text' },
            { id: 4, label: 'Details', icon: 'wallet' },
        ];
        return (
            <View className="flex-row justify-between px-4 mb-6">
                {steps.map((s, index) => {
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;
                    return (
                        <View key={s.id} className="items-center z-10 w-16">
                            <View className={`w-12 h-12 rounded-xl items-center justify-center mb-1 ${isActive || isCompleted ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}>
                                <Ionicons name={isCompleted ? 'checkmark' : s.icon as any} size={24} color={isActive || isCompleted ? 'white' : '#9CA3AF'} />
                            </View>
                            <Text className={`text-xs font-medium text-center ${isActive || isCompleted ? 'text-blue-600' : 'text-gray-400'}`}>{s.label}</Text>
                            {index < steps.length - 1 && (
                                <View className={`absolute top-6 left-10 w-full h-[2px] -z-10 ${step > s.id + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: '100%' }} />
                            )}
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white pt-12 pb-6 px-6 border-b border-gray-100 shadow-sm z-20">
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity onPress={() => onNavigate('overview')} className="p-2 -ml-2 rounded-full active:bg-gray-100">
                        <Ionicons name="close" size={28} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-center text-gray-900">Create Shipment</Text>
                    <View className="w-10" />
                </View>
                {renderStepIndicator()}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
                <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="always">
                    {/* STEP 1: JOURNEY */}
                    {step === 1 && (
                        <View className="space-y-6 pb-10">
                            <View>
                                <Text className="text-lg font-bold text-gray-900 mb-4">The Journey</Text>
                                <View className="flex-row gap-4 mb-6">
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                                            <Text className="text-xs font-bold text-green-600 uppercase">Pickup</Text>
                                        </View>
                                        <TextInput
                                            className="bg-white p-3 rounded-xl border border-gray-200 text-gray-900 font-medium h-12 mb-2"
                                            value={formData.pickup_address}
                                            placeholder="City..."
                                            onChangeText={(t) => updateForm('pickup_address', t)}
                                            onBlur={() => geocodeAddress(formData.pickup_address, 'pickup')}
                                            returnKeyType="done"
                                        />
                                        <TouchableOpacity onPress={() => handleDatePress('pickup')} className="bg-gray-100 p-3 rounded-xl h-12 justify-center">
                                            <Text className="text-gray-900 font-medium">{formData.pickup_date.toLocaleDateString()}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-2">
                                            <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                                            <Text className="text-xs font-bold text-red-600 uppercase">Delivery</Text>
                                        </View>
                                        <TextInput
                                            className="bg-white p-3 rounded-xl border border-gray-200 text-gray-900 font-medium h-12 mb-2"
                                            value={formData.delivery_address}
                                            placeholder="City..."
                                            onChangeText={(t) => updateForm('delivery_address', t)}
                                            onBlur={() => geocodeAddress(formData.delivery_address, 'delivery')}
                                            returnKeyType="done"
                                        />
                                        <TouchableOpacity onPress={() => handleDatePress('delivery')} className="bg-gray-100 p-3 rounded-xl h-12 justify-center">
                                            <Text className="text-gray-900 font-medium">{formData.delivery_date.toLocaleDateString()}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View className="h-64 bg-blue-50 rounded-2xl border border-blue-100 overflow-hidden relative shadow-sm">
                                    <WebView ref={webViewRef} originWhitelist={['*']} source={{ html: MAP_HTML }} style={{ flex: 1 }} scrollEnabled={false} />
                                    {distance && (
                                        <View className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-md z-10">
                                            <Text className="text-sm font-bold text-gray-800">{distance.toLocaleString()} km</Text>
                                        </View>
                                    )}
                                    {calculating && (
                                        <View className="absolute inset-0 bg-white/50 items-center justify-center z-20"><ActivityIndicator size="small" color="#2563EB" /></View>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* STEP 2: CARGO */}
                    {step === 2 && (
                        <View className="space-y-6 pb-10">
                            <View>
                                <Text className="text-xl font-bold text-gray-900">Cargo Details</Text>
                                <Text className="text-gray-500 mt-1">What are you shipping?</Text>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-700 mb-2 h-10 leading-5" numberOfLines={2}>Commodity Type</Text>
                                    <TextInput className="bg-gray-50 px-4 rounded-xl border border-gray-100 text-gray-900 h-14" placeholder="e.g. Electronics" value={formData.commodity_type} onChangeText={(t) => updateForm('commodity_type', t)} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-700 mb-2 h-10 leading-5" numberOfLines={2}>HS / Customs Tariff Code</Text>
                                    <TextInput className="bg-gray-50 px-4 rounded-xl border border-gray-100 text-gray-900 h-14" placeholder="e.g. 1234.56.78" value={formData.hs_code} onChangeText={(t) => updateForm('hs_code', t)} />
                                    <Text className="text-[10px] text-gray-400 mt-1 leading-tight">For customs purposes when exporting/importing products</Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">Gross Weight (kg)</Text>
                                    <TextInput className="bg-gray-50 px-4 rounded-xl border border-gray-100 text-gray-900 h-14" placeholder="0.00" keyboardType="numeric" value={formData.weight} onChangeText={(t) => updateForm('weight', t)} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-700 mb-2">Total Volume (CBM)</Text>
                                    <TextInput className="bg-blue-50/50 px-4 rounded-xl border border-blue-100 text-blue-900 font-medium h-14" placeholder="0.000" keyboardType="numeric" value={formData.volume} editable={false} />
                                </View>
                            </View>

                            <View>
                                <Text className="text-base font-bold text-gray-900 mb-4">Internal Dimensions (cm)</Text>
                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-500 mb-2 text-center">Length</Text>
                                        <TextInput
                                            ref={lengthRef}
                                            inputAccessoryViewID="dimsAccessory"
                                            className="bg-gray-50 px-4 rounded-xl border border-gray-100 text-center h-14"
                                            placeholder="cm"
                                            keyboardType="numeric"
                                            value={formData.dims_length}
                                            onChangeText={(t) => updateForm('dims_length', t)}
                                            onSubmitEditing={() => widthRef.current?.focus()}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-500 mb-2 text-center">Width</Text>
                                        <TextInput
                                            ref={widthRef}
                                            inputAccessoryViewID="dimsAccessory"
                                            className="bg-gray-50 px-4 rounded-xl border border-gray-100 text-center h-14"
                                            placeholder="cm"
                                            keyboardType="numeric"
                                            value={formData.dims_width}
                                            onChangeText={(t) => updateForm('dims_width', t)}
                                            onSubmitEditing={() => heightRef.current?.focus()}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-500 mb-2 text-center">Height</Text>
                                        <TextInput
                                            ref={heightRef}
                                            inputAccessoryViewID="dimsAccessory"
                                            className="bg-gray-50 px-4 rounded-xl border border-gray-100 text-center h-14"
                                            placeholder="cm"
                                            keyboardType="numeric"
                                            value={formData.dims_height}
                                            onChangeText={(t) => updateForm('dims_height', t)}
                                            returnKeyType="done"
                                        />
                                    </View>
                                </View>
                                <Text className="text-xs text-gray-400 mt-2">Formula: (L * W * H) / 1,000,000 = CBM</Text>
                            </View>
                        </View>
                    )}

                    {/* STEP 3: REQUIREMENTS */}
                    {step === 3 && (
                        <View className="space-y-8 pb-10">
                            <View>
                                <Text className="text-2xl font-bold text-gray-900 mb-2">Requirements</Text>
                                <Text className="text-gray-500">Special handling and documentation.</Text>
                            </View>

                            {/* Temp Control */}
                            <View className="bg-white p-5 rounded-2xl border border-gray-100 flex-row items-center justify-between shadow-sm">
                                <View className="flex-row items-center flex-1 pr-4">
                                    <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4"><Ionicons name="thermometer-outline" size={20} color="#2563EB" /></View>
                                    <View className="flex-1"><Text className="font-bold text-gray-900 text-base">Temperature Control</Text><Text className="text-gray-500 text-xs mt-1">Refrigerated transport required</Text></View>
                                </View>
                                <Switch value={formData.temp_control} onValueChange={v => updateForm('temp_control', v)} trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }} thumbColor={formData.temp_control ? '#2563EB' : '#FFFFFF'} />
                            </View>

                            {/* Loading Type - Radio List */}
                            <View>
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Type of Loading</Text>
                                <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    {['Standard', 'Back', 'Side', 'Top'].map((type, i) => (
                                        <TouchableOpacity key={type} activeOpacity={0.7} onPress={() => updateForm('loading_type', type)} className={`flex-row items-center p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                            <View className={`w-6 h-6 rounded-full border items-center justify-center mr-3 ${formData.loading_type === type ? 'border-blue-600' : 'border-gray-300'}`}>
                                                {formData.loading_type === type && <View className="w-3 h-3 rounded-full bg-blue-600" />}
                                            </View>
                                            <Text className={`font-medium ${formData.loading_type === type ? 'text-blue-900' : 'text-gray-700'}`}>{type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Documents - Checkbox List */}
                            <View>
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Documents & Compliance</Text>
                                <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    {[{ key: 'need_tir', label: 'TIR' }, { key: 'need_cmr', label: 'CMR' }, { key: 'need_waybill', label: 'Waybill' }].map((item, i) => (
                                        <TouchableOpacity key={item.key} activeOpacity={0.7} onPress={() => updateForm(item.key, !formData[item.key as keyof typeof formData])} className={`flex-row items-center p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                            <View className={`w-6 h-6 rounded border items-center justify-center mr-3 ${formData[item.key as keyof typeof formData] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {formData[item.key as keyof typeof formData] && <Ionicons name="checkmark" size={16} color="white" />}
                                            </View>
                                            <Text className={`font-medium ${formData[item.key as keyof typeof formData] ? 'text-blue-900' : 'text-gray-700'}`}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Export Decl - Radio List */}
                            <View>
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Who submits export declaration?</Text>
                                <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                    {['Shipper', 'Transporter', 'None'].map((opt, i) => (
                                        <TouchableOpacity key={opt} activeOpacity={0.7} onPress={() => updateForm('export_declaration', opt)} className={`flex-row items-center p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                                            <View className={`w-6 h-6 rounded-full border items-center justify-center mr-3 ${formData.export_declaration === opt ? 'border-blue-600' : 'border-gray-300'}`}>
                                                {formData.export_declaration === opt && <View className="w-3 h-3 rounded-full bg-blue-600" />}
                                            </View>
                                            <Text className={`font-medium ${formData.export_declaration === opt ? 'text-blue-900' : 'text-gray-700'}`}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* STEP 4: DETAILS */}
                    {step === 4 && (
                        <View className="space-y-6 pb-10">
                            <View>
                                <Text className="text-2xl font-bold text-gray-900 mb-2">Final Details</Text>
                                <Text className="text-gray-500">Parties and Payment Information.</Text>
                            </View>

                            {/* Shipper Card */}
                            <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <View className="flex-row items-center border-b border-gray-100 pb-3">
                                    <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3"><Ionicons name="location-outline" size={18} color="#2563EB" /></View>
                                    <Text className="font-bold text-gray-900 text-base">Shipper Details</Text>
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</Text>
                                    <TextInput value={formData.shipper_company} onChangeText={t => updateForm('shipper_company', t)} placeholder="e.g. Acme Logistics" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" />
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</Text>
                                    <TextInput value={formData.shipper_address} onChangeText={t => updateForm('shipper_address', t)} placeholder="Full pickup address" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" />
                                </View>
                            </View>

                            {/* Consignee Card */}
                            <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <View className="flex-row items-center border-b border-gray-100 pb-3">
                                    <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center mr-3"><Ionicons name="location-outline" size={18} color="#EF4444" /></View>
                                    <Text className="font-bold text-gray-900 text-base">Consignee Details</Text>
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</Text>
                                    <TextInput value={formData.consignee_company} onChangeText={t => updateForm('consignee_company', t)} placeholder="e.g. Global Trade Inc." returnKeyType="done" onSubmitEditing={Keyboard.dismiss} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" />
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</Text>
                                    <TextInput value={formData.consignee_address} onChangeText={t => updateForm('consignee_address', t)} placeholder="Full delivery address" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900" />
                                </View>
                            </View>

                            {/* Financial Agreement */}
                            <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <View className="flex-row items-center border-b border-gray-100 pb-3">
                                    <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mr-3"><Ionicons name="wallet-outline" size={18} color="#059669" /></View>
                                    <Text className="font-bold text-gray-900 text-base">Financial Agreement</Text>
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cargo Value</Text>
                                        <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden h-12">
                                            <TextInput value={formData.cargo_value} onChangeText={t => updateForm('cargo_value', t)} placeholder="0.00" keyboardType="numeric" inputAccessoryViewID="dimsAccessory" className="flex-1 px-4 text-gray-900 font-medium" />
                                            <TouchableOpacity onPress={() => setCurrencyModalVisible(true)} className="bg-white px-3 h-full justify-center border-l border-gray-200 flex-row items-center">
                                                <Text className="font-bold text-gray-900 mr-1">{formData.currency}</Text>
                                                <Ionicons name="chevron-down" size={12} color="#6B7280" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms</Text>
                                        <TouchableOpacity onPress={() => setTermsModalVisible(true)} className="border border-gray-200 rounded-xl bg-gray-50 h-12 flex-row items-center justify-between px-3">
                                            <Text className="text-gray-900 font-medium" numberOfLines={1}>{formData.payment_terms}</Text>
                                            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>


                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Buttons */}
            <View className="bg-white p-6 border-t border-gray-100 flex-row gap-4">
                {step > 1 && (
                    <TouchableOpacity onPress={() => setStep(step - 1)} className="flex-1 bg-gray-100 py-4 rounded-xl items-center">
                        <Text className="text-gray-900 font-semibold">Back</Text>
                    </TouchableOpacity>
                )}
                {step < 4 ? (
                    <TouchableOpacity onPress={handleNext} className="flex-1 bg-blue-600 py-4 rounded-xl items-center">
                        <Text className="text-white font-bold">Next Step</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleSubmit} disabled={loading} className={`flex-1 bg-blue-600 py-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}>
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Publish Shipment</Text>}
                    </TouchableOpacity>
                )}
            </View>

            {/* iOS Date Picker Modal */}
            <Modal animationType="slide" transparent={true} visible={iosModalVisible}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-4">
                        <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-4">
                            <TouchableOpacity onPress={() => setIosModalVisible(false)}><Text className="text-blue-600 text-lg font-medium">Cancel</Text></TouchableOpacity>
                            <Text className="text-lg font-bold text-gray-900">Select Date</Text>
                            <TouchableOpacity onPress={saveIosDate}><Text className="text-blue-600 text-lg font-bold">Done</Text></TouchableOpacity>
                        </View>
                        <DateTimePicker value={tempDate} mode="date" display="spinner" onChange={(e, d) => d && setTempDate(d)} textColor="black" />
                    </View>
                </View>
            </Modal>

            {/* Android Date Picker */}
            {showAndroidPicker && <DateTimePicker value={tempDate} mode="date" display="default" onChange={handleAndroidDateChange} />}

            {/* Keyboard Accessory View for Dimensions */}
            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID="dimsAccessory">
                    <View className="bg-gray-100 border-t border-gray-200 p-2 flex-row justify-end items-center">
                        <TouchableOpacity onPress={() => Keyboard.dismiss()} className="bg-white px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
                            <Text className="text-blue-600 font-bold">Done</Text>
                        </TouchableOpacity>
                    </View>
                </InputAccessoryView>
            )}

            {/* Currency Modal */}
            <Modal animationType="slide" transparent={true} visible={currencyModalVisible} onRequestClose={() => setCurrencyModalVisible(false)}>
                <Pressable onPress={() => setCurrencyModalVisible(false)} className="flex-1 justify-end bg-black/50">
                    <Pressable className="bg-white rounded-t-3xl p-6 h-1/2">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">Select Currency</Text>
                            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}><Ionicons name="close-circle" size={28} color="#E5E7EB" /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {currencyOptions.map(curr => (
                                <TouchableOpacity key={curr} onPress={() => { updateForm('currency', curr); setCurrencyModalVisible(false); }} className={`p-4 mb-3 rounded-xl flex-row items-center justify-between border ${formData.currency === curr ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                                    <Text className="text-lg font-medium text-gray-900">{curr}</Text>
                                    {formData.currency === curr && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Payment Terms Modal */}
            <Modal animationType="slide" transparent={true} visible={termsModalVisible} onRequestClose={() => setTermsModalVisible(false)}>
                <Pressable onPress={() => setTermsModalVisible(false)} className="flex-1 justify-end bg-black/50">
                    <Pressable className="bg-white rounded-t-3xl p-6 h-2/3">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">Payment Terms</Text>
                            <TouchableOpacity onPress={() => setTermsModalVisible(false)}><Ionicons name="close-circle" size={28} color="#E5E7EB" /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {termsOptions.map(term => (
                                <TouchableOpacity key={term} onPress={() => { updateForm('payment_terms', term); setTermsModalVisible(false); }} className={`p-4 mb-3 rounded-xl flex-row items-center justify-between border ${formData.payment_terms === term ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                                    <Text className="text-lg font-medium text-gray-900">{term}</Text>
                                    {formData.payment_terms === term && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
