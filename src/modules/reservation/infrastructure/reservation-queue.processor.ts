import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { RESERVATION_QUEUE } from '../../../infrastructure/queue/queue.module';
import { ReservationRequest, ReservationResult } from '../domain/reservation-request.interface';
import { ReservationService } from '../application/reservation.service';

interface ReservationJobData extends ReservationRequest {}

@Injectable()
@Processor(RESERVATION_QUEUE)
export class ReservationQueueProcessor extends WorkerHost {
  constructor(private readonly reservationService: ReservationService) {
    super();
  }

  async process(job: Job<ReservationJobData>): Promise<ReservationResult> {
    return this.reservationService.reserve(job.data);
  }
}
