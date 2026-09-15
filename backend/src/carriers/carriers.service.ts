import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier, VerificationStatus } from './carrier.entity';

@Injectable()
export class CarriersService {
  constructor(
    @InjectRepository(Carrier)
    private carriersRepository: Repository<Carrier>,
  ) {}

  async create(carrierData: Partial<Carrier>): Promise<Carrier> {
    const carrier = this.carriersRepository.create(carrierData);
    return this.carriersRepository.save(carrier);
  }

  async findOne(userId: string): Promise<Carrier | null> {
    return this.carriersRepository.findOne({ where: { user_id: userId } });
  }

  async findByUserId(userId: string): Promise<Carrier | null> {
    return this.carriersRepository.findOne({ where: { user_id: userId } });
  }

  async update(
    userId: string,
    updateData: Partial<Carrier>,
  ): Promise<Carrier | null> {
    await this.carriersRepository.update({ user_id: userId }, updateData);
    return this.findOne(userId);
  }
  async findAllPending(): Promise<any[]> {
    // Document.owner now points at User (not Carrier — that's what let
    // shippers own documents too), so documents come in via user.documents;
    // flattened back onto `documents` here so the admin UI didn't need to
    // change how it reads this response.
    const carriers = await this.carriersRepository.find({
      where: { verification_status: VerificationStatus.PENDING },
      relations: ['user', 'user.documents'],
    });
    return carriers.map((c) => ({ ...c, documents: c.user?.documents || [] }));
  }

  async updateStatus(
    id: string,
    status: VerificationStatus,
  ): Promise<Carrier | null> {
    await this.carriersRepository.update(
      { user_id: id },
      { verification_status: status },
    );
    return this.findOne(id);
  }
}
