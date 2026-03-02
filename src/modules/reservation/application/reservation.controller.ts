import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { RESERVATION_QUEUE } from '../../../infrastructure/queue/queue.module';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { ReservationRequest, ReservationResult } from '../domain/reservation-request.interface';

const RESERVE_JOB_WAIT_MS = 15000;
const RESERVE_JOB_POLL_MS = 200;

@Controller('reservations')
@UseGuards(ThrottlerGuard)
export class ReservationController {
  constructor(
    @InjectQueue(RESERVATION_QUEUE)
    private readonly reservationQueue: Queue,
  ) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'ok' };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async reserve(@Body() dto: ReserveSeatDto): Promise<ReservationResult> {
    const request: ReservationRequest = {
      eventId: dto.eventId,
      sessionId: dto.sessionId,
      seatId: dto.seatId,
      userId: dto.userId,
      idempotencyKey: dto.idempotencyKey,
    };
    const job = await this.reservationQueue.add('reserve', request, {
      attempts: 1,
    });
    const result = await this.waitForJobResult(job);
    if (!result) {
      throw new ServiceUnavailableException(
        'Reservation request timed out or queue is busy. Try again later.',
      );
    }
    return result;
  }

  private async waitForJobResult(
    job: Job<ReservationRequest, ReservationResult>,
  ): Promise<ReservationResult | null> {
    const deadline = Date.now() + RESERVE_JOB_WAIT_MS;
    while (Date.now() < deadline) {
      const state = await job.getState();
      if (state === 'completed') {
        const finished = await this.reservationQueue.getJob(job.id!);
        return finished?.returnvalue ?? null;
      }
      if (state === 'failed') {
        return null;
      }
      await new Promise((r) => setTimeout(r, RESERVE_JOB_POLL_MS));
    }
    return null;
  }
}
