import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../domain/event.entity';
import { Seat } from '../domain/seat.entity';
import { Session } from '../domain/session.entity';
import type { EventResponseDto } from './dto/event-response.dto';
import type { SessionResponseDto } from './dto/session-response.dto';
import type { SeatResponseDto } from './dto/seat-response.dto';

function toEventResponse(event: Event): EventResponseDto {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function toSessionResponse(session: Session): SessionResponseDto {
  return {
    id: session.id,
    eventId: session.eventId,
    startsAt: session.startsAt.toISOString(),
    venue: session.venue,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function toSeatResponse(seat: Seat): SeatResponseDto {
  return {
    id: seat.id,
    sessionId: seat.sessionId,
    row: seat.row,
    number: seat.number,
    status: seat.status,
  };
}

/**
 * Application service for catalog read operations (events, sessions, seats).
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async findAllEvents(): Promise<EventResponseDto[]> {
    const events = await this.eventRepository.find({
      order: { createdAt: 'DESC' },
    });
    return events.map(toEventResponse);
  }

  async findEventById(id: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return toEventResponse(event);
  }

  async findEventBySlug(slug: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({ where: { slug } });
    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }
    return toEventResponse(event);
  }

  async findSessionsByEventId(eventId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepository.find({
      where: { eventId },
      order: { startsAt: 'ASC' },
    });
    return sessions.map(toSessionResponse);
  }

  async findSessionById(sessionId: string): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }
    return toSessionResponse(session);
  }

  async findSeatsBySessionId(sessionId: string): Promise<SeatResponseDto[]> {
    const seats = await this.seatRepository.find({
      where: { sessionId },
      order: { row: 'ASC', number: 'ASC' },
    });
    return seats.map(toSeatResponse);
  }
}
