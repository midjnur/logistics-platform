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

  // -- Truck Details --
  @Column({ nullable: true })
  vin_number: string;

  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  production_year: number;

  @Column({ nullable: true })
  country_code: string;

  // -- Classification / Permissions --
  @Column({ default: false })
  has_tir: boolean;

  @Column({ default: false })
  has_cmr: boolean;

  @Column({ default: false })
  has_waybill: boolean; // "willBill" from requirements

  @Column({ nullable: true })
  loading_type: string; // e.g. Side, Back, Top

  @Column({ nullable: true })
  emission_class: string; // e.g. EUR6

  // -- Trailer Details --
  @Column({ nullable: true })
  trailer_plate_number: string;

  @Column({ nullable: true })
  trailer_production_date: string;

  @Column({ nullable: true })
  trailer_make: string;

  @Column({ nullable: true })
  trailer_model: string;

  @Column({ nullable: true })
  trailer_vin_number: string;

  @Column({ default: false })
  cargo_fixing_tools: boolean; // Straps etc.

  // -- Documents (URLs) --
  @Column('jsonb', { nullable: true })
  photos: string[];

  @Column({ nullable: true })
  insurance_policy: string;

  @Column({ nullable: true })
  poa: string;

  @Column({ nullable: true })
  truck_id_doc: string;

  @Column({ nullable: true })
  trailer_id_doc: string;
}
