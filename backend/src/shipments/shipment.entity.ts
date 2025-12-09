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

export enum ShipmentStatus {
  OPEN = 'OPEN',
  OFFERED = 'OFFERED',
  IN_TRANSIT = 'IN_TRANSIT',
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

  @Column('decimal')
  weight_kg: number;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.OPEN,
  })
  status: ShipmentStatus;

  @Column('decimal', { nullable: true })
  price: number;

  @OneToMany(() => Document, (document) => document.shipment)
  documents: Document[];

  @CreateDateColumn()
  created_at: Date;
}
