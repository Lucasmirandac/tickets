import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.module';
import {
  IReservationCacheService,
  ReservationCachePayload,
} from '../domain/reservation-cache.interface';

const CACHE_PREFIX = 'reservation:';

@Injectable()
export class ReservationCacheService implements IReservationCacheService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async set(token: string, payload: ReservationCachePayload, ttlSeconds: number): Promise<void> {
    const key = CACHE_PREFIX + token;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(payload));
  }

  async get(token: string): Promise<ReservationCachePayload | null> {
    const key = CACHE_PREFIX + token;
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ReservationCachePayload;
    } catch {
      return null;
    }
  }

  async delete(token: string): Promise<void> {
    const key = CACHE_PREFIX + token;
    await this.redis.del(key);
  }
}
