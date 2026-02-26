import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 320 })
  email: string;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'display_name', nullable: true, length: 60 })
  displayName: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string;

  @Column({ type: 'enum', enum: ['man', 'woman', 'non_binary', 'other'], nullable: true })
  gender: string;

  @Column({ name: 'seeking_genders', type: 'simple-array', default: '' })
  seekingGenders: string[];

  @Column({ name: 'dating_intent', type: 'enum', enum: ['serious', 'casual', 'both'], nullable: true })
  datingIntent: string;

  @Column({ nullable: true, length: 500 })
  bio: string;

  @Column({ name: 'location_city', nullable: true, length: 100 })
  locationCity: string;

  @Column({ name: 'location_lat', type: 'decimal', precision: 9, scale: 6, nullable: true })
  locationLat: number;

  @Column({ name: 'location_lng', type: 'decimal', precision: 9, scale: 6, nullable: true })
  locationLng: number;

  @Column({ name: 'voice_intro_url', nullable: true })
  voiceIntroUrl: string;

  @Column({ name: 'voice_intro_duration', type: 'smallint', nullable: true })
  voiceIntroDuration: number;

  @Column({ name: 'visibility_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  visibilityScore: number;

  @Column({ name: 'profile_completeness', type: 'decimal', precision: 5, scale: 2, default: 0 })
  profileCompleteness: number;

  @Column({ name: 'gdpr_consent_at', type: 'timestamptz' })
  gdprConsentAt: Date;

  @Column({ name: 'gdpr_consent_version', default: '1.0' })
  gdprConsentVersion: string;

  @Column({ name: 'marketing_consent', default: false })
  marketingConsent: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @Column({ name: 'banned_at', type: 'timestamptz', nullable: true })
  bannedAt: Date;

  @Column({ name: 'banned_reason', nullable: true })
  bannedReason: string;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt: Date;

  @Column({ name: 'data_deletion_requested', default: false })
  dataDeletionRequested: boolean;

  @Column({ name: 'data_deletion_at', type: 'timestamptz', nullable: true })
  dataDeletionAt: Date;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
