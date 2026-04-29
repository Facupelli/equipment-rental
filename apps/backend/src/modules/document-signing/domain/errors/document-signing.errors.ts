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
