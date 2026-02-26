import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Column({ name: 'reported_id' })
  reportedId: string;

  @Column({ type: 'enum', enum: ['spam', 'fake_profile', 'harassment', 'inappropriate_content', 'other'] })
  reason: string;

  @Column({ nullable: true })
  details: string;

  @Column({ name: 'is_reviewed', default: false })
  isReviewed: boolean;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
