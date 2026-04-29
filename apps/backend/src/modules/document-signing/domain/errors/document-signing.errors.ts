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
