import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['x-webhook-signature'] as string | undefined;
    const secret = this.configService.get<string>('webhook.paymentSecret');
    if (!secret) {
      throw new UnauthorizedException('Webhook not configured');
    }
    if (!signature || !signature.startsWith('sha256=')) {
      throw new UnauthorizedException('Invalid signature format');
    }
    const expectedHex = signature.slice(7);
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('Raw body required for signature');
    }
    const hmac = createHmac('sha256', secret);
    hmac.update(rawBody);
    const computed = hmac.digest('hex');
    const expectedBuffer = Buffer.from(expectedHex, 'hex');
    const computedBuffer = Buffer.from(computed, 'hex');
    if (
      expectedBuffer.length !== computedBuffer.length ||
      !timingSafeEqual(expectedBuffer, computedBuffer)
    ) {
      throw new UnauthorizedException('Invalid signature');
    }
    return true;
  }
}
