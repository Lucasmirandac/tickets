import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PAYMENT_WEBHOOK_QUEUE } from '../../../infrastructure/queue/queue.module';
import { PaymentConfirmationService } from './payment-confirmation.service';

export interface PaymentWebhookPayload {
  eventType: string;
  gatewayId: string;
}

/**
 * Validates webhook and enqueues processing. Worker calls PaymentConfirmationService.
 */
@Injectable()
export class PaymentWebhookService {
  constructor(
    @InjectQueue(PAYMENT_WEBHOOK_QUEUE)
    private readonly queue: Queue,
    private readonly paymentConfirmationService: PaymentConfirmationService,
  ) {}

  async enqueue(provider: string, payload: PaymentWebhookPayload): Promise<void> {
    await this.queue.add('process', { provider, payload }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }

  async processWebhookJob(payload: PaymentWebhookPayload): Promise<boolean> {
    if (payload.eventType !== 'payment.approved') {
      return false;
    }
    return this.paymentConfirmationService.confirmByGatewayId(payload.gatewayId);
  }
}
