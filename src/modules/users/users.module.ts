import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './application/users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
})
export class UsersModule {}
