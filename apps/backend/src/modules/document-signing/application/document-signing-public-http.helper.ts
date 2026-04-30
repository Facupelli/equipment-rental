import { ConflictException, GoneException, HttpStatus, NotFoundException } from '@nestjs/common';

import { ProblemException } from 'src/core/exceptions/problem.exception';
import {
  FinalCopyAccessTokenAlreadyUsedError,
  FinalCopyAccessTokenExpiredError,
  FinalCopyAccessTokenNotFoundError,
  SignedOrderAgreementRenderingFailedError,
  SignedSigningArtifactNotFoundError,
  SigningSessionExpiredError,
  SigningSessionStatusTransitionNotAllowedError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

type MapDocumentSigningPublicHttpErrorOptions = {
  signingSessionUnavailableAsProblemException?: boolean;
};

export function extractBearerToken(authorization?: string): string {
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

export function mapDocumentSigningPublicHttpError(
  error: unknown,
  options: MapDocumentSigningPublicHttpErrorOptions = {},
): Error {
  if (error instanceof ProblemException) {
    return error;
  }

  if (error instanceof SigningSessionTokenNotFoundError || error instanceof FinalCopyAccessTokenNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof SigningSessionExpiredError ||
    error instanceof FinalCopyAccessTokenExpiredError ||
    error instanceof FinalCopyAccessTokenAlreadyUsedError
  ) {
    return new GoneException(error.message);
  }

  if (error instanceof SigningSessionUnavailableError) {
    if (options.signingSessionUnavailableAsProblemException) {
      return new ProblemException(
        HttpStatus.CONFLICT,
        'Signing Session Unavailable',
        error.message,
        'errors://signing-session-unavailable',
      );
    }

    return new ConflictException(error.message);
  }

  if (error instanceof SigningSessionStatusTransitionNotAllowedError) {
    return new ConflictException(error.message);
  }

  if (error instanceof UnsignedSigningArtifactNotFoundError) {
    return new ProblemException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Signing Artifact Missing',
      error.message,
      'errors://signing-artifact-missing',
    );
  }

  if (error instanceof SignedSigningArtifactNotFoundError) {
    return new ProblemException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Signed Artifact Missing',
      error.message,
      'errors://signed-artifact-missing',
    );
  }

  if (error instanceof SignedOrderAgreementRenderingFailedError) {
    return new ProblemException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Signed Agreement Rendering Failed',
      error.message,
      'errors://signed-agreement-rendering-failed',
    );
  }

  return error as Error;
}
