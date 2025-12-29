import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Carrier } from '../carriers/carrier.entity';
import { Document } from '../documents/document.entity';
import { Offer } from '../offers/offer.entity';

export enum ShipmentStatus {
  OPEN = 'OPEN',
  OFFERED = 'OFFERED',
  ASSIGNED = 'ASSIGNED',
  DRIVER_AT_PICKUP = 'DRIVER_AT_PICKUP',
  LOADING_STARTED = 'LOADING_STARTED',
  LOADING_FINISHED = 'LOADING_FINISHED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_DELIVERY = 'ARRIVED_DELIVERY',
  UNLOADING_FINISHED = 'UNLOADING_FINISHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shipper_id: string;

  @ManyToOne(() => User, (user) => user.shipments)
  @JoinColumn({ name: 'shipper_id' })
  shipper: User;

  @Column({ nullable: true })
  carrier_id: string;

  @ManyToOne(() => Carrier)
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @Column('float')
  pickup_lat: number;

  @Column('float')
  pickup_lng: number;

  @Column('text')
  pickup_address: string;

  @Column('timestamp', { nullable: true })
  pickup_time: Date;

  @Column('float')
  delivery_lat: number;

  @Column('float')
  delivery_lng: number;

  @Column('text')
  delivery_address: string;

  @Column('timestamp', { nullable: true })
  delivery_time: Date;

  @Column()
  cargo_type: string;

  @Column({ type: 'int', nullable: true })
  distance: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  weight_kg: number;

  @Column({
    type: 'enum', enum: [
      'OPEN', 'OFFERED', 'ASSIGNED',
      'DRIVER_AT_PICKUP', 'LOADING_STARTED', 'LOADING_FINISHED',
      'IN_TRANSIT', 'ARRIVED_DELIVERY', 'UNLOADING_FINISHED',
      'DELIVERED', 'CANCELLED'
    ], default: 'OPEN'
  })
  status: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  price: number;

  // Dimensions & Cargo
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  internal_length: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  internal_width: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  internal_height: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  cbm: number;

  @Column({ default: false })
  temperature_control: boolean;

  @Column({ nullable: true })
  hs_code: string;

  @Column({ nullable: true })
  loading_type: string;

  // Requirements
  @Column({ default: false })
  has_tir: boolean;

  @Column({ default: false })
  has_cmr: boolean;

  @Column({ default: false })
  has_waybill: boolean;

  @Column({ nullable: true })
  export_declaration: string;

  // Parties
  @Column({ type: 'jsonb', nullable: true })
  shipper_details: any;

  @Column({ type: 'jsonb', nullable: true })
  consignee_details: any;

  // Financials
  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  value_of_goods: number;

  @Column({ nullable: true })
  value_currency: string;

  @Column({ nullable: true })
  payment_terms: string;

  @OneToMany(() => Document, (document) => document.shipment)
  documents: Document[];

  @OneToMany(() => Offer, (offer) => offer.shipment)
  offers: Offer[];

  @Column({ type: 'jsonb', default: [] })
  timeline: { status: string; timestamp: string; description?: string }[];

  @CreateDateColumn()
  created_at: Date;
}
