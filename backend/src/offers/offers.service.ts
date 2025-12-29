import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './offer.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OffersService {
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

  async acceptOffer(id: string): Promise<Offer | null> {
    const offer = await this.offersRepository.findOne({ where: { id } });
    if (!offer) return null;

    // Update Offer Status
    await this.offersRepository.update(id, { status: OfferStatus.ACCEPTED });

    // Update Shipment Status and Carrier
    const shipment = await this.shipmentsRepository.findOne({ where: { id: offer.shipment_id } });
    if (shipment) {
      const newTimelineEntry = {
        status: ShipmentStatus.ASSIGNED,
        timestamp: new Date().toISOString(),
        description: 'Offer accepted by Shipper',
      };

      await this.shipmentsRepository.update(offer.shipment_id, {
        status: ShipmentStatus.ASSIGNED,
        carrier_id: offer.carrier_id,
        price: offer.offered_price,
        timeline: [...(shipment.timeline || []), newTimelineEntry],
      });

      // Notify Carrier
      await this.notificationsService.create(
        offer.carrier_id,
        'Offer Accepted',
        `Your offer for shipment #${offer.shipment_id.slice(0, 8)} has been accepted!`,
        'OFFER_ACCEPTED',
        { offerId: offer.id, shipmentId: offer.shipment_id }
      );
    }

    // Reject other offers for this shipment? (Optional/Future)

    return this.offersRepository.findOne({ where: { id } });
  }

  async rejectOffer(id: string): Promise<Offer | null> {
    await this.offersRepository.update(id, { status: OfferStatus.REJECTED });
    return this.offersRepository.findOne({ where: { id } });
  }
}
