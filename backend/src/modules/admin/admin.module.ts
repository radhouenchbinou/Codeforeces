import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [ModerationModule],
  controllers: [AdminController],
})
export class AdminModule {}
