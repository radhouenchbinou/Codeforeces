import { Controller, Post, Get, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { GdprService } from './gdpr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

class ConsentUpdateDto {
  @IsBoolean()
  marketingConsent: boolean;
}

@ApiTags('gdpr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Post('delete-account')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request account deletion (GDPR right to erasure)' })
  deleteAccount(@CurrentUser() user: User) {
    return this.gdprService.requestDeletion(user.id, user.email);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export all personal data (GDPR right to portability)' })
  exportData(@CurrentUser() user: User) {
    return this.gdprService.exportData(user.id);
  }

  @Patch('consent')
  @ApiOperation({ summary: 'Update marketing consent' })
  updateConsent(@CurrentUser() user: User, @Body() dto: ConsentUpdateDto) {
    return this.gdprService.updateConsent(user.id, dto.marketingConsent);
  }
}
