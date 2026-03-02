import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReserveSeatDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  seatId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
