import { createHash, randomBytes } from 'crypto';
import { Readable } from 'stream';

import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '@repo/schemas';
import { Result, err, ok } from 'neverthrow';

import { Env } from 'src/config/env.schema';
import {
  SigningArtifactKind,
  SigningAuditEventType,
  SigningDocumentType,
  SigningSessionStatus,
} from 'src/generated/prisma/client';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';
import { NotificationOrchestrator } from 'src/modules/notifications/application/notification-orchestrator.service';
import { NotificationChannel } from 'src/modules/notifications/domain/notification-channel.enum';
import { NotificationType } from 'src/modules/notifications/domain/notification-type.enum';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import {
  OrderNotFoundError,
  OrderSigningAllowedOnlyForConfirmedOrdersError,
} from 'src/modules/order/domain/errors/order.errors';
import { PrepareOrderAgreementForSigningQuery } from 'src/modules/order/public/queries/prepare-order-agreement-for-signing.query';
import { OrderAgreementForSigningReadModel } from 'src/modules/order/public/read-models/order-agreement-for-signing.read-model';

import {
  DocumentSigningPublicApi,
  PrepareSigningSessionInput,
  PrepareSigningSessionResult,
} from '../document-signing.public-api';
import { SigningArtifactMetadata } from '../domain/entities/signing-artifact-metadata.entity';
import { SigningAuditEvent, SigningAuditPayload } from '../domain/entities/signing-audit-event.entity';
import { SigningSession } from '../domain/entities/signing-session.entity';
import {
  SigningInvitationEmailDeliveryFailedError,
  SigningInvitationRecipientEmailRequiredError,
  SigningSessionExpiredError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from '../domain/errors/document-signing.errors';
import { SigningArtifactStorage } from '../domain/value-objects/signing-artifact-storage.value-object';
import { SigningSessionRepository } from '../infrastructure/persistence/repositories/signing-session.repository';

const PDF_CONTENT_TYPE = 'application/pdf';

export interface SendSigningInvitationInput {
  tenantId: string;
  orderId: string;
  documentType: SigningDocumentType;
  recipientEmail?: string | null;
}

export interface SendSigningInvitationResult {
  sessionId: string;
  documentNumber: string;
  recipientEmail: string;
  expiresAt: Date;
  unsignedDocumentHash: string;
  reusedExistingSession: boolean;
}

export interface PublicSigningSessionReadModel {
  sessionId: string;
  documentType: SigningDocumentType;
  status: SigningSessionStatus;
  expiresAt: Date;
  openedAt: Date | null;
  document: {
    artifactId: string;
    kind: 'UNSIGNED_PDF';
    documentNumber: string;
    displayFileName: string;
    contentType: string;
    byteSize: number;
    sha256: string;
  };
  prefilledSigner: {
    fullName: string | null;
    documentNumber: string | null;
  };
}

export interface PublicSigningDocumentStream {
  fileName: string;
  contentType: string;
  contentLength: number;
  stream: Readable;
}

type PrepareOrderAgreementForSigningResult = Result<
  OrderAgreementForSigningReadModel,
  ContractCustomerProfileMissingError | OrderNotFoundError | OrderSigningAllowedOnlyForConfirmedOrdersError
>;

@Injectable()
export class DocumentSigningFacade implements DocumentSigningPublicApi {
  private readonly bucketName: string;
  private readonly rootDomain: string;
  private readonly signingSessionTtlSeconds: number;

  constructor(
    private readonly signingSessionRepository: SigningSessionRepository,
    private readonly objectStorage: ObjectStoragePort,
    private readonly notificationOrchestrator: NotificationOrchestrator,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.bucketName = this.configService.get('R2_BUCKET_NAME');
    this.rootDomain = this.configService.get('ROOT_DOMAIN');
    this.signingSessionTtlSeconds = this.configService.get('DOCUMENT_SIGNING_SESSION_TTL_SECONDS');
  }

  async prepareSigningSession(input: PrepareSigningSessionInput): Promise<PrepareSigningSessionResult> {
    return this.ensureSessionForPreparedDocument({
      tenantId: input.tenantId,
      orderId: input.orderId,
      customerId: input.customerId ?? null,
      documentType: input.documentType,
      recipientEmail: input.recipientEmail,
      rawToken: input.rawToken,
      expiresAt: input.expiresAt,
      documentNumber: input.documentNumber,
      fileName: input.fileName,
      pdfBytes: input.pdfBytes,
    });
  }

  async sendSigningInvitation(
    input: SendSigningInvitationInput,
  ): Promise<
    Result<
      SendSigningInvitationResult,
      | ContractCustomerProfileMissingError
      | OrderNotFoundError
      | OrderSigningAllowedOnlyForConfirmedOrdersError
      | SigningInvitationRecipientEmailRequiredError
      | SigningInvitationEmailDeliveryFailedError
    >
  > {
    const preparedOrder = await this.queryBus.execute<
      PrepareOrderAgreementForSigningQuery,
      PrepareOrderAgreementForSigningResult
    >(new PrepareOrderAgreementForSigningQuery(input.tenantId, input.orderId));

    if (preparedOrder.isErr()) {
      return err(preparedOrder.error);
    }

    const tenant = await this.queryBus.execute<FindTenantByIdQuery, TenantContext | null>(
      new FindTenantByIdQuery(input.tenantId),
    );
    if (!tenant) {
      throw new Error(`Tenant '${input.tenantId}' was not found.`);
    }

    const recipientEmail =
      normalizeRecipientEmail(input.recipientEmail) ?? normalizeRecipientEmail(preparedOrder.value.customerEmail);
    if (!recipientEmail) {
      return err(new SigningInvitationRecipientEmailRequiredError(input.orderId));
    }

    const now = new Date();
    const activeSession = await this.loadActiveSessionAfterExpiringIfNeeded(
      input.tenantId,
      input.orderId,
      input.documentType,
      now,
    );
    const unsignedDocumentHash = hashBuffer(preparedOrder.value.buffer);
    const rawToken = generateRawSigningToken();
    const tokenHash = hashString(rawToken);

    if (activeSession && activeSession.currentUnsignedDocumentHash === unsignedDocumentHash) {
      activeSession.refreshInvitation({ recipientEmail, tokenHash }, now);
      this.appendAuditEvent(activeSession, SigningAuditEventType.INVITATION_EMAIL_REQUESTED, {
        recipientEmail,
        documentType: input.documentType,
        unsignedDocumentHash,
        expiresAt: activeSession.expiresAt.toISOString(),
        resend: true,
        tokenRotated: true,
      });

      const deliveryError = await this.dispatchInvitationEmail({
        tenant,
        session: activeSession,
        documentType: input.documentType,
        documentNumber: preparedOrder.value.documentNumber,
        rawToken,
        recipientEmail,
        unsignedDocumentHash,
        resend: true,
      });

      await this.signingSessionRepository.save(activeSession);

      if (deliveryError) {
        return err(deliveryError);
      }

      return ok({
        sessionId: activeSession.id,
        documentNumber: preparedOrder.value.documentNumber,
        recipientEmail,
        expiresAt: activeSession.expiresAt,
        unsignedDocumentHash,
        reusedExistingSession: true,
      });
    }

    if (activeSession) {
      this.appendAuditEvent(activeSession, SigningAuditEventType.SESSION_VOIDED, {
        reason: 'ORDER_DOCUMENT_CHANGED',
        supersededByDocumentHash: unsignedDocumentHash,
      });

      const voidResult = activeSession.void(now);
      if (voidResult.isErr()) {
        throw voidResult.error;
      }

      await this.signingSessionRepository.save(activeSession);
    }

    const expiresAt = new Date(now.getTime() + this.signingSessionTtlSeconds * 1000);
    const sessionResult = await this.ensureSessionForPreparedDocument({
      tenantId: input.tenantId,
      orderId: input.orderId,
      customerId: preparedOrder.value.customerId,
      documentType: input.documentType,
      recipientEmail,
      rawToken,
      expiresAt,
      documentNumber: preparedOrder.value.documentNumber,
      fileName: preparedOrder.value.fileName,
      pdfBytes: preparedOrder.value.buffer,
      skipActiveSessionLookup: true,
    });
    const session = await this.signingSessionRepository.load(sessionResult.sessionId, input.tenantId);

    if (!session) {
      throw new Error(`Signing session '${sessionResult.sessionId}' was not found after creation.`);
    }

    this.appendAuditEvent(session, SigningAuditEventType.INVITATION_EMAIL_REQUESTED, {
      recipientEmail,
      documentType: input.documentType,
      unsignedDocumentHash: sessionResult.unsignedDocumentHash,
      expiresAt: session.expiresAt.toISOString(),
      resend: false,
      tokenRotated: false,
    });

    const deliveryError = await this.dispatchInvitationEmail({
      tenant,
      session,
      documentType: input.documentType,
      documentNumber: preparedOrder.value.documentNumber,
      rawToken,
      recipientEmail,
      unsignedDocumentHash: sessionResult.unsignedDocumentHash,
      resend: false,
    });

    await this.signingSessionRepository.save(session);

    if (deliveryError) {
      return err(deliveryError);
    }

    return ok({
      sessionId: session.id,
      documentNumber: preparedOrder.value.documentNumber,
      recipientEmail,
      expiresAt: session.expiresAt,
      unsignedDocumentHash: sessionResult.unsignedDocumentHash,
      reusedExistingSession: false,
    });
  }

  async resolvePublicSigningSession(rawToken: string): Promise<{ sessionId: string }> {
    const session = await this.requirePublicSessionByRawToken(rawToken);
    return { sessionId: session.id };
  }

  async getPublicSigningSession(rawToken: string): Promise<PublicSigningSessionReadModel> {
    const session = await this.requirePublicSessionByRawToken(rawToken);
    const artifact = this.requireUnsignedArtifact(session);

    return {
      sessionId: session.id,
      documentType: session.documentType,
      status: session.currentStatus,
      expiresAt: session.expiresAt,
      openedAt: session.openedOn,
      document: {
        artifactId: artifact.id,
        kind: SigningArtifactKind.UNSIGNED_PDF,
        documentNumber: artifact.documentNumber,
        displayFileName: artifact.displayFileName,
        contentType: artifact.storage.contentType,
        byteSize: artifact.storage.byteSize,
        sha256: artifact.storage.sha256,
      },
      prefilledSigner: {
        fullName: session.currentDeclaredFullName,
        documentNumber: session.currentDeclaredDocumentNumber,
      },
    };
  }

  async streamPublicUnsignedDocument(rawToken: string): Promise<PublicSigningDocumentStream> {
    const session = await this.requirePublicSessionByRawToken(rawToken);
    const artifact = this.requireUnsignedArtifact(session);
    const stream = await this.objectStorage.getObjectStream({ key: artifact.storage.objectKey });
    const now = new Date();

    if (session.currentStatus === SigningSessionStatus.PENDING) {
      const markOpenedResult = session.markOpened(now);
      if (markOpenedResult.isErr()) {
        throw markOpenedResult.error;
      }

      this.appendAuditEvent(session, SigningAuditEventType.SESSION_OPENED, {
        openedAt: now.toISOString(),
        artifactId: artifact.id,
        kind: artifact.kind,
        sha256: artifact.storage.sha256,
      });
    }

    this.appendAuditEvent(session, SigningAuditEventType.DOCUMENT_PRESENTED, {
      artifactId: artifact.id,
      kind: artifact.kind,
      documentNumber: artifact.documentNumber,
      displayFileName: artifact.displayFileName,
      contentType: artifact.storage.contentType,
      byteSize: artifact.storage.byteSize,
      sha256: artifact.storage.sha256,
      presentedAt: now.toISOString(),
    });

    await this.signingSessionRepository.save(session);

    return {
      fileName: artifact.displayFileName,
      contentType: artifact.storage.contentType,
      contentLength: artifact.storage.byteSize,
      stream,
    };
  }

  private async ensureSessionForPreparedDocument(input: {
    tenantId: string;
    orderId: string;
    customerId: string | null;
    documentType: SigningDocumentType;
    recipientEmail: string;
    rawToken: string;
    expiresAt: Date;
    documentNumber: string;
    fileName: string;
    pdfBytes: Buffer;
    skipActiveSessionLookup?: boolean;
  }): Promise<PrepareSigningSessionResult> {
    const unsignedDocumentHash = hashBuffer(input.pdfBytes);
    const activeSession = input.skipActiveSessionLookup
      ? null
      : await this.signingSessionRepository.loadActiveByOrderDocumentType(
          input.tenantId,
          input.orderId,
          input.documentType,
        );

    if (activeSession && activeSession.currentUnsignedDocumentHash === unsignedDocumentHash) {
      return {
        sessionId: activeSession.id,
        unsignedDocumentHash,
        reusedExistingSession: true,
      };
    }

    if (activeSession) {
      this.appendAuditEvent(activeSession, SigningAuditEventType.SESSION_VOIDED, {
        reason: 'ORDER_DOCUMENT_CHANGED',
        supersededByDocumentHash: unsignedDocumentHash,
      });

      const voidResult = activeSession.void(new Date());
      if (voidResult.isErr()) {
        throw voidResult.error;
      }

      await this.signingSessionRepository.save(activeSession);
    }

    const session = SigningSession.create({
      tenantId: input.tenantId,
      orderId: input.orderId,
      customerId: input.customerId,
      documentType: input.documentType,
      recipientEmail: input.recipientEmail,
      unsignedDocumentHash,
      tokenHash: hashString(input.rawToken),
      expiresAt: input.expiresAt,
    });

    const storage = await this.recordUnsignedArtifact({
      tenantId: input.tenantId,
      orderId: input.orderId,
      sessionId: session.id,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      fileName: input.fileName,
      pdfBytes: input.pdfBytes,
      unsignedDocumentHash,
    });

    const artifact = SigningArtifactMetadata.create({
      sessionId: session.id,
      kind: SigningArtifactKind.UNSIGNED_PDF,
      documentNumber: input.documentNumber,
      displayFileName: `${input.fileName}.pdf`,
      storage,
    });
    const addArtifactResult = session.addArtifact(artifact);
    if (addArtifactResult.isErr()) {
      throw addArtifactResult.error;
    }

    this.appendAuditEvent(session, SigningAuditEventType.SESSION_CREATED, {
      documentType: input.documentType,
      recipientEmail: input.recipientEmail,
      expiresAt: input.expiresAt.toISOString(),
      unsignedDocumentHash,
    });
    this.appendAuditEvent(session, SigningAuditEventType.ARTIFACT_RECORDED, {
      kind: SigningArtifactKind.UNSIGNED_PDF,
      documentNumber: input.documentNumber,
      fileName: `${input.fileName}.pdf`,
      bucket: storage.bucket,
      objectKey: storage.objectKey,
      contentType: storage.contentType,
      byteSize: storage.byteSize,
      sha256: storage.sha256,
    });

    await this.signingSessionRepository.save(session);

    return {
      sessionId: session.id,
      unsignedDocumentHash,
      reusedExistingSession: false,
    };
  }

  private async recordUnsignedArtifact(input: {
    tenantId: string;
    orderId: string;
    sessionId: string;
    documentType: SigningDocumentType;
    documentNumber: string;
    fileName: string;
    pdfBytes: Buffer;
    unsignedDocumentHash: string;
  }): Promise<SigningArtifactStorage> {
    const objectKey = buildUnsignedArtifactObjectKey({
      tenantId: input.tenantId,
      orderId: input.orderId,
      sessionId: input.sessionId,
      fileName: input.fileName,
    });

    await this.objectStorage.putObject({
      key: objectKey,
      body: input.pdfBytes,
      contentType: PDF_CONTENT_TYPE,
      metadata: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        sessionId: input.sessionId,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        sha256: input.unsignedDocumentHash,
      },
    });

    return new SigningArtifactStorage({
      bucket: this.bucketName,
      objectKey,
      contentType: PDF_CONTENT_TYPE,
      byteSize: input.pdfBytes.length,
      sha256: input.unsignedDocumentHash,
    });
  }

  private async loadActiveSessionAfterExpiringIfNeeded(
    tenantId: string,
    orderId: string,
    documentType: SigningDocumentType,
    now: Date,
  ): Promise<SigningSession | null> {
    const activeSession = await this.signingSessionRepository.loadActiveByOrderDocumentType(
      tenantId,
      orderId,
      documentType,
    );
    if (!activeSession) {
      return null;
    }

    if (activeSession.expiresAt.getTime() > now.getTime()) {
      return activeSession;
    }

    if (
      activeSession.currentStatus === SigningSessionStatus.PENDING ||
      activeSession.currentStatus === SigningSessionStatus.OPENED
    ) {
      this.appendAuditEvent(activeSession, SigningAuditEventType.SESSION_EXPIRED, {
        expiredAt: now.toISOString(),
        previousStatus: activeSession.currentStatus,
      });

      const expireResult = activeSession.expire(now);
      if (expireResult.isErr()) {
        throw expireResult.error;
      }

      await this.signingSessionRepository.save(activeSession);
    }

    return null;
  }

  private async dispatchInvitationEmail(input: {
    tenant: TenantContext;
    session: SigningSession;
    documentType: SigningDocumentType;
    documentNumber: string;
    rawToken: string;
    recipientEmail: string;
    unsignedDocumentHash: string;
    resend: boolean;
  }): Promise<SigningInvitationEmailDeliveryFailedError | null> {
    const signingUrl = buildPortalSigningUrl(input.tenant, this.rootDomain, input.rawToken);
    const dispatchResult = await this.notificationOrchestrator.dispatch({
      tenantId: input.tenant.id,
      notificationType: NotificationType.DOCUMENT_SIGNING_INVITATION,
      emailRecipients: [{ email: input.recipientEmail }],
      payload: {
        tenantName: input.tenant.name,
        documentLabel: getSigningDocumentLabel(input.documentType),
        documentNumber: input.documentNumber,
        signingUrl,
        expiresAt: input.session.expiresAt,
        isReplacement: input.resend,
      },
      metadata: {
        orderId: input.session.orderId,
        sessionId: input.session.id,
        documentType: input.documentType,
      },
      idempotencyKey: `signing-invitation:${input.session.id}:${input.session.currentTokenHash}`,
    });

    if (dispatchResult.deliveredChannels.includes(NotificationChannel.EMAIL)) {
      this.appendAuditEvent(input.session, SigningAuditEventType.INVITATION_EMAIL_SENT, {
        recipientEmail: input.recipientEmail,
        documentType: input.documentType,
        signingUrl,
        expiresAt: input.session.expiresAt.toISOString(),
        unsignedDocumentHash: input.unsignedDocumentHash,
        resend: input.resend,
      });
      return null;
    }

    const failure = dispatchResult.failedChannels[0];
    const message = failure
      ? `Signing invitation email delivery failed: ${failure.message}`
      : 'Signing invitation email delivery failed: no notification channel delivered the invitation.';

    this.appendAuditEvent(input.session, SigningAuditEventType.INVITATION_EMAIL_FAILED, {
      recipientEmail: input.recipientEmail,
      documentType: input.documentType,
      signingUrl,
      expiresAt: input.session.expiresAt.toISOString(),
      unsignedDocumentHash: input.unsignedDocumentHash,
      resend: input.resend,
      failureReason: failure?.reason ?? 'NO_CHANNEL_DELIVERED',
      failureMessage: failure?.message ?? 'No notification channel delivered the invitation.',
    });

    return new SigningInvitationEmailDeliveryFailedError(message);
  }

  private async requirePublicSessionByRawToken(rawToken: string): Promise<SigningSession> {
    const normalizedToken = rawToken.trim();
    if (normalizedToken.length === 0) {
      throw new SigningSessionTokenNotFoundError();
    }

    const session = await this.signingSessionRepository.loadByTokenHash(hashString(normalizedToken));
    if (!session) {
      throw new SigningSessionTokenNotFoundError();
    }

    const now = new Date();
    if (session.expiresAt.getTime() <= now.getTime()) {
      if (
        session.currentStatus === SigningSessionStatus.PENDING ||
        session.currentStatus === SigningSessionStatus.OPENED
      ) {
        this.appendAuditEvent(session, SigningAuditEventType.SESSION_EXPIRED, {
          expiredAt: now.toISOString(),
          previousStatus: session.currentStatus,
        });

        const expireResult = session.expire(now);
        if (expireResult.isErr()) {
          throw expireResult.error;
        }

        await this.signingSessionRepository.save(session);
      }

      throw new SigningSessionExpiredError(session.id);
    }

    if (session.currentStatus === SigningSessionStatus.EXPIRED) {
      throw new SigningSessionExpiredError(session.id);
    }

    if (
      session.currentStatus === SigningSessionStatus.SIGNED ||
      session.currentStatus === SigningSessionStatus.VOIDED
    ) {
      throw new SigningSessionUnavailableError(session.id, session.currentStatus);
    }

    return session;
  }

  private requireUnsignedArtifact(session: SigningSession): SigningArtifactMetadata {
    const artifact = session.getArtifacts().find((candidate) => candidate.kind === SigningArtifactKind.UNSIGNED_PDF);
    if (!artifact) {
      throw new UnsignedSigningArtifactNotFoundError(session.id);
    }

    return artifact;
  }

  private appendAuditEvent(session: SigningSession, type: SigningAuditEventType, payload: SigningAuditPayload): void {
    const auditEvents = session.getAuditEvents();
    const previousHash = auditEvents[auditEvents.length - 1]?.currentHash ?? null;
    const sequence = auditEvents.length + 1;
    const occurredAt = new Date();
    const currentHash = hashAuditRecord({
      sessionId: session.id,
      sequence,
      type,
      occurredAt: occurredAt.toISOString(),
      previousHash,
      payload,
    });

    const addAuditEventResult = session.addAuditEvent(
      SigningAuditEvent.create({
        sessionId: session.id,
        sequence,
        type,
        payload,
        occurredAt,
        previousHash,
        currentHash,
      }),
    );

    if (addAuditEventResult.isErr()) {
      throw addAuditEventResult.error;
    }
  }
}

function buildUnsignedArtifactObjectKey(props: {
  tenantId: string;
  orderId: string;
  sessionId: string;
  fileName: string;
}): string {
  return `signing/${props.tenantId}/orders/${props.orderId}/sessions/${props.sessionId}/unsigned/${props.fileName}.pdf`;
}

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashAuditRecord(input: {
  sessionId: string;
  sequence: number;
  type: SigningAuditEventType;
  occurredAt: string;
  previousHash: string | null;
  payload: SigningAuditPayload;
}): string {
  return hashString(JSON.stringify(input));
}

function generateRawSigningToken(): string {
  return randomBytes(32).toString('hex');
}

function normalizeRecipientEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function buildPortalSigningUrl(tenant: TenantContext, rootDomain: string, rawToken: string): string {
  const hostname = tenant.customDomain ?? `${tenant.slug}.${rootDomain}`;
  return `https://${hostname}/signing?token=${encodeURIComponent(rawToken)}`;
}

function getSigningDocumentLabel(documentType: SigningDocumentType): string {
  switch (documentType) {
    case SigningDocumentType.RENTAL_AGREEMENT:
      return 'acuerdo de alquiler';
    default:
      return 'documento';
  }
}
