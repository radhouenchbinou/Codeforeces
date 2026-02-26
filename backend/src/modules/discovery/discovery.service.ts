import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DiscoveryQueue } from './entities/discovery-queue.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(DiscoveryQueue) private queueRepo: Repository<DiscoveryQueue>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private dataSource: DataSource,
    private config: ConfigService,
    private usersService: UsersService,
  ) {}

  async getDailyDeck(userId: string): Promise<object[]> {
    const today = new Date().toISOString().split('T')[0];

    // Check if deck already generated for today
    const existing = await this.queueRepo.find({
      where: { viewerId: userId, queueDate: today },
      order: { rankScore: 'DESC' },
    });

    if (existing.length > 0) {
      return this.formatDeckItems(existing);
    }

    // Generate deck on-demand (normally done by background job)
    await this.generateDeckForUser(userId, today);

    const deck = await this.queueRepo.find({
      where: { viewerId: userId, queueDate: today },
      order: { rankScore: 'DESC' },
    });

    return this.formatDeckItems(deck);
  }

  async act(actorId: string, targetId: string, action: 'interested' | 'pass'): Promise<object> {
    const today = new Date().toISOString().split('T')[0];

    const item = await this.queueRepo.findOne({
      where: { viewerId: actorId, targetId, queueDate: today },
    });

    if (!item) {
      throw new BadRequestException('Target not in your daily deck');
    }

    if (item.action) {
      throw new BadRequestException('Already acted on this profile today');
    }

    await this.queueRepo.update(item.id, {
      action,
      actedAt: new Date(),
    });

    // Check for mutual interest (match trigger)
    if (action === 'interested') {
      const reciprocal = await this.queueRepo.findOne({
        where: { viewerId: targetId, targetId: actorId, action: 'interested' },
      });

      if (reciprocal) {
        return { action, matched: true, targetId };
      }
    }

    return { action, matched: false };
  }

  async generateDeckForUser(viewerId: string, date: string): Promise<void> {
    const viewer = await this.usersRepo.findOne({ where: { id: viewerId } });
    if (!viewer) return;

    const deckSize = this.config.get<number>('DAILY_DECK_SIZE', 7);
    const viewerAge = this.usersService.computeAge(viewer.birthDate);

    // Raw SQL for performance — FinalRank = 0.6 * CompatScore + 0.4 * VisibilityScore
    const candidates = await this.dataSource.query(
      `
      SELECT
        u.id,
        u.display_name,
        u.birth_date,
        u.gender,
        u.dating_intent,
        u.bio,
        u.location_city,
        u.voice_intro_url,
        u.visibility_score,
        (
          -- Intent compatibility (0-40)
          CASE
            WHEN u.dating_intent = $3 THEN 40
            WHEN $3 = 'both' OR u.dating_intent = 'both' THEN 20
            ELSE 0
          END
          +
          -- Age proximity (0-30): penalty for each year difference, max -30
          GREATEST(0, 30 - ABS(
            DATE_PART('year', AGE(u.birth_date::date)) - $4
          ))
          +
          -- Distance (0-30): simplified; full PostGIS not required for MVP
          CASE
            WHEN u.location_city = $5 AND u.location_city IS NOT NULL THEN 30
            WHEN u.location_city IS NOT NULL AND $5 IS NOT NULL THEN 10
            ELSE 5
          END
        ) AS compat_score,
        (
          0.6 * (
            CASE WHEN u.dating_intent = $3 THEN 40
                 WHEN $3 = 'both' OR u.dating_intent = 'both' THEN 20
                 ELSE 0 END
            + GREATEST(0, 30 - ABS(DATE_PART('year', AGE(u.birth_date::date)) - $4))
            + CASE WHEN u.location_city = $5 AND u.location_city IS NOT NULL THEN 30
                   WHEN u.location_city IS NOT NULL AND $5 IS NOT NULL THEN 10
                   ELSE 5 END
          ) + 0.4 * u.visibility_score
        ) AS final_rank
      FROM users u
      WHERE
        u.id != $1
        AND u.is_active = TRUE
        AND u.is_banned = FALSE
        AND u.data_deletion_requested = FALSE
        AND u.display_name IS NOT NULL
        AND u.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(u.birth_date::date)) >= 18
        -- Exclude already seen in last 30 days
        AND u.id NOT IN (
          SELECT target_id FROM discovery_queue
          WHERE viewer_id = $1
          AND queue_date > CURRENT_DATE - INTERVAL '30 days'
        )
        -- Exclude blocked / blocking
        AND u.id NOT IN (
          SELECT blocked_id FROM blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM blocks WHERE blocked_id = $1
        )
        -- Exclude existing active matches
        AND u.id NOT IN (
          SELECT CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END
          FROM matches
          WHERE (user1_id = $1 OR user2_id = $1) AND status = 'active'
        )
      ORDER BY final_rank DESC
      LIMIT $2
      `,
      [viewerId, deckSize, viewer.datingIntent || 'both', viewerAge, viewer.locationCity],
    );

    if (candidates.length === 0) return;

    // Insert into discovery_queue
    const rows = candidates.map((c: any) => ({
      viewerId,
      targetId: c.id,
      rankScore: parseFloat(c.final_rank),
      queueDate: date,
    }));

    await this.queueRepo
      .createQueryBuilder()
      .insert()
      .into(DiscoveryQueue)
      .values(rows)
      .orIgnore() // skip if already exists (duplicate date)
      .execute();
  }

  private async formatDeckItems(items: DiscoveryQueue[]): Promise<object[]> {
    const unanswered = items.filter((i) => !i.action);

    const targetIds = unanswered.map((i) => i.targetId);
    if (targetIds.length === 0) return [];

    const users = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.id IN (:...ids)', { ids: targetIds })
      .getMany();

    const userMap = new Map(users.map((u) => [u.id, u]));

    return unanswered.map((item) => {
      const u = userMap.get(item.targetId);
      if (!u) return null;
      return {
        queueItemId: item.id,
        userId: u.id,
        displayName: u.displayName,
        age: this.usersService.computeAge(u.birthDate),
        gender: u.gender,
        datingIntent: u.datingIntent,
        bio: u.bio,
        locationCity: u.locationCity,
        voiceIntroUrl: u.voiceIntroUrl,
        voiceIntroDuration: u.voiceIntroDuration,
      };
    }).filter(Boolean);
  }
}
