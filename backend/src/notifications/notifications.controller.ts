import { Body, Controller, ForbiddenException, Get, NotFoundException, Patch, Param, Request, UseGuards, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Shipment } from '../shipments/shipment.entity';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly notificationsGateway: NotificationsGateway,
        @InjectRepository(Shipment)
        private shipmentsRepository: Repository<Shipment>,
    ) { }

    @Get()
    findAll(@Request() req: any) {
        return this.notificationsService.findAll(req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Post('mark-all-read')
    markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    /**
     * Background-task location updates (mobile carrier app). Unlike the
     * WebSocket path, this is validated: only the carrier actually
     * assigned to the shipment may post a location for it.
     */
    @Post('location/:shipmentId')
    async postLocation(
        @Param('shipmentId') shipmentId: string,
        @Body() body: {
            latitude: number;
            longitude: number;
            accuracy?: number;
            speed?: number;
            heading?: number;
            timestamp: number;
        },
        @Request() req: any,
    ) {
        const shipment = await this.shipmentsRepository.findOne({ where: { id: shipmentId } });
        if (!shipment) throw new NotFoundException('Shipment not found');
        if (shipment.carrier_id !== req.user.userId) {
            throw new ForbiddenException('Only the assigned carrier can post a location for this shipment');
        }

        this.notificationsGateway.recordAndBroadcastLocation(shipmentId, {
            latitude: body.latitude,
            longitude: body.longitude,
            accuracy: body.accuracy,
            speed: body.speed,
            heading: body.heading,
            timestamp: body.timestamp,
        });

        return { success: true };
    }
}
