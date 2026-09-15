import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipper, ShipperVerificationStatus } from './shipper.entity';

@Injectable()
export class ShippersService {
  constructor(
    @InjectRepository(Shipper)
    private shippersRepository: Repository<Shipper>,
  ) {}

  async upsert(userId: string, data: Partial<Shipper>): Promise<Shipper> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      // Resubmitting (e.g. after a rejection) puts it back to PENDING for re-review.
      await this.shippersRepository.update(
        { user_id: userId },
        { ...data, verification_status: ShipperVerificationStatus.PENDING },
      );
      return (await this.findByUserId(userId)) as Shipper;
    }
    const shipper = this.shippersRepository.create({ ...data, user_id: userId });
    return this.shippersRepository.save(shipper);
  }

  async findByUserId(userId: string): Promise<Shipper | null> {
    return this.shippersRepository.findOne({ where: { user_id: userId } });
  }

  async findAllPending(): Promise<Shipper[]> {
    return this.shippersRepository.find({
      where: { verification_status: ShipperVerificationStatus.PENDING },
      relations: ['user', 'user.documents'],
    });
  }

  async updateStatus(userId: string, status: ShipperVerificationStatus): Promise<Shipper | null> {
    await this.shippersRepository.update({ user_id: userId }, { verification_status: status });
    return this.findByUserId(userId);
  }
}
