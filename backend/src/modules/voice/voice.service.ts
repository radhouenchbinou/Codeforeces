import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Match } from '../matches/entities/match.entity';

// agora-access-token v2
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

@Injectable()
export class VoiceService {
  constructor(
    @InjectRepository(Match) private matchesRepo: Repository<Match>,
    private config: ConfigService,
  ) {}

  async getAgoraToken(matchId: string, userId: string): Promise<{ token: string; channelName: string; uid: number }> {
    const match = await this.matchesRepo.findOne({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('Not your match');
    }
    if (match.status !== 'active') {
      throw new ForbiddenException('Match is no longer active');
    }
    if (!match.voiceCallsUnlocked) {
      const threshold = this.config.get<number>('VOICE_CALL_UNLOCK_THRESHOLD', 10);
      throw new ForbiddenException(`Voice calls unlock after ${threshold} messages`);
    }

    const appId = this.config.get<string>('AGORA_APP_ID');
    const certificate = this.config.get<string>('AGORA_APP_CERTIFICATE');
    const channelName = `match_${matchId}`;

    // Deterministic numeric UID from user UUID (Agora needs uint32)
    const uid = Math.abs(this.hashStringToInt(userId)) % 2147483647;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      certificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expiresAt,
      expiresAt,
    );

    return { token, channelName, uid };
  }

  private hashStringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash;
  }
}
