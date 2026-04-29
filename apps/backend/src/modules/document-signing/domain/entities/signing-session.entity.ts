import { randomUUID } from 'crypto';

import { err, ok, Result } from 'neverthrow';
import { DomainException } from 'src/core/exceptions/domain.exception';
import { SigningDocumentType, SigningSessionStatus } from 'src/generated/prisma/client';

import {
  DuplicateSigningArtifactKindError,
  DuplicateSigningAuditSequenceError,
  SigningAcceptanceIdentityRequiredError,
  SigningSessionDocumentNotPresentedError,
  SigningSessionStatusTransitionNotAllowedError,
} from '../errors/document-signing.errors';
import { SigningArtifactMetadata } from './signing-artifact-metadata.entity';
import { SigningAuditEvent } from './signing-audit-event.entity';

const ALLOWED_TRANSITIONS: Record<SigningSessionStatus, SigningSessionStatus[]> = {
  [SigningSessionStatus.PENDING]: [
    SigningSessionStatus.OPENED,
    SigningSessionStatus.EXPIRED,
    SigningSessionStatus.VOIDED,
  ],
  [SigningSessionStatus.OPENED]: [
    SigningSessionStatus.SIGNED,
    SigningSessionStatus.EXPIRED,
    SigningSessionStatus.VOIDED,
  ],
  [SigningSessionStatus.SIGNED]: [],
  [SigningSessionStatus.EXPIRED]: [],
  [SigningSessionStatus.VOIDED]: [],
};

export interface CreateSigningSessionProps {
  tenantId: string;
  orderId: string;
  customerId?: string | null;
  documentType: SigningDocumentType;
  recipientEmail: string;
  unsignedDocumentHash: string;
  tokenHash: string;
  expiresAt: Date;
  declaredFullName?: string | null;
  declaredDocumentNumber?: string | null;
  acceptanceTextVersion?: string | null;
  agreementHash?: string | null;
}

export interface ReconstituteSigningSessionProps {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string | null;
  documentType: SigningDocumentType;
  recipientEmail: string;
  unsignedDocumentHash: string;
  tokenHash: string;
  status: SigningSessionStatus;
  expiresAt: Date;
  openedAt: Date | null;
  signedAt: Date | null;
  declaredFullName: string | null;
  declaredDocumentNumber: string | null;
  acceptanceTextVersion: string | null;
  agreementHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  artifacts: SigningArtifactMetadata[];
  auditEvents: SigningAuditEvent[];
}

