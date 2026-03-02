import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationService } from '../../reservation/application/reservation.service';
import { EventPublisherService } from '../../reservation/infrastructure/event-publisher.service';
import { TicketService } from '../../tickets/application/ticket.service';
import { Order } from '../domain/order.entity';
import { OrderRepository } from '../infrastructure/order.repository';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { PaymentConfirmationService } from './payment-confirmation.service';

describe('PaymentConfirmationService', () => {
  let service: PaymentConfirmationService;
  let mockPaymentRepository: jest.Mocked<
    Pick<PaymentRepository, 'findByGatewayId' | 'updateStatus'>
  >;
  let mockOrderRepository: jest.Mocked<Pick<OrderRepository, 'getReservationIdsByOrderId'>>;
  let mockOrderRepo: jest.Mocked<Pick<Repository<Order>, 'update'>>;
  let mockReservationService: jest.Mocked<Pick<ReservationService, 'confirmReservation'>>;
  let mockEventPublisher: jest.Mocked<
    Pick<EventPublisherService, 'publishPaymentConfirmed'>
  >;
  let mockTicketService: jest.Mocked<Pick<TicketService, 'createForReservation'>>;

  const gatewayId = 'pay_xxx';
  const paymentId = '11111111-1111-1111-1111-111111111111';
  const orderId = '22222222-2222-2222-2222-222222222222';
  const reservationIds = ['33333333-3333-3333-3333-333333333333'];

  beforeEach(async () => {
    mockPaymentRepository = {
      findByGatewayId: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    mockOrderRepository = {
      getReservationIdsByOrderId: jest.fn().mockResolvedValue(reservationIds),
    };
    mockOrderRepo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    mockReservationService = {
      confirmReservation: jest.fn().mockResolvedValue(true),
    };
    mockEventPublisher = {
      publishPaymentConfirmed: jest.fn(),
    };
    mockTicketService = {
      createForReservation: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentConfirmationService,
        { provide: PaymentRepository, useValue: mockPaymentRepository },
        { provide: OrderRepository, useValue: mockOrderRepository },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: ReservationService, useValue: mockReservationService },
        { provide: EventPublisherService, useValue: mockEventPublisher },
        { provide: TicketService, useValue: mockTicketService },
      ],
    }).compile();

    service = module.get<PaymentConfirmationService>(PaymentConfirmationService);
  });

  describe('confirmByGatewayId', () => {
    it('should return false when payment is not found', async () => {
      mockPaymentRepository.findByGatewayId.mockResolvedValue(null);

      const actual = await service.confirmByGatewayId(gatewayId);

      expect(actual).toBe(false);
      expect(mockPaymentRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should return false when payment is already approved', async () => {
      mockPaymentRepository.findByGatewayId.mockResolvedValue({
        id: paymentId,
        orderId,
        status: 'approved',
      } as never);

      const actual = await service.confirmByGatewayId(gatewayId);

      expect(actual).toBe(false);
      expect(mockPaymentRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should update payment, order, confirm reservations, create tickets and return true', async () => {
      mockPaymentRepository.findByGatewayId.mockResolvedValue({
        id: paymentId,
        orderId,
        status: 'pending',
      } as never);

      const actual = await service.confirmByGatewayId(gatewayId);

      expect(actual).toBe(true);
      expect(mockPaymentRepository.updateStatus).toHaveBeenCalledWith(
        paymentId,
        'approved',
      );
      expect(mockOrderRepo.update).toHaveBeenCalledWith(
        { id: orderId },
        { status: 'paid' },
      );
      expect(mockReservationService.confirmReservation).toHaveBeenCalledWith(
        reservationIds[0],
      );
      expect(mockTicketService.createForReservation).toHaveBeenCalledWith(
        reservationIds[0],
        orderId,
      );
      expect(mockEventPublisher.publishPaymentConfirmed).toHaveBeenCalledWith({
        reservationId: reservationIds[0],
        orderId,
      });
    });
  });
});
