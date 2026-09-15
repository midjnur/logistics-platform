import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Payment } from '../payments/payment.entity';
import { Review } from '../reviews/review.entity';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Shipment, Payment, Review]), ShipmentsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
