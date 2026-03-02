import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/domain/user.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './application/users.controller';
import { UsersService } from './application/users.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
