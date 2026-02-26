import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('discovery_queue')
export class DiscoveryQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'viewer_id' })
  viewerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewer_id' })
  viewer: User;

  @Column({ name: 'target_id' })
  targetId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target: User;

  @Column({ type: 'enum', enum: ['interested', 'pass'], nullable: true })
  action: string;

  @Column({ name: 'rank_score', type: 'decimal', precision: 6, scale: 2, default: 0 })
  rankScore: number;

  @Column({ name: 'queue_date', type: 'date' })
  queueDate: string;

  @Column({ name: 'acted_at', type: 'timestamptz', nullable: true })
  actedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
