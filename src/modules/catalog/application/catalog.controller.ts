import { Controller, Get } from '@nestjs/common';

/**
 * Catalog controller. Smoke test endpoint per project conventions.
 */
@Controller('catalog')
export class CatalogController {
  @Get('test')
  getTest(): { status: string } {
    return { status: 'ok' };
  }
}
