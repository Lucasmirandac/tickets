import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { AdminType } from './admin-types';

/**
 * Admin entity. Represents a user who has admin privileges.
 * Separate from User; links to User via user_id. adminType defines which actions the admin can perform.
 */
@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'admin_type', type: 'varchar', length: 32, default: 'super_admin' })
  adminType: AdminType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
