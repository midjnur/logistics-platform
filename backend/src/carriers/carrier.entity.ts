import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Document } from '../documents/document.entity';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('carriers')
export class Carrier {
  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, (user) => user.carrier)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  tax_id: string;

  @Column()
  passport_number: string;

  @Column({ nullable: true })
  passport_date_of_issue: Date;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verification_status: VerificationStatus;

  // Bank Details
  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_code: string;

  @Column({ nullable: true })
  bank_account: string;

  @Column({ nullable: true })
  currency: string;

  // Address
  @Column({ nullable: true })
  address_line1: string;

  @Column({ nullable: true })
  address_line2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postal_code: string;

  @Column({ nullable: true })
  country: string;

  // Languages (stored as JSON array)
  @Column({ type: 'jsonb', nullable: true })
  languages: string[];

  // Document references
  @Column({ nullable: true })
  driver_license_number: string;

  @Column({ nullable: true })
  id_card_number: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.carrier)
  vehicles: Vehicle[];

  @OneToMany(() => Document, (document) => document.owner)
  documents: Document[];
}
