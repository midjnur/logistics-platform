import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(AuthGuard('jwt'))
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  async create(@Body() createDto: any, @Request() req: { user: any }) {
    return this.offersService.create({
      ...createDto,
      carrier_id: req.user.userId,
    });
  }

  @Get('shipment/:shipmentId')
  async getShipmentOffers(@Param('shipmentId') shipmentId: string) {
    return this.offersService.findByShipment(shipmentId);
  }

  @Get('my-offers')
  async getMyOffers(@Request() req: { user: any }) {
    return this.offersService.findByCarrier(req.user.userId);
  }

  @Patch(':id/accept')
  async acceptOffer(@Param('id') id: string) {
    return this.offersService.acceptOffer(id);
  }

  @Patch(':id/reject')
  async rejectOffer(@Param('id') id: string) {
    return this.offersService.rejectOffer(id);
  }
}
