import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from '../domain/seat.entity';
import { ISeatRepository } from '../domain/seat.repository';

/**
 * TypeORM implementation of ISeatRepository.
 * Uses optimistic concurrency (version) for reserve and status updates.
 */
@Injectable()
export class SeatRepository implements ISeatRepository {
  constructor(
    @InjectRepository(Seat)
    private readonly repo: Repository<Seat>,
  ) {}

  async findById(id: string): Promise<Seat | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySessionAndId(sessionId: string, seatId: string): Promise<Seat | null> {
    return this.repo.findOne({
      where: { id: seatId, sessionId },
    });
  }

  async updateStatusToReserved(seatId: string, currentVersion: number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Seat)
      .set({ status: 'reserved', version: currentVersion + 1 })
      .where('id = :seatId', { seatId })
      .andWhere('version = :version', { version: currentVersion })
      .andWhere('status = :status', { status: 'available' })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async updateStatusToAvailable(seatId: string): Promise<void> {
    await this.repo.update(
      { id: seatId },
      { status: 'available' },
    );
  }

  async updateStatusToSold(seatId: string): Promise<void> {
    await this.repo.update(
      { id: seatId },
      { status: 'sold' },
    );
  }
}
