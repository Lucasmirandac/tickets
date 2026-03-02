import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../domain/event.entity';
import { Seat } from '../domain/seat.entity';
import { Session } from '../domain/session.entity';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let mockEventRepository: jest.Mocked<Pick<Repository<Event>, 'find' | 'findOne'>>;
  let mockSessionRepository: jest.Mocked<Pick<Repository<Session>, 'find' | 'findOne'>>;
  let mockSeatRepository: jest.Mocked<Pick<Repository<Seat>, 'find'>>;

  const eventId = '11111111-1111-1111-1111-111111111111';
  const sessionId = '22222222-2222-2222-2222-222222222222';
  const mockEvent: Event = {
    id: eventId,
    name: 'Event',
    slug: 'event',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Event;
  const mockSession: Session = {
    id: sessionId,
    eventId,
    startsAt: new Date(),
    venue: 'Venue',
    description: null,
    endsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Session;
  const mockSeat: Seat = {
    id: '33333333-3333-3333-3333-333333333333',
    sessionId,
    row: 'A',
    number: '1',
    status: 'available',
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Seat;

  beforeEach(async () => {
    mockEventRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    mockSessionRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };
    mockSeatRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepository },
        { provide: getRepositoryToken(Seat), useValue: mockSeatRepository },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('findAllEvents', () => {
    it('should return events ordered by createdAt DESC', async () => {
      const events = [{ ...mockEvent }];
      mockEventRepository.find.mockResolvedValue(events as Event[]);

      const actual = await service.findAllEvents();

      expect(actual).toHaveLength(1);
      expect(actual[0]).toMatchObject({ id: eventId, name: 'Event', slug: 'event' });
      expect(mockEventRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findEventById', () => {
    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findEventById(eventId)).rejects.toThrow(NotFoundException);
      await expect(service.findEventById(eventId)).rejects.toThrow(
        `Event with id ${eventId} not found`,
      );
    });

    it('should return event DTO when found', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const actual = await service.findEventById(eventId);

      expect(actual.id).toBe(eventId);
      expect(actual.name).toBe('Event');
      expect(actual.slug).toBe('event');
      expect(actual.createdAt).toBeDefined();
    });
  });

  describe('findEventBySlug', () => {
    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.findEventBySlug('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should return event DTO when found', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const actual = await service.findEventBySlug('event');

      expect(actual.slug).toBe('event');
    });
  });

  describe('findSessionsByEventId', () => {
    it('should return sessions ordered by startsAt', async () => {
      mockSessionRepository.find.mockResolvedValue([mockSession] as Session[]);

      const actual = await service.findSessionsByEventId(eventId);

      expect(actual).toHaveLength(1);
      expect(mockSessionRepository.find).toHaveBeenCalledWith({
        where: { eventId },
        order: { startsAt: 'ASC' },
      });
    });
  });

  describe('findSessionById', () => {
    it('should throw NotFoundException when session is not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.findSessionById(sessionId)).rejects.toThrow(NotFoundException);
      await expect(service.findSessionById(sessionId)).rejects.toThrow(
        `Session with id ${sessionId} not found`,
      );
    });

    it('should return session DTO when found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      const actual = await service.findSessionById(sessionId);

      expect(actual.id).toBe(sessionId);
      expect(actual.eventId).toBe(eventId);
      expect(actual.venue).toBe('Venue');
    });
  });

  describe('findSeatsBySessionId', () => {
    it('should return seats ordered by row and number', async () => {
      mockSeatRepository.find.mockResolvedValue([mockSeat] as Seat[]);

      const actual = await service.findSeatsBySessionId(sessionId);

      expect(actual).toHaveLength(1);
      expect(mockSeatRepository.find).toHaveBeenCalledWith({
        where: { sessionId },
        order: { row: 'ASC', number: 'ASC' },
      });
    });
  });
});
