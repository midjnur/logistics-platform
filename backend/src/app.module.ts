import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CarriersModule } from './carriers/carriers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { DocumentsModule } from './documents/documents.module';
import { Document } from './documents/document.entity';
import { AuthModule } from './auth/auth.module';
import { OffersModule } from './offers/offers.module';
import { User } from './users/user.entity';
import { Carrier } from './carriers/carrier.entity';
import { Vehicle } from './vehicles/vehicle.entity';
import { Shipment } from './shipments/shipment.entity';
import { Offer } from './offers/offer.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
        }),
      entities: [User, Carrier, Vehicle, Shipment, Document, Offer],
      synchronize: true, // Set to false in production
      ssl: (process.env.POSTGRES_HOST?.includes('supabase') || process.env.DATABASE_URL?.includes('supabase'))
        ? { rejectUnauthorized: false }
        : false,
    }),
    UsersModule,
    CarriersModule,
    VehiclesModule,
    ShipmentsModule,
    DocumentsModule,
    AuthModule,
    OffersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('--- Database Config Debug ---');
    console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
    console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
    console.log('----------------------------');
  }
}
