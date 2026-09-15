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

  @Patch(':id/counter')
  async counterOffer(
    @Param('id') id: string,
    @Body() body: { price: number; message?: string },
    @Request() req: { user: any },
  ) {
    return this.offersService.counter(id, req.user.userId, body.price, body.message);
  }

  @Patch(':id/accept')
  async acceptOffer(@Param('id') id: string, @Request() req: { user: any }) {
    return this.offersService.acceptOffer(id, req.user.userId);
  }

  @Patch(':id/reject')
  async rejectOffer(@Param('id') id: string, @Request() req: { user: any }) {
    return this.offersService.rejectOffer(id, req.user.userId);
  }

  @Patch(':id/withdraw')
  async withdrawOffer(@Param('id') id: string, @Request() req: { user: any }) {
    return this.offersService.withdraw(id, req.user.userId);
  }
}
