import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PhotosModule } from './modules/photos/photos.module';
import { VerificationModule } from './modules/verification/verification.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ChatModule } from './modules/chat/chat.module';
import { VoiceModule } from './modules/voice/voice.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { GdprModule } from './modules/gdpr/gdpr.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get<boolean>('DB_SSL') ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false, // always use migrations
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    PhotosModule,
    VerificationModule,
    DiscoveryModule,
    MatchesModule,
    ChatModule,
    VoiceModule,
    ScoringModule,
    ModerationModule,
    GdprModule,
    AdminModule,
    NotificationsModule,
  ],
})
export class AppModule {}
