import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { Shipment } from '../shipments/shipment.entity';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  POA = 'POA',
  CMR = 'CMR',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  owner_id: string;

  @ManyToOne(() => Carrier, (carrier) => carrier.documents)
  @JoinColumn({ name: 'owner_id' })
  owner: Carrier;

  @Column({ nullable: true })
  shipment_id: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.documents)
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  type: DocumentType;

  @Column()
  file_url: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
