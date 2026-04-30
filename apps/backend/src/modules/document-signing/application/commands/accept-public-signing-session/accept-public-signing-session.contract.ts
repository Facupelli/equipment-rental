import {
  SignedOrderAgreementRenderingFailedError,
  SigningAcceptanceConfirmationRequiredError,
  SigningAcceptanceIdentityRequiredError,
  SigningSessionDocumentNotPresentedError,
  SigningSessionExpiredError,
  SigningSessionStatusTransitionNotAllowedError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

const SIGNING_ACCEPTANCE_CHANNEL = 'email_link' as const;

export interface AcceptPublicSigningInput {
  rawToken: string;
  declaredFullName: string;
  declaredDocumentNumber: string;
  acceptanceTextVersion: string;
  accepted: boolean;
}

export interface AcceptPublicSigningResult {
  sessionId: string;
  status: 'SIGNED';
  acceptedAt: Date;
  agreementHash: string;
  channel: typeof SIGNING_ACCEPTANCE_CHANNEL;
  finalCopyDelivery: {
    status: 'SENT' | 'FAILED';
    failureReason: string | null;
    failureMessage: string | null;
  };
}

export type AcceptPublicSigningError =
  | SigningAcceptanceConfirmationRequiredError
  | SigningAcceptanceIdentityRequiredError
  | SigningSessionDocumentNotPresentedError
  | SigningSessionExpiredError
  | SigningSessionStatusTransitionNotAllowedError
  | SigningSessionTokenNotFoundError
  | SigningSessionUnavailableError
  | SignedOrderAgreementRenderingFailedError
  | UnsignedSigningArtifactNotFoundError;
