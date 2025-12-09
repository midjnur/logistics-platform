import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { Shipment } from '../shipments/shipment.entity';

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

  @Column()
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

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Carrier, (carrier) => carrier.user)
  carrier: Carrier;

  @OneToMany(() => Shipment, (shipment) => shipment.shipper)
  shipments: Shipment[];
}
