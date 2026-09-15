import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { User, UserRole } from '../users/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private notificationsGateway: NotificationsGateway,
        private mailService: MailService,
    ) { }

    async create(userId: string, title: string, message: string, type?: string, metadata?: any) {
        const notification = this.notificationsRepository.create({
            userId,
            title,
            message,
            type,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        });

        const saved = await this.notificationsRepository.save(notification);

        // Emit real-time event
        this.notificationsGateway.sendToUser(userId, 'notification', saved);

        // Best-effort email — never let a mail failure break the calling flow
        this.usersRepository
            .findOne({ where: { id: userId } })
            .then((user) => {
                if (!user?.email) return;
                const ctaUrl = process.env.FRONTEND_URL
                    ? `${process.env.FRONTEND_URL}/en/dashboard`
                    : undefined;
                return this.mailService.send(
                    user.email,
                    title,
                    this.mailService.renderNotificationEmail(title, message, ctaUrl ? 'Open Dashboard' : undefined, ctaUrl),
                );
            })
            .catch((err) => console.error('Notification email failed:', err));

        return saved;
    }

    async findAll(userId: string) {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }

    async markAsRead(id: string) {
        await this.notificationsRepository.update(id, { isRead: true });
        return { success: true };
    }

    async markAllAsRead(userId: string) {
        await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
        return { success: true };
    }

    async createForRole(role: string, title: string, message: string, type?: string, metadata?: any) {
        // Emit ephemeral notification first for immediate feedback
        this.notificationsGateway.server.to(`role_${role}`).emit('notification', {
            title,
            message,
            type,
            metadata: metadata,
            createdAt: new Date(),
        });

        // Persist notification for all users in this role
        try {
            const users = await this.usersRepository.find({ where: { role: role as UserRole } });
            if (users.length > 0) {
                const notifications = users.map(user => this.notificationsRepository.create({
                    userId: user.id,
                    title,
                    message,
                    type,
                    metadata: metadata ? JSON.stringify(metadata) : undefined,
                }));
                await this.notificationsRepository.save(notifications);
            }
        } catch (error) {
            console.error('Failed to persist role notifications:', error);
            // Don't throw, as the socket event was already sent
        }
    }
}
