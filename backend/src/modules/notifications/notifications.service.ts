import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    if (admin.apps.length) return;

    const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
  }

  async sendToUser(userId: string, notification: { title: string; body: string; data?: Record<string, string> }): Promise<void> {
    if (!admin.apps.length) return;

    const rows: { fcm_token: string }[] = await this.usersRepo.manager.query(
      `SELECT fcm_token FROM notification_tokens WHERE user_id = $1`,
      [userId],
    );
    if (!rows.length) return;

    const messaging = admin.messaging();

    await Promise.all(
      rows.map((r) =>
        messaging
          .send({
            token: r.fcm_token,
            notification: { title: notification.title, body: notification.body },
            data: notification.data ?? {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          })
          .catch((err) =>
            this.logger.warn(`FCM send failed (token …${r.fcm_token.slice(-6)}): ${err.message}`),
          ),
      ),
    );
  }

  async registerToken(userId: string, fcmToken: string, deviceId?: string): Promise<void> {
    await this.usersRepo.manager.query(
      `INSERT INTO notification_tokens (user_id, fcm_token, device_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, fcm_token) DO NOTHING`,
      [userId, fcmToken, deviceId ?? null],
    );
  }

  async notifyNewMatch(userId1: string, userId2: string): Promise<void> {
    const payload = { title: 'New Match! 🎉', body: "You have a new match. Start chatting with voice messages!" };
    await Promise.all([
      this.sendToUser(userId1, payload),
      this.sendToUser(userId2, payload),
    ]);
  }

  async notifyRevealRequest(userId: string, fromName: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Photo Reveal Request',
      body: `${fromName} wants to reveal their photo. Tap to respond.`,
    });
  }

  async notifyVoiceCallsUnlocked(userId1: string, userId2: string): Promise<void> {
    const payload = { title: 'Voice Calls Unlocked! 🔓', body: 'You can now make voice calls with your match.' };
    await Promise.all([
      this.sendToUser(userId1, payload),
      this.sendToUser(userId2, payload),
    ]);
  }
}
