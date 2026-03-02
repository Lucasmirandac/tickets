import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.module';


interface HealthStatusResponse {
  status: 'ok' | 'unhealthy' | 'ready';
  reason?: string;
}

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) { }

  @Get('/')
  getLiveness(): HealthStatusResponse {
    return { status: 'ok' };
  }

  @Get('/health/ready')
  async getReadiness(): Promise<HealthStatusResponse> {
    const checks: Promise<void>[] = [];
    checks.push(this.checkDatabase());
    checks.push(this.checkRedis());
    try {
      await Promise.all(checks);
      return { status: 'ready' };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        reason: (err as Error).message,
      });
    }
  }

  private async checkDatabase(): Promise<void> {
    await this.dataSource.query('SELECT 1');
  }

  private async checkRedis(): Promise<void> {
    const result = await this.redisClient.ping();
    if (result !== 'PONG') {
      throw new Error('Redis did not respond with PONG');
    }
  }
}

