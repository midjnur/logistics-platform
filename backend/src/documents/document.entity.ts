import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Shipment } from '../shipments/shipment.entity';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  LICENSE = 'LICENSE',
  INSURANCE = 'INSURANCE',
  POA = 'POA',
  CMR = 'CMR',
  INVOICE = 'INVOICE',
  PACKING_LIST = 'PACKING_LIST',
  EXPORT_DECLARATION = 'EXPORT_DECLARATION',
  CERTIFICATE_OF_ORIGIN = 'CERTIFICATE_OF_ORIGIN',
  ID_CARD = 'ID_CARD',
  PHOTO = 'PHOTO',
  COMPANY_REGISTRY = 'COMPANY_REGISTRY',
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

  // Owner is any User (shipper or carrier) — was Carrier-only, which is
  // exactly why shipper document uploads used to fail with a foreign-key
  // violation: shippers have no row in the carriers table at all.
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

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
