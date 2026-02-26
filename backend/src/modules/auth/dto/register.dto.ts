import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  gdprConsent: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  marketingConsent: boolean = false;

  @ApiProperty({ example: '1.0' })
  @IsString()
  @IsNotEmpty()
  gdprConsentVersion: string;
}
