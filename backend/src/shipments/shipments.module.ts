import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { Shipment } from './shipment.entity';
import { Payment } from '../payments/payment.entity';

import { NotificationsModule } from '../notifications/notifications.module';
import { ShippersModule } from '../shippers/shippers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Payment]),
    NotificationsModule,
    ShippersModule,
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [ShipmentsService],
})
export class ShipmentsModule { }
