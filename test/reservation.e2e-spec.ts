import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { json } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ReservationController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET /reservations/test returns ok', () => {
    return request(app.getHttpServer())
      .get('/reservations/test')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });

  it('POST /reservations with invalid body returns 400', () => {
    return request(app.getHttpServer())
      .post('/reservations')
      .send({})
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('POST /reservations with missing required fields returns 400', () => {
    return request(app.getHttpServer())
      .post('/reservations')
      .send({
        eventId: '11111111-1111-1111-1111-111111111111',
        sessionId: '22222222-2222-2222-2222-222222222222',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });
});
