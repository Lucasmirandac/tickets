import { IsArray, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SeatItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  row: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  number: string;
}

export class CreateSeatsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatItemDto)
  seats: SeatItemDto[];
}
