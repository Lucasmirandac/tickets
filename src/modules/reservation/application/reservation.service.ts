import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.module';
import { SeatRepository } from '../../catalog/infrastructure/seat.repository';
import { Reservation } from '../domain/reservation.entity';
import {
  ReservationRequest,
  ReservationResult,
} from '../domain/reservation-request.interface';
import { DistributedLockService } from '../infrastructure/distributed-lock.service';
import { EventPublisherService } from '../infrastructure/event-publisher.service';
import { ReservationCacheService } from '../infrastructure/reservation-cache.service';
import { ReservationRepository } from '../infrastructure/reservation.repository';

const IDEMPOTENCY_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL_SECONDS = 86400;

/**
 * Application service for seat reservation with distributed lock and TTL.
 * Prevents overselling via lock + OCC and reserves seat for 10 minutes.
 */
@Injectable()
export class ReservationService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly seatRepository: SeatRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly lockService: DistributedLockService,
    private readonly reservationCache: ReservationCacheService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async reserve(request: ReservationRequest): Promise<ReservationResult> {
    if (request.idempotencyKey) {
      const cached = await this.getIdempotencyResult(request.idempotencyKey);
      if (cached) return cached;
    }
    const lockKey = `reservation:${request.sessionId}:${request.seatId}`;
    const lockTtlMs = this.configService.get<number>('reservation.lockTtlMs', 5000);
    const ttlSeconds = this.configService.get<number>('reservation.ttlSeconds', 600);
    const lockToken = await this.lockService.acquire(lockKey, lockTtlMs);
    if (!lockToken) {
      return { success: false, error: 'Could not acquire lock' };
    }
    try {
      const seat = await this.seatRepository.findBySessionAndId(
        request.sessionId,
        request.seatId,
      );
      if (!seat) {
        return { success: false, error: 'Seat not found' };
      }
      if (seat.status !== 'available') {
        return { success: false, error: 'Seat not available' };
      }
      const reservationToken = uuid();
      await this.reservationCache.set(
        reservationToken,
        {
          seatId: request.seatId,
          userId: request.userId,
          sessionId: request.sessionId,
          reservationId: '', // set after create
        },
        ttlSeconds,
      );
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const reservation = await this.reservationRepository.create({
        seatId: request.seatId,
        sessionId: request.sessionId,
        userId: request.userId,
        token: reservationToken,
        expiresAt,
      });
      const updated = await this.seatRepository.updateStatusToReserved(
        request.seatId,
        seat.version,
      );
      if (!updated) {
        await this.reservationCache.delete(reservationToken);
        return { success: false, error: 'Concurrent update' };
      }
      await this.reservationCache.set(
        reservationToken,
        {
          seatId: request.seatId,
          userId: request.userId,
          sessionId: request.sessionId,
          reservationId: reservation.id,
        },
        ttlSeconds,
      );
      this.eventPublisher.publishSeatReserved({
        reservationId: reservation.id,
        seatId: request.seatId,
        sessionId: request.sessionId,
        userId: request.userId,
        expiresAt,
      });
      const result: ReservationResult = {
        success: true,
        reservationId: reservation.id,
        token: reservationToken,
        expiresAt,
      };
      if (request.idempotencyKey) {
        await this.setIdempotencyResult(request.idempotencyKey, result);
      }
      return result;
    } finally {
      await this.lockService.release(lockKey, lockToken);
    }
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation || reservation.status !== 'active') {
      return false;
    }
    await this.reservationCache.delete(reservation.token);
    await this.reservationRepository.updateStatus(reservationId, 'expired');
    await this.seatRepository.updateStatusToAvailable(reservation.seatId);
    this.eventPublisher.publishReservationExpired({
      reservationId: reservation.id,
      seatId: reservation.seatId,
      sessionId: reservation.sessionId,
    });
    return true;
  }

  async findById(reservationId: string): Promise<Reservation | null> {
    return this.reservationRepository.findById(reservationId);
  }

  /**
   * Returns the reservation if it exists, is active, belongs to the user and is not expired.
   */
  async getActiveReservationByToken(
    token: string,
    userId: string,
  ): Promise<Reservation | null> {
    const reservation = await this.reservationRepository.findByToken(token);
    if (
      !reservation ||
      reservation.userId !== userId ||
      reservation.status !== 'active' ||
      reservation.expiresAt <= new Date()
    ) {
      return null;
    }
    return reservation;
  }

  async confirmReservation(reservationId: string): Promise<boolean> {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation || reservation.status !== 'active') {
      return false;
    }
    await this.reservationCache.delete(reservation.token);
    await this.reservationRepository.updateStatus(reservationId, 'confirmed');
    await this.seatRepository.updateStatusToSold(reservation.seatId);
    return true;
  }

  private async getIdempotencyResult(key: string): Promise<ReservationResult | null> {
    const raw = await this.redis.get(IDEMPOTENCY_PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ReservationResult;
    } catch {
      return null;
    }
  }

  private async setIdempotencyResult(
    key: string,
    result: ReservationResult,
  ): Promise<void> {
    await this.redis.setex(
      IDEMPOTENCY_PREFIX + key,
      IDEMPOTENCY_TTL_SECONDS,
      JSON.stringify(result),
    );
  }
}
