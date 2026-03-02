import { IsOptional, IsString, IsDateString, MaxLength, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsDateString()
  startsAt: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  venue: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
