import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ADMIN_TYPES } from '../../domain/admin-types';
import type { AdminType } from '../../domain/admin-types';


export class CreateAdminDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ enum: ADMIN_TYPES })
  @IsEnum(ADMIN_TYPES)
  adminType: AdminType;
}
