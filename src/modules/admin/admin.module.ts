import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../catalog/domain/event.entity';
import { Seat } from '../catalog/domain/seat.entity';
import { Session } from '../catalog/domain/session.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './application/admin.controller';
import { AdminCatalogService } from './application/admin-catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Session, Seat]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminCatalogService],
})
export class AdminModule {}
