import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';

export enum VehicleType {
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  TRAILER = 'TRAILER',
  SPRINTER = 'SPRINTER',
  REFRIGERATED = 'REFRIGERATED',
  PLATFORM = 'PLATFORM',
  TANKER = 'TANKER',
  CONTAINER = 'CONTAINER',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  carrier_id: string;

  @ManyToOne(() => Carrier, (carrier) => carrier.vehicles)
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @Column()
  plate_number: string;

  @Column('decimal')
  capacity_kg: number;

  @Column('decimal')
  volume_m3: number;

  @Column('decimal', { nullable: true })
  length_m: number;

  @Column('decimal', { nullable: true })
  width_m: number;

  @Column('decimal', { nullable: true })
  height_m: number;

  @Column({ default: false })
  is_refrigerated: boolean;

  @Column({ nullable: true })
  adr_class: string;

  @Column('jsonb', { nullable: true })
  features: string[];
}
