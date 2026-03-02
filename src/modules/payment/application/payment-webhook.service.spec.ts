import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PAYMENT_WEBHOOK_QUEUE } from '../../../infrastructure/queue/queue.module';
import { PaymentConfirmationService } from './payment-confirmation.service';
import { PaymentWebhookService } from './payment-webhook.service';

describe('PaymentWebhookService', () => {
  let service: PaymentWebhookService;
  let mockQueue: jest.Mocked<Pick<Queue, 'add'>>;
  let mockPaymentConfirmationService: jest.Mocked<
    Pick<PaymentConfirmationService, 'confirmByGatewayId'>
  >;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };
    mockPaymentConfirmationService = {
      confirmByGatewayId: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentWebhookService,
        { provide: getQueueToken(PAYMENT_WEBHOOK_QUEUE), useValue: mockQueue },
        { provide: PaymentConfirmationService, useValue: mockPaymentConfirmationService },
      ],
    }).compile();

    service = module.get<PaymentWebhookService>(PaymentWebhookService);
  });

  describe('enqueue', () => {
    it('should add job to queue with provider and payload', async () => {
      const payload = { eventType: 'payment.approved', gatewayId: 'pay_xxx' };

      await service.enqueue('stripe', payload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process',
        { provider: 'stripe', payload },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      );
    });
  });

  describe('processWebhookJob', () => {
    it('should return false when eventType is not payment.approved', async () => {
      const actual = await service.processWebhookJob({
        eventType: 'payment.pending',
        gatewayId: 'pay_xxx',
      });

      expect(actual).toBe(false);
      expect(mockPaymentConfirmationService.confirmByGatewayId).not.toHaveBeenCalled();
    });

    it('should call confirmByGatewayId and return result when eventType is payment.approved', async () => {
      mockPaymentConfirmationService.confirmByGatewayId.mockResolvedValue(true);

      const actual = await service.processWebhookJob({
        eventType: 'payment.approved',
        gatewayId: 'pay_xxx',
      });

      expect(actual).toBe(true);
      expect(mockPaymentConfirmationService.confirmByGatewayId).toHaveBeenCalledWith(
        'pay_xxx',
      );
    });
  });
});
