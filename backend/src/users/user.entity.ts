import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { Shipper } from '../shippers/shipper.entity';
import { Shipment } from '../shipments/shipment.entity';
import { Document } from '../documents/document.entity';

export enum UserRole {
  SHIPPER = 'SHIPPER',
  CARRIER = 'CARRIER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  // select:false so this never comes back on a normal query (findById /
  // /auth/me were both leaking the bcrypt hash to the client) — the one
  // place that needs it, findOneWithPassword, explicitly re-selects it.
  @Column({ select: false })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SHIPPER,
  })
  role: UserRole;

  @Column({ default: 'en' })
  language: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true, type: 'varchar', select: false })
  email_verification_token: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Carrier, (carrier) => carrier.user)
  carrier: Carrier;

  @OneToOne(() => Shipper, (shipper) => shipper.user)
  shipper: Shipper;

  @OneToMany(() => Shipment, (shipment) => shipment.shipper)
  shipments: Shipment[];

  @OneToMany(() => Document, (document) => document.owner)
  documents: Document[];
}
