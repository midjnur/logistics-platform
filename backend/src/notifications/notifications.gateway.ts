import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface CarrierLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp: number;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    // In-memory cache for last known carrier locations per shipment
    private lastKnownLocations: Map<string, CarrierLocation> = new Map();

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        console.log('WebSocket Gateway Initialized');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        try {
            const token = client.handshake.auth.token || client.handshake.query.token;
            if (!token) {
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('JWT_SECRET');
            const payload = this.jwtService.verify(token, { secret });

            // Join a room specific to this user
            client.join(`user_${payload.sub}`);

            // Join a room specific to this role
            if (payload.role) {
                client.join(`role_${payload.role}`);
            }

            console.log(`Client connected: ${client.id}, User: ${payload.sub}, Role: ${payload.role}`);
        } catch (e) {
            console.error('WebSocket connection authentication failed');
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user_${userId}`).emit(event, data);
    }

    @SubscribeMessage('join-shipment-tracking')
    handleJoinShipmentTracking(client: Socket, payload: { shipmentId: string }) {
        const { shipmentId } = payload;
        client.join(`shipment_${shipmentId}`);
        console.log(`Client ${client.id} joined tracking for shipment ${shipmentId}`);

        // Send last known location immediately if available
        const lastLocation = this.lastKnownLocations.get(shipmentId);
        if (lastLocation) {
            client.emit('carrier-location', {
                shipmentId,
                ...lastLocation,
            });
            console.log(`Sent cached location for shipment ${shipmentId} to new subscriber`);
        }

        return { success: true };
    }

    @SubscribeMessage('leave-shipment-tracking')
    handleLeaveShipmentTracking(client: Socket, payload: { shipmentId: string }) {
        const { shipmentId } = payload;
        client.leave(`shipment_${shipmentId}`);
        console.log(`Client ${client.id} left tracking for shipment ${shipmentId}`);
        return { success: true };
    }

    @SubscribeMessage('location-update')
    handleLocationUpdate(client: Socket, payload: {
        shipmentId: string;
        latitude: number;
        longitude: number;
        accuracy?: number;
        speed?: number;
        heading?: number;
        timestamp: number;
    }) {
        // TODO: Validate that the client (carrier) owns this shipment
        this.recordAndBroadcastLocation(payload.shipmentId, payload);
        return { success: true };
    }

    /**
     * Shared by the WebSocket handler above (web app, foreground) and by
     * NotificationsController's REST endpoint (mobile background task —
     * a persistent socket doesn't survive the OS suspending the app, so
     * background updates arrive as plain HTTP POSTs instead).
     */
    recordAndBroadcastLocation(shipmentId: string, location: CarrierLocation) {
        this.lastKnownLocations.set(shipmentId, location);
        this.server.to(`shipment_${shipmentId}`).emit('carrier-location', {
            shipmentId,
            ...location,
        });
        console.log(`Location update for shipment ${shipmentId}:`, location.latitude, location.longitude);
    }
}
