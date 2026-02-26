import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

class RevealConsentDto {
  @IsBoolean()
  consent: boolean;
}

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List my active matches' })
  getMyMatches(@CurrentUser() user: User) {
    return this.matchesService.getMyMatches(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match detail' })
  getMatch(@CurrentUser() user: User, @Param('id') id: string) {
    return this.matchesService.getMatch(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End/unmatch' })
  endMatch(@CurrentUser() user: User, @Param('id') id: string) {
    return this.matchesService.endMatch(id, user.id);
  }

  @Post(':id/reveal-consent')
  @ApiOperation({ summary: 'Set photo reveal consent (true = agree, false = revoke)' })
  setRevealConsent(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: RevealConsentDto,
  ) {
    return this.matchesService.setRevealConsent(id, user.id, dto.consent);
  }
}
