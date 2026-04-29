import {
  Body,
  ConflictException,
  Controller,
  GoneException,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Result } from 'neverthrow';

import { Public } from 'src/core/decorators/public.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import {
  SigningAcceptanceConfirmationRequiredError,
  SigningAcceptanceIdentityRequiredError,
  SigningSessionDocumentNotPresentedError,
  SigningSessionExpiredError,
  SigningSessionStatusTransitionNotAllowedError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

import { AcceptPublicSigningError, AcceptPublicSigningResult } from '../../document-signing.facade';
import { AcceptPublicSigningSessionCommand } from './accept-public-signing-session.command';
import { AcceptPublicSigningSessionBodyDto } from './accept-public-signing-session.request.dto';
import { AcceptPublicSigningSessionResponseDto } from './accept-public-signing-session.response.dto';

@Public()
@Controller('document-signing/public/sessions')
export class AcceptPublicSigningSessionHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('me/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: AcceptPublicSigningSessionBodyDto,
  ): Promise<AcceptPublicSigningSessionResponseDto> {
    const result = await this.commandBus.execute<
      AcceptPublicSigningSessionCommand,
      Result<AcceptPublicSigningResult, AcceptPublicSigningError>
    >(
      new AcceptPublicSigningSessionCommand(
        extractBearerToken(authorization),
        body.declaredFullName,
        body.declaredDocumentNumber,
        body.acceptanceTextVersion,
        body.accepted,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof SigningSessionTokenNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof SigningSessionExpiredError) {
        throw new GoneException(error.message);
      }

      if (error instanceof SigningSessionUnavailableError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof SigningSessionStatusTransitionNotAllowedError) {
        throw new ConflictException(error.message);
      }

      if (
        error instanceof SigningAcceptanceConfirmationRequiredError ||
        error instanceof SigningAcceptanceIdentityRequiredError ||
        error instanceof SigningSessionDocumentNotPresentedError
      ) {
        throw new UnprocessableEntityException(error.message);
      }

      if (error instanceof UnsignedSigningArtifactNotFoundError) {
        throw new ProblemException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Signing Artifact Missing',
          error.message,
          'errors://signing-artifact-missing',
        );
      }

      throw error;
    }

    return result.value;
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
