import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column({ nullable: true })
    type: string; // e.g., 'SHIPMENT_CREATED', 'OFFER_RECEIVED'

    @Column({ nullable: true })
    metadata: string; // JSON string for related IDs (shipmentId, etc.)

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
