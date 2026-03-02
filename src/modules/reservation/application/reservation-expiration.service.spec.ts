import { Test, TestingModule } from '@nestjs/testing';
import { ReservationRepository } from '../infrastructure/reservation.repository';
import { ReservationService } from './reservation.service';
import { ReservationExpirationService } from './reservation-expiration.service';

describe('ReservationExpirationService', () => {
  let service: ReservationExpirationService;
  let mockReservationRepository: jest.Mocked<
    Pick<ReservationRepository, 'findActiveByExpiresAtBefore'>
  >;
  let mockReservationService: jest.Mocked<Pick<ReservationService, 'releaseReservation'>>;

  const reservationId = '11111111-1111-1111-1111-111111111111';
  const expiredReservation = {
    id: reservationId,
    seatId: 'seat-1',
    sessionId: 'session-1',
    userId: 'user-1',
    token: 't',
    expiresAt: new Date(0),
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockReservationRepository = {
      findActiveByExpiresAtBefore: jest.fn().mockResolvedValue([]),
    };
    mockReservationService = {
      releaseReservation: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationExpirationService,
        { provide: ReservationRepository, useValue: mockReservationRepository },
        { provide: ReservationService, useValue: mockReservationService },
      ],
    }).compile();

    service = module.get<ReservationExpirationService>(ReservationExpirationService);
  });

  describe('handleExpiredReservations', () => {
    it('should do nothing when no expired reservations exist', async () => {
      await service.handleExpiredReservations();

      expect(mockReservationRepository.findActiveByExpiresAtBefore).toHaveBeenCalled();
      expect(mockReservationService.releaseReservation).not.toHaveBeenCalled();
    });

    it('should call releaseReservation for each expired reservation', async () => {
      mockReservationRepository.findActiveByExpiresAtBefore.mockResolvedValue([
        expiredReservation as never,
      ]);

      await service.handleExpiredReservations();

      expect(mockReservationRepository.findActiveByExpiresAtBefore).toHaveBeenCalledWith(
        expect.any(Date),
      );
      expect(mockReservationService.releaseReservation).toHaveBeenCalledTimes(1);
      expect(mockReservationService.releaseReservation).toHaveBeenCalledWith(reservationId);
    });
  });
});
