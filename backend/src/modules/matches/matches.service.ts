import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { Match } from './entities/match.entity';
import { User } from '../users/entities/user.entity';
import { PhotosService } from '../photos/photos.service';

@Injectable()
export class MatchesService {
  private streamClient: StreamChat;

  constructor(
    @InjectRepository(Match) private matchesRepo: Repository<Match>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private config: ConfigService,
    private photosService: PhotosService,
  ) {
    this.streamClient = StreamChat.getInstance(
      config.get('STREAM_API_KEY'),
      config.get('STREAM_API_SECRET'),
    );
  }

  async createMatch(userAId: string, userBId: string): Promise<Match> {
    // Canonical ordering: user1 < user2
    const [user1Id, user2Id] = [userAId, userBId].sort();

    const existing = await this.matchesRepo.findOne({
      where: { user1Id, user2Id, status: 'active' },
    });
    if (existing) return existing;

    // Create Stream Chat channel
    const channelId = `match_${user1Id.slice(0, 8)}_${user2Id.slice(0, 8)}`;

    // Upsert Stream users
    await this.streamClient.upsertUsers([
      { id: user1Id },
      { id: user2Id },
    ]);

    const channel = this.streamClient.channel('messaging', channelId, {
      members: [user1Id, user2Id],
      created_by_id: user1Id,
    });
    await channel.create();

    const match = await this.matchesRepo.save({
      user1Id,
      user2Id,
      streamChannelId: channelId,
      status: 'active',
    });

    return match;
  }

  async getMyMatches(userId: string): Promise<object[]> {
    const matches = await this.matchesRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user1', 'u1')
      .leftJoinAndSelect('m.user2', 'u2')
      .where('(m.user1_id = :uid OR m.user2_id = :uid)', { uid: userId })
      .andWhere('m.status = :status', { status: 'active' })
      .orderBy('m.created_at', 'DESC')
      .getMany();

    return matches.map((m) => {
      const partner = m.user1Id === userId ? m.user2 : m.user1;
      return {
        id: m.id,
        partner: {
          id: partner.id,
          displayName: partner.displayName,
          age: this.computeAge(partner.birthDate),
          voiceIntroUrl: partner.voiceIntroUrl,
        },
        streamChannelId: m.streamChannelId,
        messageCount: m.messageCount,
        voiceCallsUnlocked: m.voiceCallsUnlocked,
        photosRevealed: m.photosRevealed,
        myRevealConsent: m.user1Id === userId ? m.user1RevealConsent : m.user2RevealConsent,
        partnerRevealConsent: m.user1Id === userId ? m.user2RevealConsent : m.user1RevealConsent,
        createdAt: m.createdAt,
      };
    });
  }

  async getMatch(matchId: string, userId: string): Promise<object> {
    const match = await this.findMatchForUser(matchId, userId);
    const partner = match.user1Id === userId ? match.user2 : match.user1;

    const result: any = {
      id: match.id,
      partner: {
        id: partner.id,
        displayName: partner.displayName,
        age: this.computeAge(partner.birthDate),
        datingIntent: partner.datingIntent,
        bio: partner.bio,
        voiceIntroUrl: partner.voiceIntroUrl,
      },
      streamChannelId: match.streamChannelId,
      messageCount: match.messageCount,
      voiceCallsUnlocked: match.voiceCallsUnlocked,
      photosRevealed: match.photosRevealed,
      myRevealConsent: match.user1Id === userId ? match.user1RevealConsent : match.user2RevealConsent,
      partnerRevealConsent: match.user1Id === userId ? match.user2RevealConsent : match.user1RevealConsent,
      status: match.status,
      createdAt: match.createdAt,
    };

    // Include revealed photos if mutual consent given
    if (match.photosRevealed) {
      result.partnerPhotos = await this.photosService.getRevealedPhotos(userId, partner.id);
    }

    return result;
  }

  async endMatch(matchId: string, userId: string): Promise<void> {
    const match = await this.findMatchForUser(matchId, userId);
    if (match.status === 'ended') {
      throw new BadRequestException('Match already ended');
    }

    await this.matchesRepo.update(matchId, {
      status: 'ended',
      endedAt: new Date(),
      endedBy: userId,
    });
  }

  async setRevealConsent(matchId: string, userId: string, consent: boolean): Promise<object> {
    const match = await this.findMatchForUser(matchId, userId);

    if (match.status !== 'active') {
      throw new BadRequestException('Match is no longer active');
    }

    const isUser1 = match.user1Id === userId;
    const updateData: Partial<Match> = {};

    if (isUser1) {
      updateData.user1RevealConsent = consent;
    } else {
      updateData.user2RevealConsent = consent;
    }

    // Check if cancelling after reveal → end match
    if (!consent && match.photosRevealed) {
      await this.matchesRepo.update(matchId, {
        ...updateData,
        status: 'ended',
        endedAt: new Date(),
        endedBy: userId,
      });
      return { photosRevealed: false, matchEnded: true };
    }

    await this.matchesRepo.update(matchId, updateData);

    // Re-fetch to check mutual consent
    const updated = await this.matchesRepo.findOne({ where: { id: matchId } });
    if (updated.user1RevealConsent && updated.user2RevealConsent && !updated.photosRevealed) {
      await this.matchesRepo.update(matchId, {
        photosRevealed: true,
        revealedAt: new Date(),
      });
      return { photosRevealed: true, matchEnded: false };
    }

    return { photosRevealed: updated.photosRevealed, matchEnded: false };
  }

  async incrementMessageCountByChannelId(channelId: string): Promise<void> {
    const match = await this.matchesRepo.findOne({ where: { streamChannelId: channelId } });
    if (!match) return;
    await this.incrementMessageCount(match.id);
  }

  async incrementMessageCount(matchId: string): Promise<void> {
    await this.matchesRepo
      .createQueryBuilder()
      .update(Match)
      .set({ messageCount: () => 'message_count + 1' })
      .where('id = :id AND status = :status', { id: matchId, status: 'active' })
      .execute();

    const match = await this.matchesRepo.findOne({ where: { id: matchId } });
    if (!match) return;

    const threshold = this.config.get<number>('VOICE_CALL_UNLOCK_THRESHOLD', 10);
    if (!match.voiceCallsUnlocked && match.messageCount >= threshold) {
      await this.matchesRepo.update(matchId, {
        voiceCallsUnlocked: true,
        voiceCallsUnlockedAt: new Date(),
      });
    }
  }

  async findMatchForUser(matchId: string, userId: string): Promise<Match> {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId },
      relations: ['user1', 'user2'],
    });

    if (!match) throw new NotFoundException('Match not found');
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not your match');
    }

    return match;
  }

  getPartnerPhotosIfRevealed(match: Match, requestingUserId: string) {
    if (!match.photosRevealed) return null;
    const partnerId = match.user1Id === requestingUserId ? match.user2Id : match.user1Id;
    return this.photosService.getRevealedPhotos(requestingUserId, partnerId);
  }

  private computeAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
