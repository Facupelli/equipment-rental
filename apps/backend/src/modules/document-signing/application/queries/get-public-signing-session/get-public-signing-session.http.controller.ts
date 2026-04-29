import { Controller, Get, GoneException, Headers, NotFoundException, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { Public } from 'src/core/decorators/public.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { DocumentSigningFacade } from '../../document-signing.facade';
import {
  SigningSessionExpiredError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

import { ResolvePublicSigningSessionQueryDto } from './get-public-signing-session.request.dto';
import {
  PublicSigningSessionResolveResponseDto,
  PublicSigningSessionResponseDto,
} from './get-public-signing-session.response.dto';

@Public()
@Controller('document-signing/public/sessions')
export class GetPublicSigningSessionHttpController {
  constructor(private readonly documentSigningFacade: DocumentSigningFacade) {}

  @Get('resolve')
  async resolve(@Query() query: ResolvePublicSigningSessionQueryDto): Promise<PublicSigningSessionResolveResponseDto> {
    try {
      return await this.documentSigningFacade.resolvePublicSigningSession(query.token);
    } catch (error) {
      throw mapPublicSigningError(error);
    }
  }

  @Get('me')
  async getSession(@Headers('authorization') authorization?: string): Promise<PublicSigningSessionResponseDto> {
    try {
      return await this.documentSigningFacade.getPublicSigningSession(extractBearerToken(authorization));
    } catch (error) {
      throw mapPublicSigningError(error);
    }
  }

  @Get('me/unsigned-pdf')
  async streamUnsignedPdf(
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const document = await this.documentSigningFacade.streamPublicUnsignedDocument(extractBearerToken(authorization));

      res.set({
        'Content-Type': document.contentType,
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Content-Length': document.contentLength,
      });

      document.stream.pipe(res);
    } catch (error) {
      throw mapPublicSigningError(error);
    }
  }
}

function extractBearerToken(authorization?: string): string {
  const [scheme, token] = authorization?.trim().split(/\s+/, 2) ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new ProblemException(
      HttpStatus.UNAUTHORIZED,
      'Signing Token Required',
      'Authorization header must contain a Bearer signing token.',
      'errors://signing-token-required',
    );
  }

  return token;
}

function mapPublicSigningError(error: unknown): Error {
  if (error instanceof ProblemException) {
    return error;
  }

  if (error instanceof SigningSessionTokenNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof SigningSessionExpiredError) {
    return new GoneException(error.message);
  }

  if (error instanceof SigningSessionUnavailableError) {
    return new ProblemException(
      HttpStatus.CONFLICT,
      'Signing Session Unavailable',
      error.message,
      'errors://signing-session-unavailable',
    );
  }

  if (error instanceof UnsignedSigningArtifactNotFoundError) {
    return new ProblemException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Signing Artifact Missing',
      error.message,
      'errors://signing-artifact-missing',
    );
  }

  return error as Error;
}
