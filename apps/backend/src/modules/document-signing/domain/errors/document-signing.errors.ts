import { DomainError } from 'src/core/exceptions/domain.error';

export class DocumentSigningError extends DomainError {}

export class SigningSessionStatusTransitionNotAllowedError extends DocumentSigningError {
  constructor(sessionId: string, from: string, to: string) {
    super(`Signing session '${sessionId}' cannot transition from '${from}' to '${to}'.`);
  }
}

export class DuplicateSigningArtifactKindError extends DocumentSigningError {
  constructor(sessionId: string, kind: string) {
    super(`Signing session '${sessionId}' already has an artifact with kind '${kind}'.`);
  }
}

export class DuplicateSigningAuditSequenceError extends DocumentSigningError {
  constructor(sessionId: string, sequence: number) {
    super(`Signing session '${sessionId}' already has an audit event with sequence '${sequence}'.`);
  }
}

export class SigningInvitationRecipientEmailRequiredError extends DocumentSigningError {
  constructor(orderId: string) {
    super(`Order '${orderId}' must provide a recipient email before a signing invitation can be sent.`);
  }
}

export class SigningInvitationEmailDeliveryFailedError extends DocumentSigningError {
  constructor(message: string) {
    super(message);
  }
}

export class SigningSessionTokenNotFoundError extends DocumentSigningError {
  constructor() {
    super('Signing session was not found for the provided token.');
  }
}

export class SigningSessionExpiredError extends DocumentSigningError {
  constructor(sessionId: string) {
    super(`Signing session '${sessionId}' has expired.`);
  }
}

export class SigningSessionUnavailableError extends DocumentSigningError {
  constructor(sessionId: string, status: string) {
    super(`Signing session '${sessionId}' is not available for public signing because it is '${status}'.`);
  }
}

export class UnsignedSigningArtifactNotFoundError extends DocumentSigningError {
  constructor(sessionId: string) {
    super(`Signing session '${sessionId}' does not have a frozen unsigned PDF artifact.`);
  }
}

export class SignedSigningArtifactNotFoundError extends DocumentSigningError {
  constructor(sessionId: string) {
    super(`Signing session '${sessionId}' does not have a final signed PDF artifact.`);
  }
}

export class SigningAcceptanceConfirmationRequiredError extends DocumentSigningError {
  constructor() {
    super('Signing acceptance requires explicit confirmation from the signer.');
  }
}

export class SigningAcceptanceIdentityRequiredError extends DocumentSigningError {
  constructor(field: 'declaredFullName' | 'declaredDocumentNumber' | 'acceptanceTextVersion') {
    super(`Signing acceptance requires a non-empty '${field}'.`);
  }
}

export class SigningSessionDocumentNotPresentedError extends DocumentSigningError {
  constructor(sessionId: string) {
    super(`Signing session '${sessionId}' cannot be accepted before the frozen unsigned document is presented.`);
  }
}

export class FinalCopyAccessTokenNotFoundError extends DocumentSigningError {
  constructor() {
    super('Final copy access token was not found for the provided token.');
  }
}

export class FinalCopyAccessTokenExpiredError extends DocumentSigningError {
  constructor(sessionId: string) {
    super(`Final copy access token for signing session '${sessionId}' has expired.`);
  }
}

export class FinalCopyAccessTokenAlreadyUsedError extends DocumentSigningError {
  constructor(sessionId: string) {
    super(`Final copy access token for signing session '${sessionId}' has already been used.`);
  }
}
