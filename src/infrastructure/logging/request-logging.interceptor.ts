import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JsonLoggerService } from './json-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: JsonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const method = request.method;
    const url = request.url;
    return next.handle().pipe(
      tap({
        next: () => {
          const response = httpContext.getResponse<Response>();
          const statusCode = (response as unknown as { statusCode?: number }).statusCode ?? 0;
          const durationMs = Date.now() - now;
          this.logger.log(
            `HTTP ${method} ${url} - ${statusCode} - ${durationMs}ms`,
            'RequestLoggingInterceptor',
          );
        },
      }),
    );
  }
}

