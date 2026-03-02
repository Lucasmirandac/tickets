import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';
import { Repository } from 'typeorm';
import {
  CreateReservationData,
  IReservationRepository,
} from '../domain/reservation.repository';
import { Reservation, ReservationStatus } from '../domain/reservation.entity';

@Injectable()
export class ReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly repo: Repository<Reservation>,
  ) {}

  async create(data: CreateReservationData): Promise<Reservation> {
    const entity = this.repo.create({
      seatId: data.seatId,
      sessionId: data.sessionId,
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      status: 'active',
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<Reservation | null> {
    return this.repo.findOne({ where: { token } });
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<void> {
    await this.repo.update({ id }, { status });
  }

  async findActiveByExpiresAtBefore(before: Date): Promise<Reservation[]> {
    return this.repo.find({
      where: { status: 'active', expiresAt: LessThan(before) },
    });
  }
}
