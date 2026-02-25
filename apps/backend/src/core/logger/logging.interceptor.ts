import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Response } from 'express';
import { AppLogger } from './app-logger.service';
import { LogContext } from './log-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = ctx.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        LogContext.set('httpStatus', res.statusCode);
        this.flush();
      }),
      catchError((err: unknown) => {
        const status = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        LogContext.set('httpStatus', status);
        LogContext.set('errorCode', err instanceof Error ? err.constructor.name : 'UnknownError');
        LogContext.set('errorMessage', err instanceof Error ? err.message : String(err));

        this.flush();
        return throwError(() => err);
      }),
    );
  }

  private flush(): void {
    const log = LogContext.flush();
    if (log) {
      this.logger.canonical(log as Record<string, unknown>);
    }
  }
}
