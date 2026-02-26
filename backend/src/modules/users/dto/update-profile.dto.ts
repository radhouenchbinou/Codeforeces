import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  @ApiProperty({ required: false, example: '1995-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ required: false, enum: ['man', 'woman', 'non_binary', 'other'] })
  @IsOptional()
  @IsIn(['man', 'woman', 'non_binary', 'other'])
  gender?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  seekingGenders?: string[];

  @ApiProperty({ required: false, enum: ['serious', 'casual', 'both'] })
  @IsOptional()
  @IsIn(['serious', 'casual', 'both'])
  datingIntent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  locationLng?: number;
}
