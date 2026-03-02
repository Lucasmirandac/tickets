import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT } from '../../../infrastructure/redis/redis.module';
import { Seat } from '../../catalog/domain/seat.entity';
import { SeatRepository } from '../../catalog/infrastructure/seat.repository';
import { DistributedLockService } from '../infrastructure/distributed-lock.service';
import { EventPublisherService } from '../infrastructure/event-publisher.service';
import { ReservationCacheService } from '../infrastructure/reservation-cache.service';
import { ReservationRepository } from '../infrastructure/reservation.repository';
import { ReservationService } from './reservation.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let mockSeatRepository: jest.Mocked<Pick<SeatRepository, 'findBySessionAndId' | 'updateStatusToReserved'>>;
  let mockReservationRepository: jest.Mocked<Pick<ReservationRepository, 'create'>>;
  let mockLockService: jest.Mocked<Pick<DistributedLockService, 'acquire' | 'release'>>;
  let mockCacheService: jest.Mocked<Pick<ReservationCacheService, 'set' | 'delete'>>;
  let mockEventPublisher: jest.Mocked<
    Pick<EventPublisherService, 'publishSeatReserved' | 'publishReservationExpired'>
  >;

  const sessionId = '11111111-1111-1111-1111-111111111111';
  const seatId = '22222222-2222-2222-2222-222222222222';
  const userId = '33333333-3333-3333-3333-333333333333';
  const eventId = '44444444-4444-4444-4444-444444444444';

  const validRequest = {
    eventId,
    sessionId,
    seatId,
    userId,
  };

  const availableSeat: Seat = {
    id: seatId,
    sessionId,
    row: 'A',
    number: '1',
    status: 'available',
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Seat;

  beforeEach(async () => {
    mockSeatRepository = {
      findBySessionAndId: jest.fn(),
      updateStatusToReserved: jest.fn(),
    };
    mockReservationRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'res-1',
        seatId,
        sessionId,
        userId,
        token: 'token-1',
        expiresAt: new Date(),
        status: 'active',
      }),
    };
    mockLockService = {
      acquire: jest.fn().mockResolvedValue('lock-token'),
      release: jest.fn().mockResolvedValue(true),
    };
    mockCacheService = {
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    mockEventPublisher = {
      publishSeatReserved: jest.fn(),
      publishReservationExpired: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => (key === 'reservation.ttlSeconds' ? 600 : 5000)) } },
        { provide: REDIS_CLIENT, useValue: {} },
        { provide: SeatRepository, useValue: mockSeatRepository },
        { provide: ReservationRepository, useValue: mockReservationRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: ReservationCacheService, useValue: mockCacheService },
        { provide: EventPublisherService, useValue: mockEventPublisher },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  describe('reserve', () => {
    it('should reserve seat when seat is available and lock acquired', async () => {
      mockSeatRepository.findBySessionAndId.mockResolvedValue(availableSeat);
      mockSeatRepository.updateStatusToReserved.mockResolvedValue(true);

      const actual = await service.reserve(validRequest);

      expect(actual.success).toBe(true);
      expect(actual.reservationId).toBe('res-1');
      expect(actual.token).toBeDefined();
      expect(actual.expiresAt).toBeDefined();
      expect(mockLockService.acquire).toHaveBeenCalled();
      expect(mockReservationRepository.create).toHaveBeenCalled();
      expect(mockSeatRepository.updateStatusToReserved).toHaveBeenCalledWith(seatId, 0);
      expect(mockEventPublisher.publishSeatReserved).toHaveBeenCalled();
      expect(mockLockService.release).toHaveBeenCalled();
    });

    it('should return error when lock is not acquired', async () => {
      mockLockService.acquire.mockResolvedValue(null);

      const actual = await service.reserve(validRequest);

      expect(actual.success).toBe(false);
      expect(actual.error).toBe('Could not acquire lock');
      expect(mockReservationRepository.create).not.toHaveBeenCalled();
    });

    it('should return error when seat is not found', async () => {
      mockSeatRepository.findBySessionAndId.mockResolvedValue(null);

      const actual = await service.reserve(validRequest);

      expect(actual.success).toBe(false);
      expect(actual.error).toBe('Seat not found');
      expect(mockLockService.release).toHaveBeenCalled();
    });

    it('should return error when seat is not available', async () => {
      mockSeatRepository.findBySessionAndId.mockResolvedValue({
        ...availableSeat,
        status: 'reserved',
      });

      const actual = await service.reserve(validRequest);

      expect(actual.success).toBe(false);
      expect(actual.error).toBe('Seat not available');
      expect(mockLockService.release).toHaveBeenCalled();
    });

    it('should return error on concurrent update (OCC)', async () => {
      mockSeatRepository.findBySessionAndId.mockResolvedValue(availableSeat);
      mockSeatRepository.updateStatusToReserved.mockResolvedValue(false);

      const actual = await service.reserve(validRequest);

      expect(actual.success).toBe(false);
      expect(actual.error).toBe('Concurrent update');
      expect(mockCacheService.delete).toHaveBeenCalled();
      expect(mockLockService.release).toHaveBeenCalled();
    });
  });

  describe('releaseReservation', () => {
    it('should return false when reservation not found', async () => {
      const mockRepo = { findById: jest.fn().mockResolvedValue(null) };
      const serviceWithMock = await createServiceWithReservationRepo(mockRepo as unknown as ReservationRepository);
      const actual = await serviceWithMock.releaseReservation('non-existent');
      expect(actual).toBe(false);
    });

    it('should release and return true when reservation is active', async () => {
      const mockRepo = {
        findById: jest.fn().mockResolvedValue({
          id: 'res-1',
          seatId,
          sessionId,
          userId,
          token: 't',
          status: 'active',
        }),
        updateStatus: jest.fn().mockResolvedValue(undefined),
      };
      const mockSeatRepo = { updateStatusToAvailable: jest.fn().mockResolvedValue(undefined) };
      const module = await Test.createTestingModule({
        providers: [
          ReservationService,
          { provide: ConfigService, useValue: { get: jest.fn() } },
          { provide: REDIS_CLIENT, useValue: {} },
          { provide: SeatRepository, useValue: { ...mockSeatRepository, ...mockSeatRepo } },
          { provide: ReservationRepository, useValue: mockRepo },
          { provide: DistributedLockService, useValue: mockLockService },
          { provide: ReservationCacheService, useValue: mockCacheService },
          { provide: EventPublisherService, useValue: mockEventPublisher },
        ],
      }).compile();
      const s = module.get<ReservationService>(ReservationService);
      const actual = await s.releaseReservation('res-1');
      expect(actual).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith('t');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('res-1', 'expired');
      expect(mockSeatRepo.updateStatusToAvailable).toHaveBeenCalledWith(seatId);
    });
  });

  async function createServiceWithReservationRepo(
    reservationRepo: ReservationRepository,
  ): Promise<ReservationService> {
    const module = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: REDIS_CLIENT, useValue: {} },
        { provide: SeatRepository, useValue: mockSeatRepository },
        { provide: ReservationRepository, useValue: reservationRepo },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: ReservationCacheService, useValue: mockCacheService },
        { provide: EventPublisherService, useValue: mockEventPublisher },
      ],
    }).compile();
    return module.get<ReservationService>(ReservationService);
  }
});
