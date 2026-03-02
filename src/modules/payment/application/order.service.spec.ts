import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from '../../reservation/application/reservation.service';
import { OrderRepository } from '../infrastructure/order.repository';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let mockReservationService: jest.Mocked<
    Pick<ReservationService, 'getActiveReservationByToken'>
  >;
  let mockOrderRepository: jest.Mocked<Pick<OrderRepository, 'createOrder'>>;

  const userId = '11111111-1111-1111-1111-111111111111';
  const reservationId = '22222222-2222-2222-2222-222222222222';
  const orderId = '33333333-3333-3333-3333-333333333333';
  const mockReservation = {
    id: reservationId,
    seatId: 'seat-1',
    sessionId: 'session-1',
    userId,
    token: 'token-1',
    expiresAt: new Date(),
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockReservationService = {
      getActiveReservationByToken: jest.fn(),
    };
    mockOrderRepository = {
      createOrder: jest.fn().mockResolvedValue({ id: orderId, total: '0.00' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: ReservationService, useValue: mockReservationService },
        { provide: OrderRepository, useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  const reservationId2 = '44444444-4444-4444-4444-444444444444';
  const mockReservation2 = { ...mockReservation, id: reservationId2 };

  describe('createOrderFromTokens', () => {
    it('should create order when all tokens are valid and unique', async () => {
      mockReservationService.getActiveReservationByToken
        .mockResolvedValueOnce(mockReservation as never)
        .mockResolvedValueOnce(mockReservation2 as never);

      const actual = await service.createOrderFromTokens(userId, ['token-1', 'token-2']);

      expect(actual.orderId).toBe(orderId);
      expect(actual.total).toBe('0.00');
      expect(mockReservationService.getActiveReservationByToken).toHaveBeenCalledTimes(2);
      expect(mockOrderRepository.createOrder).toHaveBeenCalledWith(
        userId,
        [reservationId, reservationId2],
        '0.00',
      );
    });

    it('should throw BadRequestException when a token is invalid', async () => {
      mockReservationService.getActiveReservationByToken.mockResolvedValueOnce(
        null,
      );

      await expect(
        service.createOrderFromTokens(userId, ['invalid-token']),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrderFromTokens(userId, ['invalid-token']),
      ).rejects.toThrow('Invalid or expired reservation token: invalid-token');
      expect(mockOrderRepository.createOrder).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when duplicate reservation tokens are sent', async () => {
      mockReservationService.getActiveReservationByToken.mockResolvedValue(
        mockReservation as never,
      );

      await expect(
        service.createOrderFromTokens(userId, ['token-1', 'token-1']),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createOrderFromTokens(userId, ['token-1', 'token-1']),
      ).rejects.toThrow('Duplicate reservation tokens are not allowed');
      expect(mockOrderRepository.createOrder).not.toHaveBeenCalled();
    });
  });
});
