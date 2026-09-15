import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Shipment, ShipmentStatus } from '../shipments/shipment.entity';
import { NotificationsService } from '../notifications/notifications.service';

interface CreateReviewInput {
  shipment_id: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Shipment)
    private shipmentsRepository: Repository<Shipment>,
    private notificationsService: NotificationsService,
  ) {}

  async create(reviewerId: string, input: CreateReviewInput): Promise<Review> {
    const { shipment_id, rating, comment } = input;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5');
    }

    const shipment = await this.shipmentsRepository.findOne({ where: { id: shipment_id } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.shipper_id !== reviewerId) {
      throw new ForbiddenException('Only the shipper who created this shipment can review it');
    }

    if (shipment.status !== ShipmentStatus.DELIVERED) {
      throw new BadRequestException('You can only review a shipment after it has been delivered');
    }

    if (!shipment.carrier_id) {
      throw new BadRequestException('This shipment has no assigned carrier to review');
    }

    const existing = await this.reviewsRepository.findOne({ where: { shipment_id } });
    if (existing) {
      throw new ConflictException('This shipment has already been reviewed');
    }

    const review = this.reviewsRepository.create({
      shipment_id,
      reviewer_id: reviewerId,
      carrier_id: shipment.carrier_id,
      rating,
      comment,
    });
    const saved = await this.reviewsRepository.save(review);

    await this.notificationsService.create(
      shipment.carrier_id,
      'New Review Received',
      `You received a ${rating}-star review for shipment #${shipment_id.slice(0, 8)}`,
      'REVIEW_RECEIVED',
      { reviewId: saved.id, shipmentId: shipment_id },
    );

    return saved;
  }

  async findByShipment(shipmentId: string): Promise<Review | null> {
    return this.reviewsRepository.findOne({ where: { shipment_id: shipmentId } });
  }

  async findByCarrier(carrierId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { carrier_id: carrierId },
      order: { created_at: 'DESC' },
    });
  }

  async getCarrierSummary(carrierId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const { average, count } = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.carrier_id = :carrierId', { carrierId })
      .getRawOne();

    return {
      averageRating: average ? Math.round(parseFloat(average) * 10) / 10 : 0,
      totalReviews: parseInt(count, 10) || 0,
    };
  }
}
