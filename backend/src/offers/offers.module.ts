import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer } from './offer.entity';

import { Shipment } from '../shipments/shipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, Shipment])],
  providers: [OffersService],
  controllers: [OffersController],
})
export class OffersModule { }
