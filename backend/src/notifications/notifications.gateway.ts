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

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

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
        // For now, broadcast the location to all subscribers of this shipment
        this.server.to(`shipment_${payload.shipmentId}`).emit('carrier-location', {
            shipmentId: payload.shipmentId,
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: payload.accuracy,
            speed: payload.speed,
            heading: payload.heading,
            timestamp: payload.timestamp,
        });

        console.log(`Location update for shipment ${payload.shipmentId}:`, payload.latitude, payload.longitude);
        return { success: true };
    }
}
