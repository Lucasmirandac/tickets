import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  const config = new DocumentBuilder()
    .setTitle('Tickets API')
    .setDescription(
      'Sistema de venda de ingressos com reserva, checkout e pagamento. Rotas protegidas exigem header Authorization: Bearer <token>.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
