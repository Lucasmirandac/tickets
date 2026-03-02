import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentWebhookService } from '../application/payment-webhook.service';
import { WebhookSignatureGuard } from '../application/webhook-signature.guard';

/**
 * Webhook endpoint for payment gateway. No JWT; validation is by signature only.
 * Expects X-Webhook-Signature: sha256=<hmac_hex(body)> and raw JSON body.
 */
@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Get('test')
  getTest(): { status: string } {
    return { status: 'ok' };
  }

  @Post(':provider')
  @UseGuards(WebhookSignatureGuard)
  async handle(
    @Param('provider') provider: string,
    @Body() body: { eventType?: string; gatewayId?: string },
  ): Promise<{ received: boolean }> {
    await this.webhookService.enqueue(provider, {
      eventType: body.eventType ?? '',
      gatewayId: body.gatewayId ?? '',
    });
    return { received: true };
  }
}
