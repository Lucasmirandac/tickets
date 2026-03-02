import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../domain/admin.entity';
import type { AdminType } from '../domain/admin-types';

@Injectable()
export class AdminRepository {
  constructor(
    @InjectRepository(Admin)
    private readonly repo: Repository<Admin>,
  ) {}

  async findByUserId(userId: string): Promise<Admin | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { userId } });
    return count > 0;
  }

  async createForUser(userId: string, adminType: AdminType = 'super_admin'): Promise<Admin> {
    const admin = this.repo.create({ userId, adminType });
    return this.repo.save(admin);
  }
}
