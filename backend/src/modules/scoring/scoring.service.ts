import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private usersService: UsersService,
  ) {}

  async recalculate(userId: string): Promise<number> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return 0;

    // 1. Profile completeness (0–50 points)
    const completeness = this.usersService.computeCompleteness(user);
    const completenessScore = completeness * 0.5;

    // 2. Verification bonus (0–15)
    // Check via photo_verifications table — simplified here by checking profile
    const verificationBonus = 0; // Will be updated by VerificationService

    // 3. Behavior adjustments applied separately via visibility_score_log
    // Base behavior score starts at 35
    const behaviorScore = 35;

    const raw = completenessScore + behaviorScore + verificationBonus;
    const newScore = Math.min(100, Math.max(0, raw));

    await this.usersRepo.update(userId, {
      visibilityScore: newScore,
      profileCompleteness: completeness,
    });

    return newScore;
  }

  async adjustScore(userId: string, delta: number, reason: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const newScore = Math.min(100, Math.max(0, Number(user.visibilityScore) + delta));
    await this.usersRepo.update(userId, { visibilityScore: newScore });

    // Log to visibility_score_log via raw query (no entity needed for append-only log)
    await this.usersRepo.manager.query(
      `INSERT INTO visibility_score_log (user_id, old_score, new_score, reason) VALUES ($1, $2, $3, $4)`,
      [userId, user.visibilityScore, newScore, reason],
    );
  }
}
