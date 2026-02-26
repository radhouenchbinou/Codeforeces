import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UserPhoto } from './entities/user-photo.entity';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(UserPhoto) private photosRepo: Repository<UserPhoto>,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadPhoto(userId: string, file: Express.Multer.File): Promise<UserPhoto> {
    const count = await this.photosRepo.count({ where: { userId } });
    if (count >= 6) {
      throw new BadRequestException('Maximum 6 photos allowed');
    }

    // Upload to Cloudinary as "authenticated" (private)
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `voicefirst/photos/${userId}`,
          type: 'authenticated', // private, requires signed URL to access
          resource_type: 'image',
          tags: [`user_${userId}`],
          transformation: [
            { width: 1080, height: 1080, crop: 'limit', quality: 'auto:good' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });

    const isPrimary = count === 0;
    const photo = await this.photosRepo.save({
      userId,
      cloudinaryId: result.public_id,
      isPrimary,
      displayOrder: count,
    });

    return photo;
  }

  async getMyPhotos(userId: string): Promise<Array<{ id: string; isPrimary: boolean; signedUrl: string }>> {
    const photos = await this.photosRepo.find({
      where: { userId },
      order: { displayOrder: 'ASC' },
    });

    return photos.map((p) => ({
      id: p.id,
      isPrimary: p.isPrimary,
      displayOrder: p.displayOrder,
      signedUrl: this.generateSignedUrl(p.cloudinaryId),
    }));
  }

  async getRevealedPhotos(userId: string, matchUserId: string): Promise<Array<{ signedUrl: string }>> {
    // Only called after match reveal check passes in MatchesService
    const photos = await this.photosRepo.find({
      where: { userId: matchUserId },
      order: { displayOrder: 'ASC' },
    });

    return photos.map((p) => ({
      signedUrl: this.generateSignedUrl(p.cloudinaryId, 3600), // 1 hour
    }));
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.photosRepo.findOne({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.userId !== userId) throw new ForbiddenException();

    await cloudinary.uploader.destroy(photo.cloudinaryId, { type: 'authenticated' });
    await this.photosRepo.delete(photoId);

    // If deleted was primary, promote next photo
    if (photo.isPrimary) {
      const next = await this.photosRepo.findOne({ where: { userId }, order: { displayOrder: 'ASC' } });
      if (next) await this.photosRepo.update(next.id, { isPrimary: true });
    }
  }

  async uploadVoiceIntro(userId: string, file: Express.Multer.File): Promise<{ url: string; duration: number }> {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `voicefirst/voice/${userId}`,
          type: 'authenticated',
          resource_type: 'video', // Cloudinary uses 'video' for audio files
          tags: [`user_${userId}`, 'voice_intro'],
          transformation: [{ audio_codec: 'aac', bit_rate: '64k' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });

    const signedUrl = cloudinary.url(result.public_id, {
      resource_type: 'video',
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });

    return {
      url: signedUrl,
      duration: Math.round(result.duration || 0),
    };
  }

  generateSignedUrl(cloudinaryId: string, ttlSeconds = 900): string {
    return cloudinary.url(cloudinaryId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    });
  }

  async hasAtLeastOnePhoto(userId: string): Promise<boolean> {
    const count = await this.photosRepo.count({ where: { userId } });
    return count > 0;
  }
}
