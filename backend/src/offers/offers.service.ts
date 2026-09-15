import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Offer, OfferStatus, CounterParty } from './offer.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { NotificationsService } from '../notifications/notifications.service';

const OPEN_STATUSES = [OfferStatus.PENDING, OfferStatus.COUNTERED];

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    private notificationsService: NotificationsService,
  ) { }

  async create(offerData: Partial<Offer>): Promise<Offer> {
    const offer = this.offersRepository.create(offerData);
    const savedOffer = await this.offersRepository.save(offer);

    // Update Shipment Status to OFFERED and log it
    if (offer.shipment_id) {
      const shipment = await this.shipmentsRepository.findOne({ where: { id: offer.shipment_id } });
      if (shipment) {
        // Notify Shipper
        await this.notificationsService.create(
          shipment.shipper_id,
          'New Offer Received',
          `You have received an offer for ${shipment.pickup_address}`,
          'OFFER_RECEIVED',
          { offerId: savedOffer.id, shipmentId: shipment.id }
        );

        // Only update if not already assigned/completed
        if (['OPEN', 'OFFERED'].includes(shipment.status)) {
          const newTimelineEntry = {
            status: ShipmentStatus.OFFERED,
            timestamp: new Date().toISOString(),
            description: 'Offer received from Carrier',
          };

          await this.shipmentsRepository.update(shipment.id, {
            status: ShipmentStatus.OFFERED,
            timeline: [...(shipment.timeline || []), newTimelineEntry],
          });
        }
      }
    }

    return savedOffer;
  }

  async findByShipment(shipmentId: string): Promise<Offer[]> {
    return this.offersRepository.find({
      where: { shipment_id: shipmentId },
      order: { created_at: 'DESC' },
    });
  }

  async findByCarrier(carrierId: string): Promise<Offer[]> {
    return this.offersRepository.find({
      where: { carrier_id: carrierId },
      relations: ['shipment'],
      order: { created_at: 'DESC' },
    });
  }

  private async loadActiveOffer(id: string): Promise<{ offer: Offer; shipment: Shipment }> {
    const offer = await this.offersRepository.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const shipment = await this.shipmentsRepository.findOne({ where: { id: offer.shipment_id } });
    if (!shipment) {
      throw new NotFoundException('Shipment for this offer no longer exists');
    }

    if (offer.expires_at && offer.expires_at < new Date() && OPEN_STATUSES.includes(offer.status)) {
      await this.offersRepository.update(offer.id, { status: OfferStatus.EXPIRED });
      throw new BadRequestException('This offer has expired');
    }

    return { offer, shipment };
  }

  async counter(
    id: string,
    actorId: string,
    price: number,
    message?: string,
  ): Promise<Offer> {
    if (!(price > 0)) {
      throw new BadRequestException('Counter price must be greater than zero');
    }

    const { offer, shipment } = await this.loadActiveOffer(id);
    const isShipper = actorId === shipment.shipper_id;
    const isCarrier = actorId === offer.carrier_id;

    let party: CounterParty;
    if (isShipper && offer.status === OfferStatus.PENDING) {
      party = CounterParty.SHIPPER;
    } else if (isShipper && offer.status === OfferStatus.COUNTERED && offer.countered_by === CounterParty.CARRIER) {
      party = CounterParty.SHIPPER;
    } else if (isCarrier && offer.status === OfferStatus.COUNTERED && offer.countered_by === CounterParty.SHIPPER) {
      party = CounterParty.CARRIER;
    } else if (isShipper || isCarrier) {
      throw new BadRequestException('It is not your turn to counter this offer');
    } else {
      throw new ForbiddenException('You are not a party to this offer');
    }

    await this.offersRepository.update(id, {
      status: OfferStatus.COUNTERED,
      counter_price: price,
      counter_message: message,
      countered_by: party,
    });

    const recipientId = party === CounterParty.SHIPPER ? offer.carrier_id : shipment.shipper_id;
    await this.notificationsService.create(
      recipientId,
      'Counter-Offer Received',
      `A counter-offer of €${price} was proposed for shipment #${shipment.id.slice(0, 8)}`,
      'OFFER_COUNTERED',
      { offerId: id, shipmentId: shipment.id },
    );

    return this.offersRepository.findOne({ where: { id } }) as Promise<Offer>;
  }

  async acceptOffer(id: string, actorId: string): Promise<Offer | null> {
    const { offer, shipment } = await this.loadActiveOffer(id);
    const isShipper = actorId === shipment.shipper_id;
    const isCarrier = actorId === offer.carrier_id;

    const respondingParty: CounterParty | null =
      offer.status === OfferStatus.PENDING
        ? CounterParty.SHIPPER
        : offer.status === OfferStatus.COUNTERED
          ? (offer.countered_by === CounterParty.SHIPPER ? CounterParty.CARRIER : CounterParty.SHIPPER)
          : null;

    if (!respondingParty) {
      throw new BadRequestException('This offer can no longer be accepted');
    }
    if (respondingParty === CounterParty.SHIPPER && !isShipper) {
      throw new ForbiddenException('Only the shipper can accept this offer');
    }
    if (respondingParty === CounterParty.CARRIER && !isCarrier) {
      throw new ForbiddenException('Only the carrier can accept this counter-offer');
    }

    if (shipment.carrier_id && shipment.carrier_id !== offer.carrier_id) {
      throw new BadRequestException('This shipment has already been assigned to another carrier');
    }

    const finalPrice = offer.status === OfferStatus.COUNTERED ? offer.counter_price : offer.offered_price;

    // Update Offer Status
    await this.offersRepository.update(id, { status: OfferStatus.ACCEPTED, offered_price: finalPrice });

    const newTimelineEntry = {
      status: ShipmentStatus.ASSIGNED,
      timestamp: new Date().toISOString(),
      description: 'Offer accepted',
    };

    await this.shipmentsRepository.update(offer.shipment_id, {
      status: ShipmentStatus.ASSIGNED,
      carrier_id: offer.carrier_id,
      price: finalPrice,
      timeline: [...(shipment.timeline || []), newTimelineEntry],
    });

    const recipientId = isShipper ? offer.carrier_id : shipment.shipper_id;
    await this.notificationsService.create(
      recipientId,
      'Offer Accepted',
      `Your offer for shipment #${offer.shipment_id.slice(0, 8)} has been accepted at €${finalPrice}!`,
      'OFFER_ACCEPTED',
      { offerId: offer.id, shipmentId: offer.shipment_id },
    );

    return this.offersRepository.findOne({ where: { id } });
  }

  async rejectOffer(id: string, actorId: string): Promise<Offer | null> {
    const { offer, shipment } = await this.loadActiveOffer(id);
    const isShipper = actorId === shipment.shipper_id;
    const isCarrier = actorId === offer.carrier_id;

    if (!isShipper && !isCarrier) {
      throw new ForbiddenException('You are not a party to this offer');
    }

    await this.offersRepository.update(id, { status: OfferStatus.REJECTED });

    const recipientId = isShipper ? offer.carrier_id : shipment.shipper_id;
    await this.notificationsService.create(
      recipientId,
      'Offer Rejected',
      `Your offer for shipment #${offer.shipment_id.slice(0, 8)} was rejected.`,
      'OFFER_REJECTED',
      { offerId: offer.id, shipmentId: offer.shipment_id },
    );

    return this.offersRepository.findOne({ where: { id } });
  }

  async withdraw(id: string, actorId: string): Promise<Offer | null> {
    const { offer, shipment } = await this.loadActiveOffer(id);

    if (actorId !== offer.carrier_id) {
      throw new ForbiddenException('Only the carrier who made this offer can withdraw it');
    }
    if (!OPEN_STATUSES.includes(offer.status)) {
      throw new BadRequestException('This offer can no longer be withdrawn');
    }

    await this.offersRepository.update(id, { status: OfferStatus.WITHDRAWN });

    await this.notificationsService.create(
      shipment.shipper_id,
      'Offer Withdrawn',
      `A carrier withdrew their offer for shipment #${offer.shipment_id.slice(0, 8)}`,
      'OFFER_WITHDRAWN',
      { offerId: offer.id, shipmentId: offer.shipment_id },
    );

    return this.offersRepository.findOne({ where: { id } });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireStaleOffers(): Promise<void> {
    const result = await this.offersRepository.update(
      { status: OfferStatus.PENDING, expires_at: LessThan(new Date()) },
      { status: OfferStatus.EXPIRED },
    );
    const counteredResult = await this.offersRepository.update(
      { status: OfferStatus.COUNTERED, expires_at: LessThan(new Date()) },
      { status: OfferStatus.EXPIRED },
    );
    const total = (result.affected || 0) + (counteredResult.affected || 0);
    if (total > 0) {
      this.logger.log(`Expired ${total} stale offer(s)`);
    }
  }
}
