import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { Review } from '../reviews/review.entity';
import { ShipmentsService } from '../shipments/shipments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    private shipmentsService: ShipmentsService,
    private notificationsService: NotificationsService,
  ) {}

  async getStats() {
    const [totalShippers, totalCarriers, totalAdmins] = await Promise.all([
      this.usersRepository.count({ where: { role: UserRole.SHIPPER } }),
      this.usersRepository.count({ where: { role: UserRole.CARRIER } }),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    const statusRows = await this.shipmentsRepository
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status')
      .getRawMany();
    const shipmentsByStatus: Record<string, number> = {};
    let totalShipments = 0;
    for (const row of statusRows) {
      const count = parseInt(row.count, 10);
      shipmentsByStatus[row.status] = count;
      totalShipments += count;
    }

    const delivered = shipmentsByStatus[ShipmentStatus.DELIVERED] || 0;
    const cancelled = shipmentsByStatus[ShipmentStatus.CANCELLED] || 0;
    const finished = delivered + cancelled;
    const deliverySuccessRate = finished > 0 ? Math.round((delivered / finished) * 1000) / 10 : null;

    const avgDeliveryResult = await this.shipmentsRepository
      .createQueryBuilder('s')
      .select('AVG(EXTRACT(EPOCH FROM (s.delivery_time - s.created_at)))', 'avgSeconds')
      .where('s.status = :status', { status: ShipmentStatus.DELIVERED })
      .andWhere('s.delivery_time IS NOT NULL')
      .getRawOne();
    const avgDeliveryHours = avgDeliveryResult?.avgSeconds
      ? Math.round((parseFloat(avgDeliveryResult.avgSeconds) / 3600) * 10) / 10
      : null;

    const revenuePaid = await this.paymentsRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'sum')
      .where('p.status = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const revenuePending = await this.paymentsRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'sum')
      .where('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] })
      .getRawOne();

    const pendingVerifications = await this.usersRepository
      .createQueryBuilder('u')
      .innerJoin('u.carrier', 'c')
      .where('c.verification_status = :status', { status: 'PENDING' })
      .getCount();

    return {
      totalShippers,
      totalCarriers,
      totalAdmins,
      totalShipments,
      shipmentsByStatus,
      deliverySuccessRate,
      avgDeliveryHours,
      totalRevenuePaid: parseFloat(revenuePaid.sum) || 0,
      totalRevenuePending: parseFloat(revenuePending.sum) || 0,
      pendingVerifications,
    };
  }

  async getUsers(role?: UserRole, search?: string, page = 1, limit = 20) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.carrier', 'carrier');

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }
    if (search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.phone ILIKE :search OR carrier.first_name ILIKE :search OR carrier.last_name ILIKE :search OR carrier.company_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();
    const userIds = users.map((u) => u.id);

    let shipmentCounts: Record<string, number> = {};
    let earnings: Record<string, number> = {};
    let ratings: Record<string, { avg: number; count: number }> = {};

    if (userIds.length > 0) {
      const shipperCounts = await this.shipmentsRepository
        .createQueryBuilder('s')
        .select('s.shipper_id', 'id')
        .addSelect('COUNT(*)', 'count')
        .where('s.shipper_id IN (:...userIds)', { userIds })
        .groupBy('s.shipper_id')
        .getRawMany();
      const carrierCounts = await this.shipmentsRepository
        .createQueryBuilder('s')
        .select('s.carrier_id', 'id')
        .addSelect('COUNT(*)', 'count')
        .where('s.carrier_id IN (:...userIds)', { userIds })
        .groupBy('s.carrier_id')
        .getRawMany();
      shipmentCounts = Object.fromEntries(
        [...shipperCounts, ...carrierCounts].map((r) => [r.id, parseInt(r.count, 10)]),
      );

      const earningsRows = await this.paymentsRepository
        .createQueryBuilder('p')
        .select('p.carrier_id', 'id')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'sum')
        .where('p.carrier_id IN (:...userIds)', { userIds })
        .andWhere('p.status = :status', { status: PaymentStatus.PAID })
        .groupBy('p.carrier_id')
        .getRawMany();
      earnings = Object.fromEntries(earningsRows.map((r) => [r.id, parseFloat(r.sum)]));

      const ratingRows = await this.reviewsRepository
        .createQueryBuilder('r')
        .select('r.carrier_id', 'id')
        .addSelect('AVG(r.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('r.carrier_id IN (:...userIds)', { userIds })
        .groupBy('r.carrier_id')
        .getRawMany();
      ratings = Object.fromEntries(
        ratingRows.map((r) => [r.id, { avg: Math.round(parseFloat(r.avg) * 10) / 10, count: parseInt(r.count, 10) }]),
      );
    }

    const enriched = users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      carrier: u.carrier
        ? {
            first_name: u.carrier.first_name,
            last_name: u.carrier.last_name,
            company_name: u.carrier.company_name,
            verification_status: u.carrier.verification_status,
          }
        : null,
      shipmentCount: shipmentCounts[u.id] || 0,
      totalEarned: earnings[u.id] || 0,
      rating: ratings[u.id] || null,
    }));

    return { users: enriched, total, page, limit };
  }

  async setUserActive(id: string, isActive: boolean) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.usersRepository.update(id, { is_active: isActive });

    await this.notificationsService.create(
      id,
      isActive ? 'Account Reactivated' : 'Account Suspended',
      isActive
        ? 'Your account has been reactivated. You can log in again.'
        : 'Your account has been suspended. Contact support for details.',
      isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_SUSPENDED',
    );

    return this.usersRepository.findOne({ where: { id } });
  }

  async getShipments(status?: ShipmentStatus, search?: string, page = 1, limit = 20) {
    const qb = this.shipmentsRepository
      .createQueryBuilder('s')
      .leftJoin('s.shipper', 'shipper')
      .addSelect(['shipper.id', 'shipper.email', 'shipper.phone'])
      .leftJoin('s.carrier', 'carrier')
      .addSelect(['carrier.user_id', 'carrier.first_name', 'carrier.last_name', 'carrier.company_name']);

    if (status) qb.andWhere('s.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(s.pickup_address ILIKE :search OR s.delivery_address ILIKE :search OR shipper.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [shipments, total] = await qb.getManyAndCount();
    return { shipments, total, page, limit };
  }

  async overrideShipmentStatus(id: string, status: ShipmentStatus) {
    return this.shipmentsService.updateStatus(id, status, undefined, 'ADMIN');
  }

  async broadcast(role: 'SHIPPER' | 'CARRIER' | 'ALL', title: string, message: string) {
    if (role === 'ALL') {
      await this.notificationsService.createForRole('SHIPPER', title, message, 'ADMIN_BROADCAST');
      await this.notificationsService.createForRole('CARRIER', title, message, 'ADMIN_BROADCAST');
    } else {
      await this.notificationsService.createForRole(role, title, message, 'ADMIN_BROADCAST');
    }
    return { sent: true };
  }
}
