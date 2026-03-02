import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.module';
import { IDistributedLockService } from '../domain/distributed-lock.interface';

const LOCK_PREFIX = 'lock:';

/**
 * Redis-based distributed lock using SET key value NX PX ttl.
 * Token is used to ensure only the holder can release.
 */
@Injectable()
export class DistributedLockService implements IDistributedLockService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const fullKey = LOCK_PREFIX + key;
    const token = randomBytes(16).toString('hex');
    const acquired = await this.redis.set(fullKey, token, 'PX', ttlMs, 'NX');
    return acquired === 'OK' ? token : null;
  }

  async release(key: string, token: string): Promise<boolean> {
    const fullKey = LOCK_PREFIX + key;
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(script, 1, fullKey, token);
    return result === 1;
  }
}
