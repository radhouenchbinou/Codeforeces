import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('voice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get('token/:matchId')
  @ApiOperation({ summary: 'Get Agora RTC token for voice call (only if calls unlocked)' })
  getToken(@CurrentUser() user: User, @Param('matchId') matchId: string) {
    return this.voiceService.getAgoraToken(matchId, user.id);
  }
}
