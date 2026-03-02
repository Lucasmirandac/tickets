import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    json({
      verify: (req, _res, buf: Buffer) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
