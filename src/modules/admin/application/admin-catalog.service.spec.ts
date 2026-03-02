import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../catalog/domain/event.entity';
import { Seat } from '../../catalog/domain/seat.entity';
import { Session } from '../../catalog/domain/session.entity';
import { AdminCatalogService } from './admin-catalog.service';

describe('AdminCatalogService', () => {
  let service: AdminCatalogService;
  let mockEventRepository: jest.Mocked<
    Pick<Repository<Event>, 'findOne' | 'create' | 'save' | 'find'>
  >;
  let mockSessionRepository: jest.Mocked<
    Pick<Repository<Session>, 'findOne' | 'create' | 'save'>
  >;
  let mockSeatRepository: jest.Mocked<Pick<Repository<Seat>, 'findOne' | 'create' | 'save'>>;

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

  beforeEach(async () => {
    mockEventRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    mockSessionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockSeatRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCatalogService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepository },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepository },
        { provide: getRepositoryToken(Seat), useValue: mockSeatRepository },
      ],
    }).compile();

    service = module.get<AdminCatalogService>(AdminCatalogService);
  });

  describe('createEvent', () => {
    it('should create event with slug from name when slug not provided', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      const saved = { ...mockEvent, slug: 'my-event' };
      mockEventRepository.create.mockReturnValue(saved as Event);
      mockEventRepository.save.mockResolvedValue(saved as Event);

      const actual = await service.createEvent({ name: 'My Event' });

      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Event', slug: 'my-event' }),
      );
      expect(mockEventRepository.save).toHaveBeenCalled();
    });

    it('should use provided slug when given', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);
      mockEventRepository.save.mockResolvedValue(mockEvent);

      await service.createEvent({ name: 'Event', slug: 'custom-slug' });

      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });
  });

  describe('updateEvent', () => {
    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateEvent(eventId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEvent(eventId, { name: 'Updated' }),
      ).rejects.toThrow(`Event with id ${eventId} not found`);
    });

    it('should update and save event when found', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      const updated = { ...mockEvent, name: 'Updated' };
      mockEventRepository.save.mockResolvedValue(updated as Event);

      const actual = await service.updateEvent(eventId, { name: 'Updated' });

      expect(mockEventRepository.save).toHaveBeenCalled();
      expect(actual.name).toBe('Updated');
    });
  });

  describe('findAllEvents', () => {
    it('should return events ordered by createdAt DESC', async () => {
      mockEventRepository.find.mockResolvedValue([mockEvent] as Event[]);

      const actual = await service.findAllEvents();

      expect(actual).toHaveLength(1);
      expect(mockEventRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('createSession', () => {
    it('should throw NotFoundException when event is not found', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createSession(eventId, {
          startsAt: '2025-12-31T20:00:00.000Z',
          venue: 'Arena',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and save session when event exists', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockSessionRepository.create.mockReturnValue(mockSession as Session);
      mockSessionRepository.save.mockResolvedValue(mockSession as Session);

      const actual = await service.createSession(eventId, {
        startsAt: '2025-12-31T20:00:00.000Z',
        venue: 'Arena',
      });

      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(actual.venue).toBe('Venue');
    });
  });

  describe('updateSession', () => {
    it('should throw NotFoundException when session is not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSession(sessionId, { venue: 'New Venue' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and save session when found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      const updated = { ...mockSession, venue: 'New Venue' };
      mockSessionRepository.save.mockResolvedValue(updated as Session);

      const actual = await service.updateSession(sessionId, { venue: 'New Venue' });

      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(actual.venue).toBe('New Venue');
    });
  });

  describe('createSeatsForSession', () => {
    it('should throw NotFoundException when session is not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createSeatsForSession(sessionId, {
          seats: [{ row: 'A', number: '1' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and save seats when session exists', async () => {
      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      const seat = {
        id: 'seat-1',
        sessionId,
        row: 'A',
        number: '1',
        status: 'available',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Seat;
      mockSeatRepository.create.mockReturnValue(seat);
      mockSeatRepository.save.mockResolvedValue([seat]);

      const actual = await service.createSeatsForSession(sessionId, {
        seats: [{ row: 'A', number: '1' }],
      });

      expect(mockSeatRepository.save).toHaveBeenCalled();
      expect(actual).toHaveLength(1);
    });
  });
});
