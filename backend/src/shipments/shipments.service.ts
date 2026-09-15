import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus } from './shipment.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ShippersService } from '../shippers/shippers.service';
import { ShipperVerificationStatus } from '../shippers/shipper.entity';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private notificationsService: NotificationsService,
    private shippersService: ShippersService,
  ) { }

  async create(shipmentData: Partial<Shipment>): Promise<Shipment> {
    const shipperId = shipmentData.shipper_id;
    if (shipperId) {
      const shipperProfile = await this.shippersService.findByUserId(shipperId);
      if (!shipperProfile) {
        throw new BadRequestException(
          'Complete your shipper verification before creating shipments.',
        );
      }
      if (shipperProfile.verification_status !== ShipperVerificationStatus.VERIFIED) {
        throw new ForbiddenException(
          shipperProfile.verification_status === ShipperVerificationStatus.REJECTED
            ? 'Your shipper verification was rejected. Please update and resubmit your details.'
            : 'Your shipper verification is still pending admin approval.',
        );
      }
    }

    const shipment = this.shipmentsRepository.create({
      ...shipmentData,
      timeline: [
        {
          status: ShipmentStatus.OPEN,
          timestamp: new Date().toISOString(),
          description: 'Shipment created',
        },
      ],
    });
    const saved = await this.shipmentsRepository.save(shipment);

    // Notify all carriers
    await this.notificationsService.createForRole(
      'CARRIER',
      'New Shipment Available',
      `From ${saved.pickup_address} to ${saved.delivery_address}`,
      'SHIPMENT_CREATED',
      { shipmentId: saved.id }
    );

    return saved;
  }

  async findAll(
    shipperId?: string,
    excludeCarrierId?: string,
    statuses?: ShipmentStatus[],
  ): Promise<Shipment[]> {
    const query = this.shipmentsRepository.createQueryBuilder('shipment');

    if (shipperId) {
      query.andWhere('shipment.shipper_id = :shipperId', { shipperId });
      query.leftJoinAndSelect('shipment.offers', 'offers');
      query.leftJoinAndSelect('shipment.payment', 'payment');
    }

    if (excludeCarrierId) {
      // Join offers made by this carrier
      query.leftJoin(
        'shipment.offers',
        'offer',
        'offer.carrier_id = :excludeCarrierId',
        { excludeCarrierId },
      );
      // Filter out shipments where such an offer exists (is NOT NULL)
      // Actually we want where offer IS NULL (no match found)
      query.andWhere('offer.id IS NULL');
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('shipment.status IN (:...statuses)', { statuses });
    }

    query.orderBy('shipment.created_at', 'DESC');

    return query.getMany();
  }

  async findAssignedToCarrier(carrierId: string): Promise<Shipment[]> {
    return this.shipmentsRepository.find({
      where: { carrier_id: carrierId },
      relations: ['offers'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Shipment | null> {
    return this.shipmentsRepository.findOne({
      where: { id },
      relations: ['documents', 'payment'],
    });
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
    actorId?: string,
    actorRole?: string,
  ): Promise<Shipment | null> {
    const shipment = await this.findOne(id);
    if (!shipment) throw new NotFoundException('Shipment not found');

    if (actorRole !== 'ADMIN' && actorId && shipment.carrier_id !== actorId) {
      throw new ForbiddenException('Only the assigned carrier can update this shipment\'s status');
    }

    const updateData: Partial<Shipment> = { status };

    if (status === ShipmentStatus.IN_TRANSIT) {
      updateData.pickup_time = new Date();
    } else if (status === ShipmentStatus.DELIVERED) {
      updateData.delivery_time = new Date();
    }

    // Append to timeline
    const newTimelineEntry = {
      status,
      timestamp: new Date().toISOString(),
      description: `Status changed to ${status}`,
    };

    updateData.timeline = [...(shipment.timeline || []), newTimelineEntry];

    await this.shipmentsRepository.update(id, updateData);
    const updated = await this.findOne(id);

    if (updated) {
      await this.notificationsService.create(
        updated.shipper_id,
        'Shipment Update',
        `Your shipment is now ${status}`,
        'SHIPMENT_STATUS_UPDATE',
        { shipmentId: id, status }
      );
    }

    return updated;
  }
  async getDashboardStats(userId: string, role: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let totalShipments = 0;
    let pendingActions = 0;
    let earnings = 0;
    let currentMonthCount = 0;
    let lastMonthCount = 0;

    if (role === 'SHIPPER') {
      // Total Shipments
      totalShipments = await this.shipmentsRepository.count({
        where: { shipper_id: userId },
      });

      // Pending Actions (Open or Offered)
      pendingActions = await this.shipmentsRepository.count({
        where: [
          { shipper_id: userId, status: ShipmentStatus.OPEN },
          { shipper_id: userId, status: ShipmentStatus.OFFERED },
        ],
      });

      // Growth
      currentMonthCount = await this.shipmentsRepository
        .createQueryBuilder('shipment')
        .where('shipment.shipper_id = :userId', { userId })
        .andWhere('shipment.created_at >= :startOfMonth', { startOfMonth })
        .getCount();

      lastMonthCount = await this.shipmentsRepository
        .createQueryBuilder('shipment')
        .where('shipment.shipper_id = :userId', { userId })
        .andWhere('shipment.created_at >= :startOfLastMonth', { startOfLastMonth })
        .andWhere('shipment.created_at <= :endOfLastMonth', { endOfLastMonth })
        .getCount();

    } else if (role === 'CARRIER') {
      // Total Shipments (Assigned)
      totalShipments = await this.shipmentsRepository.count({
        where: { carrier_id: userId, status: ShipmentStatus.DELIVERED },
      });

      // Pending Actions (Assigned but not Delivered/Cancelled)
      pendingActions = await this.shipmentsRepository.count({
        where: [
          { carrier_id: userId, status: ShipmentStatus.ASSIGNED },
          { carrier_id: userId, status: ShipmentStatus.DRIVER_AT_PICKUP },
          { carrier_id: userId, status: ShipmentStatus.LOADING_STARTED },
          { carrier_id: userId, status: ShipmentStatus.LOADING_FINISHED },
          { carrier_id: userId, status: ShipmentStatus.IN_TRANSIT },
          { carrier_id: userId, status: ShipmentStatus.ARRIVED_DELIVERY },
          { carrier_id: userId, status: ShipmentStatus.UNLOADING_FINISHED },
        ],
      });

      // Earnings actually received (paid out via Stripe), not just delivered shipment value
      const earningsResult = await this.paymentsRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'sum')
        .where('payment.carrier_id = :userId', { userId })
        .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
        .getRawOne();

      earnings = parseFloat(earningsResult.sum || '0');

      // Growth (Deliveries this month vs last)
      currentMonthCount = await this.shipmentsRepository
        .createQueryBuilder('shipment')
        .where('shipment.carrier_id = :userId', { userId })
        .andWhere('shipment.status = :status', { status: ShipmentStatus.DELIVERED })
        .andWhere('shipment.delivery_time >= :startOfMonth', { startOfMonth })
        .getCount();

      lastMonthCount = await this.shipmentsRepository
        .createQueryBuilder('shipment')
        .where('shipment.carrier_id = :userId', { userId })
        .andWhere('shipment.status = :status', { status: ShipmentStatus.DELIVERED })
        .andWhere('shipment.delivery_time >= :startOfLastMonth', { startOfLastMonth })
        .andWhere('shipment.delivery_time <= :endOfLastMonth', { endOfLastMonth })
        .getCount();
    }

    // Calculate Percentage Growth
    let growthPercent = 0;
    if (lastMonthCount > 0) {
      growthPercent = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
    } else if (currentMonthCount > 0) {
      growthPercent = 100; // 0 to something is 100% growth effectively (or infinite)
    }

    return {
      totalShipments,
      pendingActions,
      earnings,
      growthPercent: growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`,
    };
  }
}
