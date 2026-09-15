import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Payment, PaymentStatus } from './payment.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    private notificationsService: NotificationsService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      this.stripe = new Stripe(key);
    } else {
      this.logger.warn('STRIPE_SECRET_KEY is not set — payment endpoints will return an error until it is configured.');
    }
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException('Payments are not configured on this server yet (missing STRIPE_SECRET_KEY)');
    }
    return this.stripe;
  }

  /** Mirrors the due-date logic already shown in the shipper's shipment list UI. */
  private computeDueDate(paymentTerms: string | undefined, deliveryTime: Date | undefined): Date | null {
    if (!deliveryTime) return null;
    let daysToAdd = 0;
    const terms = (paymentTerms || '').toLowerCase().replace(/_/g, ' ');
    if (terms.includes('0 - 7') || terms.includes('0-7')) daysToAdd = 7;
    else if (terms.includes('8 - 14') || terms.includes('8-14')) daysToAdd = 14;
    else if (terms.includes('15 - 30') || terms.includes('15-30')) daysToAdd = 30;

    const due = new Date(deliveryTime);
    due.setDate(due.getDate() + daysToAdd);
    return due;
  }

  private async getOrCreateForShipment(shipmentId: string, actorId: string): Promise<{ payment: Payment; shipment: Shipment }> {
    const shipment = await this.shipmentsRepository.findOne({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.shipper_id !== actorId) {
      throw new ForbiddenException('Only the shipper who created this shipment can pay for it');
    }
    if (shipment.status !== ShipmentStatus.DELIVERED) {
      throw new BadRequestException('This shipment has not been delivered yet');
    }
    if (!shipment.carrier_id) {
      throw new BadRequestException('This shipment has no assigned carrier');
    }
    if (!shipment.price) {
      throw new BadRequestException('This shipment has no agreed price to charge');
    }

    let payment = await this.paymentsRepository.findOne({ where: { shipment_id: shipmentId } });
    if (!payment) {
      payment = this.paymentsRepository.create({
        shipment_id: shipmentId,
        shipper_id: shipment.shipper_id,
        carrier_id: shipment.carrier_id,
        amount: shipment.price,
        currency: 'eur',
        status: PaymentStatus.PENDING,
        due_date: this.computeDueDate(shipment.payment_terms, shipment.delivery_time) || undefined,
      });
      payment = await this.paymentsRepository.save(payment);
    }

    return { payment, shipment };
  }

  async findByShipment(shipmentId: string): Promise<Payment | null> {
    return this.paymentsRepository.findOne({ where: { shipment_id: shipmentId } });
  }

  async findMine(userId: string, role: string): Promise<Payment[]> {
    const where = role === 'CARRIER' ? { carrier_id: userId } : { shipper_id: userId };
    return this.paymentsRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async getCarrierEarningsSummary(carrierId: string) {
    const { paid, paidCount } = await this.paymentsRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'paid')
      .addSelect('COUNT(p.id)', 'paidCount')
      .where('p.carrier_id = :carrierId', { carrierId })
      .andWhere('p.status = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const { pending, pendingCount } = await this.paymentsRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'pending')
      .addSelect('COUNT(p.id)', 'pendingCount')
      .where('p.carrier_id = :carrierId', { carrierId })
      .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] })
      .getRawOne();

    return {
      totalPaid: parseFloat(paid) || 0,
      paidCount: parseInt(paidCount, 10) || 0,
      totalPending: parseFloat(pending) || 0,
      pendingCount: parseInt(pendingCount, 10) || 0,
    };
  }

  async createCheckoutSession(shipmentId: string, actorId: string): Promise<{ url: string }> {
    // Validate ownership/status/amount first so the caller gets a specific,
    // actionable error rather than a generic "Stripe isn't configured" for
    // requests that would have been rejected anyway.
    const { payment, shipment } = await this.getOrCreateForShipment(shipmentId, actorId);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('This shipment has already been paid');
    }

    const stripe = this.requireStripe();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnPath = `/en/dashboard/shipper/shipment-offers/${shipmentId}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: payment.currency,
            unit_amount: Math.round(Number(payment.amount) * 100),
            product_data: {
              name: `Shipment ${shipment.pickup_address} → ${shipment.delivery_address}`,
              description: `Freight charge for shipment #${shipmentId.slice(0, 8)}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        shipmentId,
      },
      success_url: `${frontendUrl}${returnPath}?payment=success`,
      cancel_url: `${frontendUrl}${returnPath}?payment=cancelled`,
    });

    await this.paymentsRepository.update(payment.id, {
      stripe_checkout_session_id: session.id,
      status: PaymentStatus.PROCESSING,
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: boolean }> {
    const stripe = this.requireStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await this.markPaid(paymentId, typeof session.payment_intent === 'string' ? session.payment_intent : undefined);
      }
    } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await this.paymentsRepository.update(paymentId, { status: PaymentStatus.FAILED });
      }
    }

    return { received: true };
  }

  private async markPaid(paymentId: string, paymentIntentId?: string): Promise<void> {
    const payment = await this.paymentsRepository.findOne({ where: { id: paymentId } });
    if (!payment || payment.status === PaymentStatus.PAID) return;

    await this.paymentsRepository.update(paymentId, {
      status: PaymentStatus.PAID,
      paid_at: new Date(),
      stripe_payment_intent_id: paymentIntentId,
    });

    await this.notificationsService.create(
      payment.shipper_id,
      'Payment Confirmed',
      `Your payment of €${payment.amount} for shipment #${payment.shipment_id.slice(0, 8)} was received.`,
      'PAYMENT_CONFIRMED',
      { paymentId, shipmentId: payment.shipment_id },
    );

    await this.notificationsService.create(
      payment.carrier_id,
      'You’ve Been Paid',
      `€${payment.amount} was paid for shipment #${payment.shipment_id.slice(0, 8)}.`,
      'PAYMENT_RECEIVED',
      { paymentId, shipmentId: payment.shipment_id },
    );
  }
}
