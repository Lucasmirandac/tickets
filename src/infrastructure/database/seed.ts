import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { Event } from '../../modules/catalog/domain/event.entity';
import { Session } from '../../modules/catalog/domain/session.entity';
import { Seat } from '../../modules/catalog/domain/seat.entity';
import { User } from '../../modules/auth/domain/user.entity';
import { Admin } from '../../modules/admin/domain/admin.entity';

config();

type SeedUserResult = {
  readonly user: User;
};

type SeedEventResult = {
  readonly event: Event;
  readonly sessions: Session[];
};

async function createDemoUser(): Promise<SeedUserResult> {
  const repository = dataSource.getRepository(User);
  const existing = await repository.findOne({
    where: { email: 'demo.user@example.com' },
  });
  if (existing) {
    return { user: existing };
  }
  const passwordHash = await bcrypt.hash('DemoUser123!', 10);
  const user = repository.create({
    email: 'demo.user@example.com',
    passwordHash,
    addressStreet: 'Main Street',
    addressNumber: '123',
    addressComplement: null,
    addressNeighborhood: 'Downtown',
    addressCity: 'Sample City',
    addressState: 'SC',
    addressPostalCode: '00000-000',
    addressCountry: 'Brazil',
  });
  const saved = await repository.save(user);
  return { user: saved };
}

async function createDemoAdmin(user: User): Promise<void> {
  const repository = dataSource.getRepository(Admin);
  const existing = await repository.findOne({
    where: { userId: user.id },
  });
  if (existing) {
    return;
  }
  const admin = repository.create({
    userId: user.id,
    adminType: 'super_admin',
  });
  await repository.save(admin);
}

async function createDemoEvent(): Promise<SeedEventResult> {
  const eventRepository = dataSource.getRepository(Event);
  const sessionRepository = dataSource.getRepository(Session);
  const existing = await eventRepository.findOne({
    where: { slug: 'rock-festival-2025' },
  });
  if (existing) {
    const sessions = await sessionRepository.find({
      where: { eventId: existing.id },
    });
    return { event: existing, sessions };
  }
  const event = eventRepository.create({
    name: 'Rock Festival 2025',
    slug: 'rock-festival-2025',
    description: 'High-traffic demo event for testing reservations and checkout.',
  });
  const savedEvent = await eventRepository.save(event);
  const now = new Date();
  const sessionDates = [
    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
  ];
  const sessionsToSave = sessionDates.map((startsAt, index) =>
    sessionRepository.create({
      eventId: savedEvent.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 2 * 60 * 60 * 1000),
      venue: index === 0 ? 'Arena A' : 'Arena B',
      description: index === 0 ? 'Opening night' : 'Second night',
    }),
  );
  const savedSessions = await sessionRepository.save(sessionsToSave);
  return { event: savedEvent, sessions: savedSessions };
}

async function createDemoSeats(sessions: Session[]): Promise<void> {
  const seatRepository = dataSource.getRepository(Seat);
  for (const session of sessions) {
    const existingCount = await seatRepository.count({
      where: { sessionId: session.id },
    });
    if (existingCount > 0) {
      continue;
    }
    const seatsToCreate: Seat[] = [];
    const rows = ['A', 'B', 'C', 'D'];
    const maxNumber = 10;
    for (const row of rows) {
      for (let i = 1; i <= maxNumber; i += 1) {
        seatsToCreate.push(
          seatRepository.create({
            sessionId: session.id,
            row,
            number: String(i),
            status: 'available',
            version: 0,
          }),
        );
      }
    }
    await seatRepository.save(seatsToCreate);
  }
}

async function executeSeed(): Promise<void> {
  await dataSource.initialize();
  try {
    const { user } = await createDemoUser();
    await createDemoAdmin(user);
    const { sessions } = await createDemoEvent();
    await createDemoSeats(sessions);
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          status: 'ok',
          message:
            'Seed completed. Use demo.user@example.com / DemoUser123! to authenticate and Rock Festival 2025 as catalog.',
        },
      ),
    );
  } finally {
    await dataSource.destroy();
  }
}

executeSeed().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', err);
  process.exitCode = 1;
});

