import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsIn, IsString, IsOptional } from 'class-validator';
import { ModerationService } from '../moderation/moderation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

class ReviewReportDto {
  @IsIn(['ban', 'warn', 'dismiss']) action: 'ban' | 'warn' | 'dismiss';
}

class BanUserDto {
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly moderationService: ModerationService,
  ) {}

  @Get('reports')
  @ApiOperation({ summary: 'List pending reports' })
  getPendingReports(@CurrentUser() user: User) {
    this.requireAdmin(user);
    return this.moderationService.getPendingReports();
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Review a report (ban/warn/dismiss)' })
  reviewReport(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
  ) {
    this.requireAdmin(user);
    return this.moderationService.reviewReport(id, user.id, dto.action);
  }

  private requireAdmin(user: User) {
    if (user.role !== 'admin') {
      throw new Error('Admin access required');
    }
  }
}
