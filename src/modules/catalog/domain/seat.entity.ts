import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Session } from './session.entity';

export type SeatStatus = 'available' | 'reserved' | 'sold';

/**
 * Seat entity. A single seat in a session. Uses version for optimistic concurrency control.
 */
@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => Session, (session) => session.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ type: 'varchar', length: 32 })
  row: string;

  @Column({ type: 'varchar', length: 32 })
  number: string;

  @Column({ type: 'varchar', length: 32, default: 'available' })
  status: SeatStatus;

  @Column({ type: 'int', default: 0 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
