import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Block } from './entities/block.entity';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Report) private reportsRepo: Repository<Report>,
    @InjectRepository(Block) private blocksRepo: Repository<Block>,
    private scoringService: ScoringService,
  ) {}

  async report(reporterId: string, reportedId: string, reason: string, details?: string): Promise<object> {
    if (reporterId === reportedId) {
      throw new ConflictException('Cannot report yourself');
    }

    const report = await this.reportsRepo.save({ reporterId, reportedId, reason, details });

    // Soft score penalty on report received (removed if admin dismisses)
    await this.scoringService.adjustScore(reportedId, -5, 'report_received');

    return { id: report.id, message: 'Report submitted' };
  }

  async block(blockerId: string, blockedId: string): Promise<object> {
    if (blockerId === blockedId) {
      throw new ConflictException('Cannot block yourself');
    }

    const existing = await this.blocksRepo.findOne({
      where: { blockerId, blockedId },
    });
    if (existing) return { message: 'Already blocked' };

    await this.blocksRepo.save({ blockerId, blockedId });
    return { message: 'Blocked' };
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.blocksRepo.delete({ blockerId, blockedId });
  }

  async getBlockedUsers(userId: string): Promise<Block[]> {
    return this.blocksRepo.find({ where: { blockerId: userId } });
  }

  async reviewReport(reportId: string, adminId: string, action: 'ban' | 'warn' | 'dismiss'): Promise<void> {
    const report = await this.reportsRepo.findOne({ where: { id: reportId } });
    if (!report) return;

    await this.reportsRepo.update(reportId, {
      isReviewed: true,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });

    if (action === 'ban') {
      await this.scoringService.adjustScore(report.reportedId, -10, 'report_confirmed');
    } else if (action === 'dismiss') {
      // Revert the soft penalty applied on report received
      await this.scoringService.adjustScore(report.reportedId, 5, 'report_dismissed');
    }
  }

  async getPendingReports(): Promise<Report[]> {
    return this.reportsRepo.find({ where: { isReviewed: false }, order: { createdAt: 'ASC' } });
  }
}
