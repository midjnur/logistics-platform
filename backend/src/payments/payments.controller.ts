import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout/:shipmentId')
  @UseGuards(AuthGuard('jwt'))
  async createCheckout(@Param('shipmentId') shipmentId: string, @Req() req: any) {
    return this.paymentsService.createCheckoutSession(shipmentId, req.user.userId);
  }

  @Get('shipment/:shipmentId')
  @UseGuards(AuthGuard('jwt'))
  async getByShipment(@Param('shipmentId') shipmentId: string) {
    return this.paymentsService.findByShipment(shipmentId);
  }

  @Get('my-payments')
  @UseGuards(AuthGuard('jwt'))
  async getMine(@Req() req: any) {
    return this.paymentsService.findMine(req.user.userId, req.user.role);
  }

  @Get('carrier/earnings-summary')
  @UseGuards(AuthGuard('jwt'))
  async getEarningsSummary(@Req() req: any) {
    return this.paymentsService.getCarrierEarningsSummary(req.user.userId);
  }

  // No AuthGuard here — Stripe calls this directly, authenticated by webhook signature instead.
  // The raw request body (needed for signature verification) is set up in main.ts.
  @Post('webhook')
  async webhook(@Req() req: Request, @Headers('stripe-signature') signature: string, @Body() body: Buffer) {
    return this.paymentsService.handleWebhook(body, signature);
  }
}
