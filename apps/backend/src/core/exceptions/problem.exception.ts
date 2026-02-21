import { HttpException } from '@nestjs/common';
import { ProblemDetails } from '@repo/types';

export class ProblemException extends HttpException {
  private readonly problemDetails: ProblemDetails;

  constructor(
    status: number,
    title: string,
    detail: string,
    type: string = 'about:blank', // Default per RFC 7807
    additionalProps?: Record<string, any>,
  ) {
    // We pass a generic message to the parent, as we will override the response
    super(title, status);

    this.problemDetails = {
      type,
      title,
      status,
      detail,
      ...additionalProps,
    };
  }

  getProblemDetails(): ProblemDetails {
    return this.problemDetails;
  }
}