export class SigningSession {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly orderId: string,
    public readonly customerId: string | null,
    public readonly documentType: SigningDocumentType,
    private recipientEmail: string,
    private unsignedDocumentHash: string,
    private tokenHash: string,
    private status: SigningSessionStatus,
    public readonly expiresAt: Date,
    private openedAt: Date | null,
    private signedAt: Date | null,
    private declaredFullName: string | null,
    private declaredDocumentNumber: string | null,
    private acceptanceTextVersion: string | null,
    private agreementHash: string | null,
    public readonly createdAt: Date,
    private updatedAt: Date,
    private readonly artifacts: SigningArtifactMetadata[],
    private readonly auditEvents: SigningAuditEvent[],
  ) {}

  static create(props: CreateSigningSessionProps): SigningSession {
    const now = new Date();

    return SigningSession.reconstitute({
      id: randomUUID(),
      tenantId: SigningSession.assertNonEmpty('tenantId', props.tenantId),
      orderId: SigningSession.assertNonEmpty('orderId', props.orderId),
      customerId: props.customerId ?? null,
      documentType: props.documentType,
      recipientEmail: SigningSession.assertNonEmpty('recipientEmail', props.recipientEmail),
      unsignedDocumentHash: SigningSession.assertNonEmpty('unsignedDocumentHash', props.unsignedDocumentHash),
      tokenHash: SigningSession.assertNonEmpty('tokenHash', props.tokenHash),
      status: SigningSessionStatus.PENDING,
      expiresAt: props.expiresAt,
      openedAt: null,
      signedAt: null,
      declaredFullName: props.declaredFullName?.trim() || null,
      declaredDocumentNumber: props.declaredDocumentNumber?.trim() || null,
      acceptanceTextVersion: props.acceptanceTextVersion?.trim() || null,
      agreementHash: props.agreementHash?.trim() || null,
      createdAt: now,
      updatedAt: now,
      artifacts: [],
      auditEvents: [],
    });
  }

  static reconstitute(props: ReconstituteSigningSessionProps): SigningSession {
    SigningSession.assertUniqueArtifactKinds(props.id, props.artifacts);
    SigningSession.assertUniqueAuditSequences(props.id, props.auditEvents);

    return new SigningSession(
      props.id,
      SigningSession.assertNonEmpty('tenantId', props.tenantId),
      SigningSession.assertNonEmpty('orderId', props.orderId),
      props.customerId,
      props.documentType,
      SigningSession.assertNonEmpty('recipientEmail', props.recipientEmail),
      SigningSession.assertNonEmpty('unsignedDocumentHash', props.unsignedDocumentHash),
      SigningSession.assertNonEmpty('tokenHash', props.tokenHash),
      props.status,
      props.expiresAt,
      props.openedAt,
      props.signedAt,
      props.declaredFullName,
      props.declaredDocumentNumber,
      props.acceptanceTextVersion,
      props.agreementHash,
      props.createdAt,
      props.updatedAt,
      [...props.artifacts],
      [...props.auditEvents],
    );
  }

  get currentRecipientEmail(): string {
    return this.recipientEmail;
  }

  get currentUnsignedDocumentHash(): string {
    return this.unsignedDocumentHash;
  }

  get currentTokenHash(): string {
    return this.tokenHash;
  }

  get currentStatus(): SigningSessionStatus {
    return this.status;
  }

  get openedOn(): Date | null {
    return this.openedAt;
  }

  get signedOn(): Date | null {
    return this.signedAt;
  }

  get currentDeclaredFullName(): string | null {
    return this.declaredFullName;
  }

  get currentDeclaredDocumentNumber(): string | null {
    return this.declaredDocumentNumber;
  }

  get currentAcceptanceTextVersion(): string | null {
    return this.acceptanceTextVersion;
  }

  get currentAgreementHash(): string | null {
    return this.agreementHash;
  }

  get updatedOn(): Date {
    return this.updatedAt;
  }

  getArtifacts(): SigningArtifactMetadata[] {
    return [...this.artifacts];
  }

  getAuditEvents(): SigningAuditEvent[] {
    return [...this.auditEvents];
  }

  markOpened(openedAt: Date): Result<void, SigningSessionStatusTransitionNotAllowedError> {
    const transition = this.transitionTo(SigningSessionStatus.OPENED);
    if (transition.isErr()) {
      return transition;
    }

    this.openedAt = openedAt;
    this.touch(openedAt);
    return ok(undefined);
  }

  markSigned(props: {
    signedAt: Date;
    declaredFullName: string;
    declaredDocumentNumber: string;
    acceptanceTextVersion: string;
    agreementHash: string;
  }): Result<
    void,
    | SigningSessionStatusTransitionNotAllowedError
    | SigningAcceptanceIdentityRequiredError
    | SigningSessionDocumentNotPresentedError
  > {
    if (!this.openedAt) {
      return err(new SigningSessionDocumentNotPresentedError(this.id));
    }

    const declaredFullName = this.normalizeRequiredString('declaredFullName', props.declaredFullName);
    if (declaredFullName.isErr()) {
      return err(declaredFullName.error);
    }

    const declaredDocumentNumber = this.normalizeRequiredString(
      'declaredDocumentNumber',
      props.declaredDocumentNumber,
    );
    if (declaredDocumentNumber.isErr()) {
      return err(declaredDocumentNumber.error);
    }

    const acceptanceTextVersion = this.normalizeRequiredString(
      'acceptanceTextVersion',
      props.acceptanceTextVersion,
    );
    if (acceptanceTextVersion.isErr()) {
      return err(acceptanceTextVersion.error);
    }

    const transition = this.transitionTo(SigningSessionStatus.SIGNED);
    if (transition.isErr()) {
      return transition;
    }

    this.signedAt = props.signedAt;
    this.declaredFullName = declaredFullName.value;
    this.declaredDocumentNumber = declaredDocumentNumber.value;
    this.acceptanceTextVersion = acceptanceTextVersion.value;
    this.agreementHash = SigningSession.assertNonEmpty('agreementHash', props.agreementHash);
    this.touch(props.signedAt);
    return ok(undefined);
  }

  expire(at: Date): Result<void, SigningSessionStatusTransitionNotAllowedError> {
    const transition = this.transitionTo(SigningSessionStatus.EXPIRED);
    if (transition.isErr()) {
      return transition;
    }

    this.touch(at);
    return ok(undefined);
  }

  refreshInvitation(props: { recipientEmail: string; tokenHash: string }, at = new Date()): void {
    this.recipientEmail = SigningSession.assertNonEmpty('recipientEmail', props.recipientEmail);
    this.tokenHash = SigningSession.assertNonEmpty('tokenHash', props.tokenHash);
    this.touch(at);
  }

  void(at: Date): Result<void, SigningSessionStatusTransitionNotAllowedError> {
    const transition = this.transitionTo(SigningSessionStatus.VOIDED);
    if (transition.isErr()) {
      return transition;
    }

    this.touch(at);
    return ok(undefined);
  }

  addArtifact(artifact: SigningArtifactMetadata): Result<void, DuplicateSigningArtifactKindError> {
    const hasDuplicate = this.artifacts.some((existing) => existing.kind === artifact.kind);

    if (hasDuplicate) {
      return err(new DuplicateSigningArtifactKindError(this.id, artifact.kind));
    }

    this.artifacts.push(artifact);
    this.touch();
    return ok(undefined);
  }

  addAuditEvent(event: SigningAuditEvent): Result<void, DuplicateSigningAuditSequenceError> {
    const hasDuplicate = this.auditEvents.some((existing) => existing.sequence === event.sequence);

    if (hasDuplicate) {
      return err(new DuplicateSigningAuditSequenceError(this.id, event.sequence));
    }

    this.auditEvents.push(event);
    this.auditEvents.sort((left, right) => left.sequence - right.sequence);
    this.touch(event.occurredAt);
    return ok(undefined);
  }

  private transitionTo(next: SigningSessionStatus): Result<void, SigningSessionStatusTransitionNotAllowedError> {
    const allowed = ALLOWED_TRANSITIONS[this.status];

    if (!allowed.includes(next)) {
      return err(new SigningSessionStatusTransitionNotAllowedError(this.id, this.status, next));
    }

    this.status = next;
    return ok(undefined);
  }

  private touch(at = new Date()): void {
    this.updatedAt = at;
  }

  private normalizeRequiredString(
    field: 'declaredFullName' | 'declaredDocumentNumber' | 'acceptanceTextVersion',
    value: string,
  ): Result<string, SigningAcceptanceIdentityRequiredError> {
    const normalized = value.trim();

    if (normalized.length === 0) {
      return err(new SigningAcceptanceIdentityRequiredError(field));
    }

    return ok(normalized);
  }

  private static assertUniqueArtifactKinds(sessionId: string, artifacts: SigningArtifactMetadata[]): void {
    const seenKinds = new Set<SigningArtifactMetadata['kind']>();

    for (const artifact of artifacts) {
      if (seenKinds.has(artifact.kind)) {
        throw new DuplicateSigningArtifactKindError(sessionId, artifact.kind);
      }

      seenKinds.add(artifact.kind);
    }
  }

  private static assertUniqueAuditSequences(sessionId: string, auditEvents: SigningAuditEvent[]): void {
    const seenSequences = new Set<number>();

    for (const auditEvent of auditEvents) {
      if (seenSequences.has(auditEvent.sequence)) {
        throw new DuplicateSigningAuditSequenceError(sessionId, auditEvent.sequence);
      }

      seenSequences.add(auditEvent.sequence);
    }
  }

  private static assertNonEmpty(name: string, value: string): string {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new DomainException(`SigningSession ${name} cannot be empty.`);
    }

    return normalized;
  }
}
