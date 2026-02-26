import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class ChatService {
  private streamClient: StreamChat;

  constructor(
    private config: ConfigService,
    private matchesService: MatchesService,
  ) {
    this.streamClient = StreamChat.getInstance(
      config.get('STREAM_API_KEY'),
      config.get('STREAM_API_SECRET'),
    );
  }

  async getStreamToken(userId: string): Promise<{ token: string }> {
    // Upsert user in Stream
    await this.streamClient.upsertUser({ id: userId });
    const token = this.streamClient.createToken(userId);
    return { token };
  }

  async handleWebhook(payload: any): Promise<void> {
    // Stream sends { type, channel_id, message, ... }
    if (payload.type === 'message.new') {
      // Extract match ID from channel_id (format: match_<user1>_<user2>)
      const channelId = payload.channel_id;

      // Find match by Stream channel ID and increment count
      await this.matchesService.incrementMessageCountByChannelId(channelId);
    }
  }
}
