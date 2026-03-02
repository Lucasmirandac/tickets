import { IsOptional, IsString, IsDateString, MaxLength, MinLength } from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  venue?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
