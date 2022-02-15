import {
  ExecutionContext,
  Injectable,
  NestInterceptor,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        next: null,
        error: (err) => {
          if (
            !(err instanceof HttpException) ||
            (err instanceof HttpException &&
              err.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR)
          ) {
            Sentry.captureException(err);
          }
        },
      }),
    );
  }
}
