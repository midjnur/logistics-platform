import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shipment } from '../shipments/shipment.entity';
import { Carrier } from '../carriers/carrier.entity';

export enum OfferStatus {
  PENDING = 'PENDING',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

export enum CounterParty {
  SHIPPER = 'SHIPPER',
  CARRIER = 'CARRIER',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shipment_id: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column()
  carrier_id: string;

  @ManyToOne(() => Carrier)
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @Column('decimal')
  offered_price: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;

  @Column('decimal', { nullable: true })
  counter_price: number;

  @Column({ type: 'text', nullable: true })
  counter_message: string;

  @Column({ type: 'enum', enum: CounterParty, nullable: true })
  countered_by: CounterParty;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
