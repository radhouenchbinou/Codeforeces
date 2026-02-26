import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get my verification status' })
  getStatus(@CurrentUser() user: User) {
    return this.verificationService.getStatus(user.id);
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Start liveness check' })
  initiate(@CurrentUser() user: User) {
    return this.verificationService.initiate(user.id);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Submit liveness check result (internal/webhook)' })
  complete(
    @CurrentUser() user: User,
    @Body('passed') passed: boolean,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.verificationService.complete(user.id, passed, rejectionReason);
  }
}
