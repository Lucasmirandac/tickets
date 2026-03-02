import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as QRCode from 'qrcode';
import { CatalogService } from '../../catalog/application/catalog.service';
import { ReservationService } from '../../reservation/application/reservation.service';
import { Ticket } from '../domain/ticket.entity';
import { TicketRepository } from '../infrastructure/ticket.repository';
import { TicketService } from './ticket.service';

jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('png')),
}));

describe('TicketService', () => {
  let service: TicketService;
  let mockTicketRepository: jest.Mocked<
    Pick<
      TicketRepository,
      'findByReservationId' | 'findById' | 'findByUserId' | 'findByQrPayload' | 'create' | 'save'
    >
  >;
  let mockReservationService: jest.Mocked<Pick<ReservationService, 'findById'>>;
  let mockCatalogService: jest.Mocked<Pick<CatalogService, 'findSessionById'>>;

  const reservationId = '11111111-1111-1111-1111-111111111111';
  const orderId = '22222222-2222-2222-2222-222222222222';
  const userId = '33333333-3333-3333-3333-333333333333';
  const ticketId = '44444444-4444-4444-4444-444444444444';
  const mockReservation = {
    id: reservationId,
    userId,
    sessionId: 'session-1',
    seatId: 'seat-1',
    token: 't',
    expiresAt: new Date(),
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockSession = {
    id: 'session-1',
    eventId: 'event-1',
    startsAt: '',
    venue: '',
    description: null,
    endsAt: null,
    createdAt: '',
    updatedAt: '',
  };
  const mockTicket: Ticket = {
    id: ticketId,
    reservationId,
    orderId,
    userId,
    eventId: 'event-1',
    sessionId: 'session-1',
    seatId: 'seat-1',
    qrPayload: 'payload',
    createdAt: new Date(),
  } as Ticket;

  beforeEach(async () => {
    mockTicketRepository = {
      findByReservationId: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      findByQrPayload: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockReservationService = {
      findById: jest.fn(),
    };
    mockCatalogService = {
      findSessionById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: TicketRepository, useValue: mockTicketRepository },
        { provide: ReservationService, useValue: mockReservationService },
        { provide: CatalogService, useValue: mockCatalogService },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  describe('createForReservation', () => {
    it('should return existing ticket when one already exists for reservation', async () => {
      mockTicketRepository.findByReservationId.mockResolvedValue(mockTicket);

      const actual = await service.createForReservation(reservationId, orderId);

      expect(actual).toBe(mockTicket);
      expect(mockReservationService.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when reservation is not found', async () => {
      mockTicketRepository.findByReservationId.mockResolvedValue(null);
      mockReservationService.findById.mockResolvedValue(null);

      await expect(
        service.createForReservation(reservationId, orderId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createForReservation(reservationId, orderId),
      ).rejects.toThrow(`Reservation ${reservationId} not found`);
    });

    it('should create and save new ticket when reservation exists and no ticket yet', async () => {
      mockTicketRepository.findByReservationId.mockResolvedValue(null);
      mockReservationService.findById.mockResolvedValue(mockReservation as never);
      mockCatalogService.findSessionById.mockResolvedValue(mockSession as never);
      mockTicketRepository.create.mockReturnValue(mockTicket);
      mockTicketRepository.save.mockResolvedValue(mockTicket);

      const actual = await service.createForReservation(reservationId, orderId);

      expect(mockTicketRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reservationId,
          orderId,
          userId,
          eventId: 'event-1',
          sessionId: 'session-1',
          seatId: 'seat-1',
        }),
      );
      expect(mockTicketRepository.save).toHaveBeenCalled();
      expect(actual).toBe(mockTicket);
    });
  });

  describe('listByUserId', () => {
    it('should return tickets from repository', async () => {
      mockTicketRepository.findByUserId.mockResolvedValue([mockTicket]);

      const actual = await service.listByUserId(userId);

      expect(actual).toHaveLength(1);
      expect(actual[0].id).toBe(ticketId);
      expect(mockTicketRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getById', () => {
    it('should throw NotFoundException when ticket is not found', async () => {
      mockTicketRepository.findById.mockResolvedValue(null);

      await expect(service.getById(ticketId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.getById(ticketId, userId)).rejects.toThrow(
        `Ticket ${ticketId} not found`,
      );
    });

    it('should throw ForbiddenException when user does not own ticket', async () => {
      mockTicketRepository.findById.mockResolvedValue(mockTicket);
      const otherUserId = '99999999-9999-9999-9999-999999999999';

      await expect(service.getById(ticketId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getById(ticketId, otherUserId)).rejects.toThrow(
        'You do not own this ticket',
      );
    });

    it('should return ticket when user is owner', async () => {
      mockTicketRepository.findById.mockResolvedValue(mockTicket);

      const actual = await service.getById(ticketId, userId);

      expect(actual).toBe(mockTicket);
    });
  });

  describe('getQrPngBuffer', () => {
    it('should return PNG buffer for ticket qrPayload', async () => {
      mockTicketRepository.findById.mockResolvedValue(mockTicket);

      const actual = await service.getQrPngBuffer(ticketId, userId);

      expect(Buffer.isBuffer(actual)).toBe(true);
      expect(QRCode.toBuffer).toHaveBeenCalledWith('payload', {
        type: 'png',
        margin: 2,
      });
    });
  });

  describe('validateByQrPayload', () => {
    it('should throw NotFoundException when QR payload does not match any ticket', async () => {
      mockTicketRepository.findByQrPayload.mockResolvedValue(null);

      await expect(service.validateByQrPayload('unknown-qr')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateByQrPayload('unknown-qr')).rejects.toThrow(
        'Ticket not found for this QR code',
      );
    });

    it('should throw BadRequestException when ticket was already validated', async () => {
      mockTicketRepository.findByQrPayload.mockResolvedValue({
        ...mockTicket,
        validatedAt: new Date(),
      } as Ticket);

      await expect(service.validateByQrPayload('payload')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateByQrPayload('payload')).rejects.toThrow(
        'Ticket has already been used',
      );
    });

    it('should set validatedAt and return ticket info when valid', async () => {
      const ticketWithNoValidation = { ...mockTicket, validatedAt: null };
      mockTicketRepository.findByQrPayload.mockResolvedValue(
        ticketWithNoValidation as Ticket,
      );
      mockTicketRepository.save.mockResolvedValue({
        ...ticketWithNoValidation,
        validatedAt: new Date(),
      } as Ticket);

      const actual = await service.validateByQrPayload('payload');

      expect(actual.valid).toBe(true);
      expect(actual.ticketId).toBe(ticketId);
      expect(actual.eventId).toBe('event-1');
      expect(actual.sessionId).toBe('session-1');
      expect(actual.seatId).toBe('seat-1');
      expect(actual.validatedAt).toBeInstanceOf(Date);
      expect(mockTicketRepository.save).toHaveBeenCalled();
    });
  });
});
