import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsUUID, IsIn, IsOptional, IsString } from 'class-validator';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

class ReportDto {
  @IsUUID() targetId: string;
  @IsIn(['spam', 'fake_profile', 'harassment', 'inappropriate_content', 'other']) reason: string;
  @IsOptional() @IsString() details?: string;
}

class BlockDto {
  @IsUUID() targetId: string;
}

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report a user' })
  report(@CurrentUser() user: User, @Body() dto: ReportDto) {
    return this.moderationService.report(user.id, dto.targetId, dto.reason, dto.details);
  }

  @Post('block')
  @ApiOperation({ summary: 'Block a user' })
  block(@CurrentUser() user: User, @Body() dto: BlockDto) {
    return this.moderationService.block(user.id, dto.targetId);
  }

  @Delete('block/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(@CurrentUser() user: User, @Param('userId') blockedId: string) {
    return this.moderationService.unblock(user.id, blockedId);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'List blocked users' })
  getBlocked(@CurrentUser() user: User) {
    return this.moderationService.getBlockedUsers(user.id);
  }
}
