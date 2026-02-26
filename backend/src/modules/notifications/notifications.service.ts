import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private expo: Expo;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {
    this.expo = new Expo();
  }

  async sendToUser(userId: string, notification: { title: string; body: string; data?: object }): Promise<void> {
    const tokens = await this.usersRepo.manager.query(
      `SELECT expo_token FROM notification_tokens WHERE user_id = $1`,
      [userId],
    );

    if (!tokens.length) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t: any) => Expo.isExpoPushToken(t.expo_token))
      .map((t: any) => ({
        to: t.expo_token,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
      }));

    if (!messages.length) return;

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await this.expo.sendPushNotificationsAsync(chunk);
      }
    } catch (err) {
      this.logger.error('Push notification failed', err);
    }
  }

  async registerToken(userId: string, expoToken: string, deviceId?: string): Promise<void> {
    if (!Expo.isExpoPushToken(expoToken)) return;

    await this.usersRepo.manager.query(
      `INSERT INTO notification_tokens (user_id, expo_token, device_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, expo_token) DO NOTHING`,
      [userId, expoToken, deviceId],
    );
  }

  async notifyNewMatch(userId1: string, userId2: string): Promise<void> {
    await Promise.all([
      this.sendToUser(userId1, { title: 'New Match! 🎉', body: "You have a new match. Start chatting with voice messages!" }),
      this.sendToUser(userId2, { title: 'New Match! 🎉', body: "You have a new match. Start chatting with voice messages!" }),
    ]);
  }

  async notifyRevealRequest(userId: string, fromName: string): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Photo Reveal Request',
      body: `${fromName} wants to reveal their photo. Tap to respond.`,
    });
  }

  async notifyVoiceCallsUnlocked(userId1: string, userId2: string): Promise<void> {
    const msg = { title: 'Voice Calls Unlocked! 🔓', body: 'You can now make voice calls with your match.' };
    await Promise.all([
      this.sendToUser(userId1, msg),
      this.sendToUser(userId2, msg),
    ]);
  }
}
