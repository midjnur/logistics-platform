import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
  ) {}

  async create(offerData: Partial<Offer>): Promise<Offer> {
    const offer = this.offersRepository.create(offerData);
    return this.offersRepository.save(offer);
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
      order: { created_at: 'DESC' },
    });
  }

  async acceptOffer(id: string): Promise<Offer | null> {
    await this.offersRepository.update(id, { status: OfferStatus.ACCEPTED });
    return this.offersRepository.findOne({ where: { id } });
  }

  async rejectOffer(id: string): Promise<Offer | null> {
    await this.offersRepository.update(id, { status: OfferStatus.REJECTED });
    return this.offersRepository.findOne({ where: { id } });
  }
}
