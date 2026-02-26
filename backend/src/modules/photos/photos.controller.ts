import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return cb(new Error('Only image files allowed'), false);
  }
  cb(null, true);
};

const audioFilter = (req, file, cb) => {
  if (!file.mimetype.match(/\/(mp4|m4a|aac|mpeg|ogg|wav|webm)$/)) {
    return cb(new Error('Only audio files allowed'), false);
  }
  cb(null, true);
};

@ApiTags('photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a photo (private, hidden by default)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadPhoto(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.photosService.uploadPhoto(user.id, file);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my photos with signed URLs (short-lived)' })
  getMyPhotos(@CurrentUser() user: User) {
    return this.photosService.getMyPhotos(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of my photos' })
  deletePhoto(@CurrentUser() user: User, @Param('id') id: string) {
    return this.photosService.deletePhoto(user.id, id);
  }

  @Post('voice-intro')
  @ApiOperation({ summary: 'Upload voice intro audio' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: audioFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadVoiceIntro(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.photosService.uploadVoiceIntro(user.id, file);
  }
}
