import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
  ) {}

  async create(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.vehiclesRepository.create(vehicleData);
    return this.vehiclesRepository.save(vehicle);
  }

  async findAll(carrierId?: string): Promise<Vehicle[]> {
    if (carrierId) {
      return this.vehiclesRepository.find({
        where: { carrier_id: carrierId },
      });
    }
    return this.vehiclesRepository.find();
  }

  async findOne(id: string): Promise<Vehicle | null> {
    return this.vehiclesRepository.findOne({ where: { id } });
  }
}
