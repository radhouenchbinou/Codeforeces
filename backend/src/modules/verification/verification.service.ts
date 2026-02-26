import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotoVerification } from './entities/photo-verification.entity';
import { User } from '../users/entities/user.entity';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(PhotoVerification) private verifRepo: Repository<PhotoVerification>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private scoringService: ScoringService,
  ) {}

  async getStatus(userId: string): Promise<object> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    const latest = await this.verifRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      status: latest?.status || 'not_started',
      verifiedAt: latest?.verifiedAt,
    };
  }

  async initiate(userId: string): Promise<object> {
    // MVP: create a pending verification record
    // In production: integrate Onfido/Veriff/Cloudinary AI liveness check
    const verif = await this.verifRepo.save({ userId, status: 'pending' });
    return {
      verificationId: verif.id,
      message: 'Verification initiated. Upload selfie to complete.',
    };
  }

  async complete(userId: string, passed: boolean, rejectionReason?: string): Promise<object> {
    const verif = await this.verifRepo.findOne({
      where: { userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });

    if (!verif) throw new NotFoundException('No pending verification found');

    const status = passed ? 'verified' : 'rejected';
    await this.verifRepo.update(verif.id, {
      status,
      verifiedAt: passed ? new Date() : undefined,
      rejectionReason: rejectionReason,
    });

    // Update user's visibility score
    if (passed) {
      await this.usersRepo.update(userId, { isEmailVerified: true });
      await this.scoringService.adjustScore(userId, 15, 'photo_verified');
    } else {
      await this.scoringService.adjustScore(userId, -5, 'verification_failed');
    }

    return { status };
  }
}
