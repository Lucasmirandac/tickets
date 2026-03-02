import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    type: [String],
    description: 'Reservation tokens returned from POST /reservations',
    example: ['uuid-token-1', 'uuid-token-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  reservationTokens: string[];
}
