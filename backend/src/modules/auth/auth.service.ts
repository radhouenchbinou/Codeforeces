import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokensRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.gdprConsent) {
      throw new BadRequestException('GDPR consent is required');
    }

    const existing = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      gdprConsentAt: new Date(),
      gdprConsentVersion: dto.gdprConsentVersion || this.config.get('GDPR_CONSENT_VERSION'),
      marketingConsent: dto.marketingConsent,
    });

    await this.usersRepo.save(user);

    // TODO: send email verification

    return { message: 'Account created. Please verify your email.' };
  }

  async login(dto: LoginDto, deviceInfo?: string) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBanned) {
      throw new ForbiddenException('Account suspended');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersRepo.update(user.id, { lastActiveAt: new Date() });

    return this.issueTokens(user, deviceInfo);
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepo.findOne({
      where: { tokenHash: hash },
      relations: ['user'],
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate token
    await this.refreshTokensRepo.update(stored.id, { revoked: true });

    return this.issueTokens(stored.user, stored.deviceInfo);
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.refreshTokensRepo.update({ tokenHash: hash }, { revoked: true });
    return { message: 'Logged out' };
  }

  async verifyEmail(token: string) {
    // In production: validate signed email token stored in Redis
    // For MVP: decode JWT-style token with user id
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET') + '_email',
      });
      await this.usersRepo.update(payload.sub, { isEmailVerified: true });
      return { message: 'Email verified' };
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  generateEmailVerificationToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: 'email_verify' },
      {
        secret: this.config.get('JWT_ACCESS_SECRET') + '_email',
        expiresIn: '24h',
      },
    );
  }

  private async issueTokens(user: User, deviceInfo?: string) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const hash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.refreshTokensRepo.save({
      userId: user.id,
      tokenHash: hash,
      deviceInfo,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
