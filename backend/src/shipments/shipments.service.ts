import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './shipment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
  ) { }

  async create(shipmentData: Partial<Shipment>): Promise<Shipment> {
    const shipment = this.shipmentsRepository.create({
      ...shipmentData,
      timeline: [
        {
          status: ShipmentStatus.OPEN,
          timestamp: new Date().toISOString(),
          description: 'Shipment created',
        },
      ],
    });
    return this.shipmentsRepository.save(shipment);
  }

  async findAll(
    shipperId?: string,
    excludeCarrierId?: string,
  ): Promise<Shipment[]> {
    const query = this.shipmentsRepository.createQueryBuilder('shipment');

    if (shipperId) {
      query.andWhere('shipment.shipper_id = :shipperId', { shipperId });
      query.leftJoinAndSelect('shipment.offers', 'offers');
    }

    if (excludeCarrierId) {
      // Join offers made by this carrier
      query.leftJoin(
        'shipment.offers',
        'offer',
        'offer.carrier_id = :excludeCarrierId',
        { excludeCarrierId },
      );
      // Filter out shipments where such an offer exists (is NOT NULL)
      // Actually we want where offer IS NULL (no match found)
      query.andWhere('offer.id IS NULL');
    }

    query.orderBy('shipment.created_at', 'DESC');

    return query.getMany();
  }

  async findAssignedToCarrier(carrierId: string): Promise<Shipment[]> {
    return this.shipmentsRepository.find({
      where: { carrier_id: carrierId },
      relations: ['offers'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Shipment | null> {
    return this.shipmentsRepository.findOne({
      where: { id },
      relations: ['documents'],
    });
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
  ): Promise<Shipment | null> {
    const shipment = await this.findOne(id);
    if (!shipment) return null;

    const updateData: Partial<Shipment> = { status };

    if (status === ShipmentStatus.IN_TRANSIT) {
      updateData.pickup_time = new Date();
    } else if (status === ShipmentStatus.DELIVERED) {
      updateData.delivery_time = new Date();
    }

    // Append to timeline
    const newTimelineEntry = {
      status,
      timestamp: new Date().toISOString(),
      description: `Status changed to ${status}`,
    };

    updateData.timeline = [...(shipment.timeline || []), newTimelineEntry];

    await this.shipmentsRepository.update(id, updateData);
    return this.findOne(id);
  }
}
