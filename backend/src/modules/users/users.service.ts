import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getMe(userId: string): Promise<Partial<User>> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getPublicProfile(targetId: string): Promise<object> {
    const user = await this.usersRepo.findOne({ where: { id: targetId, isActive: true, isBanned: false } });
    if (!user) throw new NotFoundException('Profile not found');

    // Return text-only profile — no photos
    return {
      id: user.id,
      displayName: user.displayName,
      age: this.computeAge(user.birthDate),
      gender: user.gender,
      datingIntent: user.datingIntent,
      bio: user.bio,
      locationCity: user.locationCity,
      voiceIntroUrl: user.voiceIntroUrl,
      voiceIntroDuration: user.voiceIntroDuration,
      profileCompleteness: user.profileCompleteness,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.birthDate) {
      const age = this.computeAge(dto.birthDate);
      if (age < 18) {
        throw new BadRequestException('You must be at least 18 years old');
      }
    }

    Object.assign(user, dto);
    user.profileCompleteness = this.computeCompleteness(user);
    await this.usersRepo.save(user);

    const { passwordHash, ...safe } = user;
    return safe;
  }

  async updateVoiceIntro(userId: string, voiceIntroUrl: string, duration: number) {
    await this.usersRepo.update(userId, {
      voiceIntroUrl,
      voiceIntroDuration: duration,
    });
    return { voiceIntroUrl, duration };
  }

  async updateLastActive(userId: string) {
    await this.usersRepo.update(userId, { lastActiveAt: new Date() });
  }

  computeCompleteness(user: User): number {
    let score = 0;
    if (user.displayName) score += 10;
    if (user.birthDate) score += 10;
    if (user.gender) score += 5;
    if (user.datingIntent) score += 10;
    if (user.bio && user.bio.length > 20) score += 15;
    if (user.locationCity) score += 10;
    if (user.voiceIntroUrl) score += 25;
    if (user.isEmailVerified) score += 5;
    if (user.seekingGenders && user.seekingGenders.length > 0) score += 10;
    return Math.min(100, score);
  }

  computeAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
