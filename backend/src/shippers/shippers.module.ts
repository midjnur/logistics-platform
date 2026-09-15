import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippersService } from './shippers.service';
import { ShippersController } from './shippers.controller';
import { Shipper } from './shipper.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipper])],
  providers: [ShippersService],
  controllers: [ShippersController],
  exports: [ShippersService],
})
export class ShippersModule {}
