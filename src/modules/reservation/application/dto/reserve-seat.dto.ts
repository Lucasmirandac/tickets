import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ReserveSeatDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  sessionId: string;

  @IsUUID()
  seatId: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
