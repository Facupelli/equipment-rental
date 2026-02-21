import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProblemException } from '../exceptions/problem.exception';
import { ProblemDetails } from '@repo/types';

type HandlerResult = { status: number; problemDetails: ProblemDetails };

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, problemDetails } = this.resolve(exception, request);

    response
      .status(status)
      .contentType('application/problem+json')
      .json({ ...problemDetails, instance: problemDetails.instance ?? request.url });
  }

  private resolve(exception: unknown, request: Request): HandlerResult {
    return (
      this.tryHandleProblemException(exception) ??
      this.tryHandleValidationException(exception, request) ??
      this.tryHandleHttpException(exception, request) ??
      this.handleUnknownException(exception, request)
    );
  }

  private tryHandleProblemException(exception: unknown): HandlerResult | null {
    if (!(exception instanceof ProblemException)) return null;

    return {
      status: exception.getStatus(),
      problemDetails: exception.getProblemDetails(),
    };
  }

  private tryHandleValidationException(exception: unknown, request: Request): HandlerResult | null {
    if (!(exception instanceof HttpException)) {
      return null;
    }

    const exceptionResponse = exception.getResponse();
    const isValidationError = typeof exceptionResponse === 'object' && (exceptionResponse as any).message;

    if (!isValidationError) {
      return null;
    }

    const messages = (exceptionResponse as any).message;
    const status = exception.getStatus();

    return {
      status,
      problemDetails: {
        type: 'errors://validation-error',
        title: 'Validation Failed',
        status,
        detail: 'Input data validation failed',
        instance: request.url,
        errors: Array.isArray(messages) ? messages : [messages],
      },
    };
  }

  private tryHandleHttpException(exception: unknown, request: Request): HandlerResult | null {
    if (!(exception instanceof HttpException)) return null;

    const exceptionResponse = exception.getResponse();
    const status = exception.getStatus();
    const detail =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as any).message ?? exception.message);

    return {
      status,
      problemDetails: {
        type: 'errors://http-error',
        title: exception.name,
        status,
        detail,
        instance: request.url,
      },
    };
  }

  private handleUnknownException(exception: unknown, request: Request): HandlerResult {
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    this.logger.error(`Internal Server Error: ${message}`, exception instanceof Error ? exception.stack : undefined);

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      problemDetails: {
        type: 'errors://internal-server-error',
        title: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: 'An unexpected error occurred. Please try again later.',
        instance: request.url,
      },
    };
  }
}
