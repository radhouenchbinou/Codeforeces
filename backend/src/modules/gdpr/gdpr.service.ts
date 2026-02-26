import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GdprService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async requestDeletion(userId: string, email: string): Promise<object> {
    await this.usersRepo.update(userId, {
      dataDeletionRequested: true,
      dataDeletionAt: new Date(),
      isActive: false,
    });

    // Log gdpr request
    await this.usersRepo.manager.query(
      `INSERT INTO gdpr_requests (user_id, user_email, request_type, status) VALUES ($1, $2, $3, $4)`,
      [userId, email, 'delete', 'pending'],
    );

    // TODO: queue background job to hard-delete all data after 30 days
    // In production: use BullMQ with delay

    return {
      message: 'Deletion request submitted. Your account will be deleted within 30 days. You may cancel by logging in.',
    };
  }

  async exportData(userId: string): Promise<object> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return {};

    const { passwordHash, ...userData } = user;

    const photos = await this.usersRepo.manager.query(
      `SELECT id, cloudinary_id, is_primary, display_order, uploaded_at FROM user_photos WHERE user_id = $1`,
      [userId],
    );

    const matches = await this.usersRepo.manager.query(
      `SELECT id, created_at, status FROM matches WHERE user1_id = $1 OR user2_id = $1`,
      [userId],
    );

    const reports = await this.usersRepo.manager.query(
      `SELECT id, reason, created_at FROM reports WHERE reporter_id = $1`,
      [userId],
    );

    return {
      exportedAt: new Date().toISOString(),
      profile: userData,
      photos,
      matches,
      reports,
      note: 'Message history is stored by Stream Chat and can be requested separately.',
    };
  }

  async updateConsent(userId: string, marketingConsent: boolean): Promise<object> {
    await this.usersRepo.update(userId, { marketingConsent });
    return { marketingConsent };
  }
}
