import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ShipperEntityType {
  INDIVIDUAL = 'INDIVIDUAL',
  LEGAL_ENTITY = 'LEGAL_ENTITY',
}

export enum ShipperVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('shippers')
export class Shipper {
  @PrimaryColumn('uuid')
  user_id: string;

  @OneToOne(() => User, (user) => user.shipper)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ShipperEntityType })
  entity_type: ShipperEntityType;

  @Column({
    type: 'enum',
    enum: ShipperVerificationStatus,
    default: ShipperVerificationStatus.PENDING,
  })
  verification_status: ShipperVerificationStatus;

  // Shared by both entity types
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_code: string;

  @Column({ nullable: true })
  bank_account: string;

  @Column({ nullable: true })
  currency: string;

  // Individual only
  @Column({ nullable: true })
  personal_number: string;

  @Column({ nullable: true })
  physical_address: string;

  // Legal entity only
  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  company_id: string;

  @Column({ nullable: true })
  director_name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column({ nullable: true })
  operation_field: string;

  @Column({ nullable: true })
  legal_address: string;

  @Column({ nullable: true })
  office_address: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
