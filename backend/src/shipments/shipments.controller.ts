import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShipmentsService } from './shipments.service';
import { ShipmentStatus } from './shipment.entity';

@Controller('shipments')
@UseGuards(AuthGuard('jwt'))
export class ShipmentsController {
  constructor(private shipmentsService: ShipmentsService) { }

  @Post()
  async create(@Body() createDto: any, @Request() req: { user: any }) {
    return this.shipmentsService.create({
      ...createDto,
      shipper_id: req.user.userId,
    });
  }

  @Get('my-shipments')
  async findMyShipments(@Request() req: { user: any }) {
    if (req.user.role === 'CARRIER') {
      return this.shipmentsService.findAssignedToCarrier(req.user.userId);
    }
    // Fallback for shippers or others (reuse existing logical approach or strict subset)
    if (req.user.role === 'SHIPPER') {
      return this.shipmentsService.findAll(req.user.userId);
    }
    return [];
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Request() req: { user: any }) {
    return this.shipmentsService.getDashboardStats(req.user.userId, req.user.role);
  }

  @Get()
  async findAll(@Request() req: { user: any }) {
    // If shipper, show only their shipments
    if (req.user.role === 'SHIPPER') {
      return this.shipmentsService.findAll(req.user.userId);
    }
    // If carrier, exclude shipments they already offered on, AND show only OPEN/OFFERED
    if (req.user.role === 'CARRIER') {
      return this.shipmentsService.findAll(undefined, req.user.userId, [
        ShipmentStatus.OPEN,
        ShipmentStatus.OFFERED
      ]);
    }
    // If admin, show all available shipments
    return this.shipmentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ShipmentStatus },
  ) {
    return this.shipmentsService.updateStatus(id, body.status);
  }

  @Post(':id/confirm-pickup')
  async confirmPickup(@Param('id') id: string, @Request() req: { user: any }) {
    // Ideally verify carrier is assigned, but keeping simple for now
    // Service logic could check `shipment.carrier_id === req.user.userId`
    return this.shipmentsService.updateStatus(id, ShipmentStatus.IN_TRANSIT);
  }
}
