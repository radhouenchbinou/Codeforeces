import { IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActDto {
  @ApiProperty()
  @IsUUID()
  targetId: string;

  @ApiProperty({ enum: ['interested', 'pass'] })
  @IsIn(['interested', 'pass'])
  action: 'interested' | 'pass';
}
