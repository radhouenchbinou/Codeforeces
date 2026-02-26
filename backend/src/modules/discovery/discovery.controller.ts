import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { ActDto } from './dto/act.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('daily')
  @ApiOperation({ summary: "Get today's discovery deck (5-7 text-only profiles)" })
  getDailyDeck(@CurrentUser() user: User) {
    return this.discoveryService.getDailyDeck(user.id);
  }

  @Post('act')
  @ApiOperation({ summary: 'Submit interested or pass action on a profile' })
  act(@CurrentUser() user: User, @Body() dto: ActDto) {
    return this.discoveryService.act(user.id, dto.targetId, dto.action);
  }
}
