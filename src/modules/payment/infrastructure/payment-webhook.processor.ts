import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PAYMENT_WEBHOOK_QUEUE } from '../../../infrastructure/queue/queue.module';
import {
  PaymentWebhookPayload,
  PaymentWebhookService,
} from '../application/payment-webhook.service';

interface PaymentWebhookJobData {
  provider: string;
  payload: PaymentWebhookPayload;
}

@Injectable()
@Processor(PAYMENT_WEBHOOK_QUEUE)
export class PaymentWebhookProcessor extends WorkerHost {
  constructor(private readonly webhookService: PaymentWebhookService) {
    super();
  }

  async process(job: Job<PaymentWebhookJobData>): Promise<boolean> {
    const { payload } = job.data;
    return this.webhookService.processWebhookJob(payload);
  }
}
