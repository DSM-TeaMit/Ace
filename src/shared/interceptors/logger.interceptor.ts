import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${request.ip} ${request.method} ${request.originalUrl} ${response.statusCode}`,
          );
        },
        error: (err: Error) => {
          if (err instanceof HttpException) {
            const statusCode = err.getStatus();
            if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
              this.logger.error(
                `${request.ip} ${request.method} ${request.originalUrl} ${statusCode}`,
              );
            } else {
              this.logger.warn(
                `${request.ip} ${request.method} ${request.originalUrl} ${statusCode}`,
              );
            }
          }
        },
      }),
    );
  }
}
