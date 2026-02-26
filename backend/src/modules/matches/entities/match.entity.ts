import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user1_id' })
  user1Id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user1_id' })
  user1: User;

  @Column({ name: 'user2_id' })
  user2Id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user2_id' })
  user2: User;

  @Column({ type: 'enum', enum: ['active', 'ended'], default: 'active' })
  status: string;

  @Column({ name: 'stream_channel_id', nullable: true })
  streamChannelId: string;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ name: 'voice_calls_unlocked', default: false })
  voiceCallsUnlocked: boolean;

  @Column({ name: 'voice_calls_unlocked_at', type: 'timestamptz', nullable: true })
  voiceCallsUnlockedAt: Date;

  @Column({ name: 'user1_reveal_consent', default: false })
  user1RevealConsent: boolean;

  @Column({ name: 'user2_reveal_consent', default: false })
  user2RevealConsent: boolean;

  @Column({ name: 'photos_revealed', default: false })
  photosRevealed: boolean;

  @Column({ name: 'revealed_at', type: 'timestamptz', nullable: true })
  revealedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ name: 'ended_by', nullable: true })
  endedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
