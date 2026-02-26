import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryQueueProcessor } from './discovery-queue.processor';
import { DiscoveryModule } from '../modules/discovery/discovery.module';
import { User } from '../modules/users/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'discovery-deck' },
      { name: 'notifications' },
      { name: 'gdpr-deletion' },
    ),
    TypeOrmModule.forFeature([User]),
    DiscoveryModule,
  ],
  providers: [DiscoveryQueueProcessor],
  exports: [BullModule],
})
export class JobsModule {}
