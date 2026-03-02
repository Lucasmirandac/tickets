import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../catalog/domain/event.entity';
import { Seat } from '../../catalog/domain/seat.entity';
import { Session } from '../../catalog/domain/session.entity';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { UpdateSessionDto } from './dto/update-session.dto';
import type { CreateSeatsDto } from './dto/create-seats.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class AdminCatalogService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async createEvent(dto: CreateEventDto): Promise<Event> {
    let slug = dto.slug?.trim() || slugify(dto.name);
    if (!slug) slug = 'event';
    const baseSlug = slug;
    let counter = 0;
    while (await this.eventRepository.findOne({ where: { slug } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
    const event = this.eventRepository.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() ?? null,
    });
    return this.eventRepository.save(event);
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    if (dto.name !== undefined) event.name = dto.name.trim();
    if (dto.slug !== undefined) event.slug = dto.slug.trim();
    if (dto.description !== undefined) event.description = dto.description?.trim() ?? null;
    return this.eventRepository.save(event);
  }

  async findAllEvents(): Promise<Event[]> {
    return this.eventRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createSession(eventId: string, dto: CreateSessionDto): Promise<Session> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }
    const session = this.sessionRepository.create({
      eventId,
      startsAt: new Date(dto.startsAt),
      venue: dto.venue.trim(),
      description: dto.description?.trim() ?? null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
    return this.sessionRepository.save(session);
  }

  async updateSession(id: string, dto: UpdateSessionDto): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    if (dto.startsAt !== undefined) session.startsAt = new Date(dto.startsAt);
    if (dto.venue !== undefined) session.venue = dto.venue.trim();
    if (dto.description !== undefined) session.description = dto.description?.trim() ?? null;
    if (dto.endsAt !== undefined) session.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    return this.sessionRepository.save(session);
  }

  async createSeatsForSession(sessionId: string, dto: CreateSeatsDto): Promise<Seat[]> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }
    const seats = dto.seats.map((s) =>
      this.seatRepository.create({
        sessionId,
        row: s.row.trim(),
        number: s.number.trim(),
      }),
    );
    return this.seatRepository.save(seats);
  }
}
