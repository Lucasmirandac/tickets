import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { json } from 'express';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('PaymentWebhookController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      json({
        verify: (req, _res, buf: Buffer) => {
          (req as unknown as { rawBody?: Buffer }).rawBody = buf;
        },
      }),
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET /webhooks/payments/test returns ok', () => {
    return request(app.getHttpServer())
      .get('/webhooks/payments/test')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });

  it('POST /webhooks/payments/stripe without signature returns 401', () => {
    return request(app.getHttpServer())
      .post('/webhooks/payments/stripe')
      .send({ eventType: 'payment.approved', gatewayId: 'pay_123' })
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
