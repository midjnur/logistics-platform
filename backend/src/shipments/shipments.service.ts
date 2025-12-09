import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './shipment.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
  ) {}

  async create(shipmentData: Partial<Shipment>): Promise<Shipment> {
    const shipment = this.shipmentsRepository.create(shipmentData);
    return this.shipmentsRepository.save(shipment);
  }

  async findAll(shipperId?: string): Promise<Shipment[]> {
    if (shipperId) {
      return this.shipmentsRepository.find({
        where: { shipper_id: shipperId },
        order: { created_at: 'DESC' },
      });
    }
    return this.shipmentsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Shipment | null> {
    return this.shipmentsRepository.findOne({ where: { id } });
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
  ): Promise<Shipment | null> {
    const updateData: Partial<Shipment> = { status };

    if (status === ShipmentStatus.IN_TRANSIT) {
      updateData.pickup_time = new Date();
    } else if (status === ShipmentStatus.DELIVERED) {
      updateData.delivery_time = new Date();
    }

    await this.shipmentsRepository.update(id, updateData);
    return this.findOne(id);
  }
}
