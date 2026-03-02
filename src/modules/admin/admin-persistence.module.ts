import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './domain/admin.entity';
import { AdminRepository } from './infrastructure/admin.repository';

/**
 * Exposes Admin entity and AdminRepository for use by AuthModule (role resolution, seed)
 * and AdminModule. Kept separate to avoid circular dependency with AuthModule.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  providers: [AdminRepository],
  exports: [AdminRepository],
})
export class AdminPersistenceModule {}
