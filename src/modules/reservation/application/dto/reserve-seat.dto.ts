import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReserveSeatDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  sessionId: string;

  @IsUUID()
  seatId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
