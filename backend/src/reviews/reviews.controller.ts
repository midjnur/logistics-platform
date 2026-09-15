import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(AuthGuard('jwt'))
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  async create(
    @Body() body: { shipment_id: string; rating: number; comment?: string },
    @Request() req: { user: any },
  ) {
    return this.reviewsService.create(req.user.userId, body);
  }

  @Get('shipment/:shipmentId')
  async getByShipment(@Param('shipmentId') shipmentId: string) {
    return this.reviewsService.findByShipment(shipmentId);
  }

  @Get('carrier/:carrierId')
  async getByCarrier(@Param('carrierId') carrierId: string) {
    return this.reviewsService.findByCarrier(carrierId);
  }

  @Get('carrier/:carrierId/summary')
  async getCarrierSummary(@Param('carrierId') carrierId: string) {
    return this.reviewsService.getCarrierSummary(carrierId);
  }
}
