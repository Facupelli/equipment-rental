import { createHash, randomBytes } from 'crypto';
import { Readable } from 'stream';

import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '@repo/schemas';
import { Result, err, ok } from 'neverthrow';

import { Env } from 'src/config/env.schema';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
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
import { RenderSignedOrderAgreementQuery } from 'src/modules/order/public/queries/render-signed-order-agreement.query';
import { PrepareOrderAgreementForSigningQuery } from 'src/modules/order/public/queries/prepare-order-agreement-for-signing.query';
import { OrderAgreementForSigningReadModel } from 'src/modules/order/public/read-models/order-agreement-for-signing.read-model';
import { RenderedOrderAgreementReadModel } from 'src/modules/order/public/read-models/rendered-order-agreement.read-model';

import { SigningArtifactMetadata } from '../domain/entities/signing-artifact-metadata.entity';
import { SigningAuditEvent, SigningAuditPayload } from '../domain/entities/signing-audit-event.entity';
import { SigningSession } from '../domain/entities/signing-session.entity';
import {
  SigningInvitationEmailDeliveryFailedError,
  SigningInvitationRecipientEmailRequiredError,
  SigningAcceptanceConfirmationRequiredError,
  SigningAcceptanceIdentityRequiredError,
  FinalCopyAccessTokenAlreadyUsedError,
  FinalCopyAccessTokenExpiredError,
  FinalCopyAccessTokenNotFoundError,
  SignedSigningArtifactNotFoundError,
  SigningSessionDocumentNotPresentedError,
  SigningSessionExpiredError,
  SigningSessionStatusTransitionNotAllowedError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from '../domain/errors/document-signing.errors';
import { SigningArtifactStorage } from '../domain/value-objects/signing-artifact-storage.value-object';
import { SigningSessionRepository } from '../infrastructure/persistence/repositories/signing-session.repository';

const PDF_CONTENT_TYPE = 'application/pdf';
const SIGNING_ACCEPTANCE_CHANNEL = 'email_link' as const;
const SIGNED_PDF_GENERATED_EVENT = 'SIGNED_PDF_GENERATED' as SigningAuditEventType;
const SIGNED_PDF_STORED_EVENT = 'SIGNED_PDF_STORED' as SigningAuditEventType;
const FINAL_COPY_EMAIL_REQUESTED_EVENT = 'FINAL_COPY_EMAIL_REQUESTED' as SigningAuditEventType;
const FINAL_COPY_EMAIL_SENT_EVENT = 'FINAL_COPY_EMAIL_SENT' as SigningAuditEventType;
const FINAL_COPY_EMAIL_FAILED_EVENT = 'FINAL_COPY_EMAIL_FAILED' as SigningAuditEventType;

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
  | UnsignedSigningArtifactNotFoundError;

type PrepareOrderAgreementForSigningResult = Result<
  OrderAgreementForSigningReadModel,
  ContractCustomerProfileMissingError | OrderNotFoundError | OrderSigningAllowedOnlyForConfirmedOrdersError
>;

@Injectable()
export class DocumentSigningFacade {
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
    const unsignedDocumentHash = hashBuffer(preparedOrder.value.buffer);
    const rawToken = generateRawSigningToken();
    const tokenHash = hashString(rawToken);

    const sessionResult = await this.signingSessionRepository.runWithActiveSessionLock(
      input.tenantId,
      input.orderId,
      input.documentType,
      async (tx) => {
        const activeSession = await this.loadActiveSessionAfterExpiringIfNeeded(
          input.tenantId,
          input.orderId,
          input.documentType,
          now,
          tx,
        );

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

          await this.signingSessionRepository.save(activeSession, tx);

          return {
            sessionId: activeSession.id,
            expiresAt: activeSession.expiresAt,
            tokenHash,
            unsignedDocumentHash,
            reusedExistingSession: true,
          };
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

          await this.signingSessionRepository.save(activeSession, tx);
        }

        const expiresAt = new Date(now.getTime() + this.signingSessionTtlSeconds * 1000);
        const session = await this.createSessionForPreparedDocument({
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
        });

        this.appendAuditEvent(session, SigningAuditEventType.INVITATION_EMAIL_REQUESTED, {
          recipientEmail,
          documentType: input.documentType,
          unsignedDocumentHash,
          expiresAt: session.expiresAt.toISOString(),
          resend: false,
          tokenRotated: false,
        });

        await this.signingSessionRepository.save(session, tx);

        return {
          sessionId: session.id,
          expiresAt: session.expiresAt,
          tokenHash,
          unsignedDocumentHash,
          reusedExistingSession: false,
        };
      },
    );

    const deliveryResult = await this.dispatchInvitationEmail({
      tenant,
      sessionId: sessionResult.sessionId,
      orderId: input.orderId,
      documentType: input.documentType,
      documentNumber: preparedOrder.value.documentNumber,
      rawToken,
      tokenHash: sessionResult.tokenHash,
      recipientEmail,
      expiresAt: sessionResult.expiresAt,
      resend: sessionResult.reusedExistingSession,
    });

    const session = await this.signingSessionRepository.load(sessionResult.sessionId, input.tenantId);

    if (!session) {
      throw new Error(`Signing session '${sessionResult.sessionId}' was not found after creation.`);
    }

    if (deliveryResult.delivered) {
      this.appendAuditEvent(session, SigningAuditEventType.INVITATION_EMAIL_SENT, {
        recipientEmail,
        documentType: input.documentType,
        signingUrl: deliveryResult.signingUrl,
        expiresAt: sessionResult.expiresAt.toISOString(),
        unsignedDocumentHash: sessionResult.unsignedDocumentHash,
        resend: sessionResult.reusedExistingSession,
      });
    } else {
      this.appendAuditEvent(session, SigningAuditEventType.INVITATION_EMAIL_FAILED, {
        recipientEmail,
        documentType: input.documentType,
        signingUrl: deliveryResult.signingUrl,
        expiresAt: sessionResult.expiresAt.toISOString(),
        unsignedDocumentHash: sessionResult.unsignedDocumentHash,
        resend: sessionResult.reusedExistingSession,
        failureReason: deliveryResult.failureReason,
        failureMessage: deliveryResult.failureMessage,
      });
    }

    await this.signingSessionRepository.save(session);

    if (deliveryResult.deliveryError) {
      return err(deliveryResult.deliveryError);
    }

    return ok({
      sessionId: session.id,
      documentNumber: preparedOrder.value.documentNumber,
      recipientEmail,
      expiresAt: session.expiresAt,
      unsignedDocumentHash: sessionResult.unsignedDocumentHash,
      reusedExistingSession: sessionResult.reusedExistingSession,
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

  async acceptPublicSigningSession(
    input: AcceptPublicSigningInput,
  ): Promise<Result<AcceptPublicSigningResult, AcceptPublicSigningError>> {
    if (!input.accepted) {
      return err(new SigningAcceptanceConfirmationRequiredError());
    }

    let session: SigningSession;
    try {
      session = await this.requirePublicSessionByRawToken(input.rawToken);
    } catch (error) {
      if (
        error instanceof SigningSessionTokenNotFoundError ||
        error instanceof SigningSessionExpiredError ||
        error instanceof SigningSessionUnavailableError ||
        error instanceof UnsignedSigningArtifactNotFoundError
      ) {
        return err(error);
      }

      throw error;
    }

    const artifact = this.requireUnsignedArtifact(session);
    const acceptedAt = new Date();
    const declaredFullName = input.declaredFullName.trim();
    const declaredDocumentNumber = input.declaredDocumentNumber.trim();
    const acceptanceTextVersion = input.acceptanceTextVersion.trim();

    this.appendAuditEvent(session, SigningAuditEventType.IDENTITY_DECLARED, {
      declaredAt: acceptedAt.toISOString(),
      declaredDocumentNumber,
      declaredFullName,
    });
    this.appendAuditEvent(session, SigningAuditEventType.ACCEPTANCE_CONFIRMED, {
      accepted: true,
      acceptedAt: acceptedAt.toISOString(),
      acceptanceTextVersion,
      channel: SIGNING_ACCEPTANCE_CHANNEL,
    });

    const agreementHash = hashAgreementRecord({
      acceptedAt: acceptedAt.toISOString(),
      acceptanceTextVersion,
      channel: SIGNING_ACCEPTANCE_CHANNEL,
      declaredDocumentNumber,
      declaredFullName,
      unsignedDocumentHash: artifact.storage.sha256,
    });

    this.appendAuditEvent(session, SigningAuditEventType.AGREEMENT_HASH_CREATED, {
      acceptedAt: acceptedAt.toISOString(),
      acceptanceTextVersion,
      agreementHash,
      channel: SIGNING_ACCEPTANCE_CHANNEL,
      unsignedDocumentHash: artifact.storage.sha256,
    });

    const signResult = session.markSigned({
      signedAt: acceptedAt,
      declaredFullName,
      declaredDocumentNumber,
      acceptanceTextVersion,
      agreementHash,
    });
    if (signResult.isErr()) {
      return err(signResult.error);
    }

    this.appendAuditEvent(session, SigningAuditEventType.SESSION_SIGNED, {
      acceptedAt: acceptedAt.toISOString(),
      agreementHash,
      channel: SIGNING_ACCEPTANCE_CHANNEL,
      unsignedDocumentHash: artifact.storage.sha256,
    });

    const tenant = await this.queryBus.execute<FindTenantByIdQuery, TenantContext | null>(
      new FindTenantByIdQuery(session.tenantId),
    );
    if (!tenant) {
      throw new Error(`Tenant '${session.tenantId}' was not found.`);
    }

    const finalCopy = await this.generateFinalSignedCopy({
      session,
      signedAt: acceptedAt,
      agreementHash,
    });

    await this.signingSessionRepository.save(session);

    const finalCopyDelivery = await this.dispatchFinalCopyEmail({
      tenant,
      session,
      documentType: session.documentType,
      documentNumber: finalCopy.documentNumber,
      rawToken: finalCopy.rawToken,
      recipientEmail: session.currentRecipientEmail,
      expiresAt: finalCopy.expiresAt,
    });

    await this.signingSessionRepository.save(session);

    return ok({
      sessionId: session.id,
      status: SigningSessionStatus.SIGNED,
      acceptedAt,
      agreementHash,
      channel: SIGNING_ACCEPTANCE_CHANNEL,
      finalCopyDelivery,
    });
  }

  async streamFinalSignedCopy(rawToken: string): Promise<PublicSigningDocumentStream> {
    const normalizedToken = rawToken.trim();
    if (normalizedToken.length === 0) {
      throw new FinalCopyAccessTokenNotFoundError();
    }

    const session = await this.signingSessionRepository.loadByFinalCopyTokenHash(hashString(normalizedToken));
    if (!session || !session.currentFinalCopyTokenHash) {
      throw new FinalCopyAccessTokenNotFoundError();
    }

    const now = new Date();
    if (session.currentFinalCopyUsedAt) {
      throw new FinalCopyAccessTokenAlreadyUsedError(session.id);
    }

    if (!session.currentFinalCopyExpiresAt || session.currentFinalCopyExpiresAt.getTime() <= now.getTime()) {
      throw new FinalCopyAccessTokenExpiredError(session.id);
    }

    const artifact = this.requireSignedArtifact(session);
    const stream = await this.objectStorage.getObjectStream({ key: artifact.storage.objectKey });

    session.markFinalCopyAccessUsed(now);
    await this.signingSessionRepository.save(session);

    return {
      fileName: artifact.displayFileName,
      contentType: artifact.storage.contentType,
      contentLength: artifact.storage.byteSize,
      stream,
    };
  }

  private async createSessionForPreparedDocument(input: {
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
  }): Promise<SigningSession> {
    const unsignedDocumentHash = hashBuffer(input.pdfBytes);

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

    return session;
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

  private async recordSignedArtifact(input: {
    tenantId: string;
    orderId: string;
    sessionId: string;
    documentType: SigningDocumentType;
    documentNumber: string;
    fileName: string;
    pdfBytes: Buffer;
    signedDocumentHash: string;
    unsignedArtifactId: string;
    unsignedDocumentHash: string;
    agreementHash: string;
  }): Promise<SigningArtifactStorage> {
    const objectKey = buildSignedArtifactObjectKey({
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
        unsignedArtifactId: input.unsignedArtifactId,
        unsignedDocumentHash: input.unsignedDocumentHash,
        agreementHash: input.agreementHash,
        sha256: input.signedDocumentHash,
      },
    });

    return new SigningArtifactStorage({
      bucket: this.bucketName,
      objectKey,
      contentType: PDF_CONTENT_TYPE,
      byteSize: input.pdfBytes.length,
      sha256: input.signedDocumentHash,
    });
  }

  private async generateFinalSignedCopy(input: {
    session: SigningSession;
    signedAt: Date;
    agreementHash: string;
  }): Promise<{ documentNumber: string; rawToken: string; expiresAt: Date }> {
    const unsignedArtifact = this.requireUnsignedArtifact(input.session);
    const signedAgreementResult = await this.queryBus.execute<
      RenderSignedOrderAgreementQuery,
      Result<
        RenderedOrderAgreementReadModel,
        ContractCustomerProfileMissingError | OrderNotFoundError | OrderSigningAllowedOnlyForConfirmedOrdersError
      >
    >(
      new RenderSignedOrderAgreementQuery(
        input.session.tenantId,
        input.session.orderId,
        input.session.currentDeclaredFullName ?? '',
        input.session.currentDeclaredDocumentNumber ?? '',
        input.session.currentRecipientEmail,
        input.signedAt,
        input.session.id,
      ),
    );
    if (signedAgreementResult.isErr()) {
      throw signedAgreementResult.error;
    }

    const signedPdfBytes = signedAgreementResult.value.buffer;
    const signedFileName = ensurePdfFileName(signedAgreementResult.value.fileName);
    const signedFileNameBase = stripPdfExtension(signedFileName);
    const signedPdfHash = hashBuffer(signedPdfBytes);

    this.appendAuditEvent(input.session, SIGNED_PDF_GENERATED_EVENT, {
      documentNumber: signedAgreementResult.value.documentNumber,
      fileName: signedFileName,
      sourceArtifactId: unsignedArtifact.id,
      sourceDocumentHash: unsignedArtifact.storage.sha256,
      sha256: signedPdfHash,
      signedAt: input.signedAt.toISOString(),
      agreementHash: input.agreementHash,
      sessionReference: input.session.id,
      derivedFromFrozenUnsignedArtifact: true,
    });

    const storage = await this.recordSignedArtifact({
      tenantId: input.session.tenantId,
      orderId: input.session.orderId,
      sessionId: input.session.id,
      documentType: input.session.documentType,
      documentNumber: signedAgreementResult.value.documentNumber,
      fileName: signedFileNameBase,
      pdfBytes: signedPdfBytes,
      signedDocumentHash: signedPdfHash,
      unsignedArtifactId: unsignedArtifact.id,
      unsignedDocumentHash: unsignedArtifact.storage.sha256,
      agreementHash: input.agreementHash,
    });

    const artifact = SigningArtifactMetadata.create({
      sessionId: input.session.id,
      kind: SigningArtifactKind.SIGNED_PDF,
      documentNumber: signedAgreementResult.value.documentNumber,
      displayFileName: signedFileName,
      storage,
    });
    const addArtifactResult = input.session.addArtifact(artifact);
    if (addArtifactResult.isErr()) {
      throw addArtifactResult.error;
    }

    this.appendAuditEvent(input.session, SIGNED_PDF_STORED_EVENT, {
      artifactId: artifact.id,
      documentNumber: artifact.documentNumber,
      fileName: artifact.displayFileName,
      sourceArtifactId: unsignedArtifact.id,
      sourceDocumentHash: unsignedArtifact.storage.sha256,
      bucket: storage.bucket,
      objectKey: storage.objectKey,
      contentType: storage.contentType,
      byteSize: storage.byteSize,
      sha256: storage.sha256,
      agreementHash: input.agreementHash,
      derivedFromFrozenUnsignedArtifact: true,
    });

    const finalCopyRawToken = generateRawSigningToken();
    const finalCopyExpiresAt = new Date(input.signedAt.getTime() + this.signingSessionTtlSeconds * 1000);
    input.session.issueFinalCopyAccess(
      { tokenHash: hashString(finalCopyRawToken), expiresAt: finalCopyExpiresAt },
      input.signedAt,
    );

    this.appendAuditEvent(input.session, FINAL_COPY_EMAIL_REQUESTED_EVENT, {
      recipientEmail: input.session.currentRecipientEmail,
      documentNumber: signedAgreementResult.value.documentNumber,
      expiresAt: finalCopyExpiresAt.toISOString(),
      sessionReference: input.session.id,
    });

    return {
      documentNumber: signedAgreementResult.value.documentNumber,
      rawToken: finalCopyRawToken,
      expiresAt: finalCopyExpiresAt,
    };
  }

  private async loadActiveSessionAfterExpiringIfNeeded(
    tenantId: string,
    orderId: string,
    documentType: SigningDocumentType,
    now: Date,
    tx?: PrismaTransactionClient,
  ): Promise<SigningSession | null> {
    const activeSession = await this.signingSessionRepository.loadActiveByOrderDocumentType(
      tenantId,
      orderId,
      documentType,
      tx,
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

      await this.signingSessionRepository.save(activeSession, tx);
    }

    return null;
  }

  private async dispatchInvitationEmail(input: {
    tenant: TenantContext;
    sessionId: string;
    orderId: string;
    documentType: SigningDocumentType;
    documentNumber: string;
    rawToken: string;
    tokenHash: string;
    recipientEmail: string;
    expiresAt: Date;
    resend: boolean;
  }): Promise<
    | {
        signingUrl: string;
        delivered: true;
        deliveryError: null;
      }
    | {
        signingUrl: string;
        delivered: false;
        failureReason: string;
        failureMessage: string;
        deliveryError: SigningInvitationEmailDeliveryFailedError;
      }
  > {
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
        expiresAt: input.expiresAt,
        isReplacement: input.resend,
      },
      metadata: {
        orderId: input.orderId,
        sessionId: input.sessionId,
        documentType: input.documentType,
      },
      idempotencyKey: `signing-invitation:${input.sessionId}:${input.tokenHash}`,
    });

    if (dispatchResult.deliveredChannels.includes(NotificationChannel.EMAIL)) {
      return {
        signingUrl,
        delivered: true,
        deliveryError: null,
      };
    }

    const failure = dispatchResult.failedChannels[0];
    const message = failure
      ? `Signing invitation email delivery failed: ${failure.message}`
      : 'Signing invitation email delivery failed: no notification channel delivered the invitation.';

    return {
      signingUrl,
      delivered: false,
      failureReason: failure?.reason ?? 'NO_CHANNEL_DELIVERED',
      failureMessage: failure?.message ?? 'No notification channel delivered the invitation.',
      deliveryError: new SigningInvitationEmailDeliveryFailedError(message),
    };
  }

  private async dispatchFinalCopyEmail(input: {
    tenant: TenantContext;
    session: SigningSession;
    documentType: SigningDocumentType;
    documentNumber: string;
    rawToken: string;
    recipientEmail: string;
    expiresAt: Date;
  }): Promise<AcceptPublicSigningResult['finalCopyDelivery']> {
    const downloadUrl = buildFinalCopyDownloadUrl(input.tenant, this.rootDomain, input.rawToken);
    const dispatchResult = await this.notificationOrchestrator.dispatch({
      tenantId: input.tenant.id,
      notificationType: NotificationType.DOCUMENT_SIGNING_FINAL_COPY,
      emailRecipients: [{ email: input.recipientEmail }],
      payload: {
        tenantName: input.tenant.name,
        documentLabel: getSigningDocumentLabel(input.documentType),
        documentNumber: input.documentNumber,
        downloadUrl,
        expiresAt: input.expiresAt,
      },
      metadata: {
        orderId: input.session.orderId,
        sessionId: input.session.id,
        documentType: input.documentType,
      },
      idempotencyKey: `final-copy:${input.session.id}:${input.session.currentFinalCopyTokenHash}`,
    });

    if (dispatchResult.deliveredChannels.includes(NotificationChannel.EMAIL)) {
      this.appendAuditEvent(input.session, FINAL_COPY_EMAIL_SENT_EVENT, {
        recipientEmail: input.recipientEmail,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        downloadUrl,
        expiresAt: input.expiresAt.toISOString(),
        sessionReference: input.session.id,
      });
      return {
        status: 'SENT',
        failureReason: null,
        failureMessage: null,
      };
    }

    const failure = dispatchResult.failedChannels[0];
    const failureReason = failure?.reason ?? 'NO_CHANNEL_DELIVERED';
    const failureMessage = failure?.message ?? 'No notification channel delivered the final copy email.';

    this.appendAuditEvent(input.session, FINAL_COPY_EMAIL_FAILED_EVENT, {
      recipientEmail: input.recipientEmail,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      downloadUrl,
      expiresAt: input.expiresAt.toISOString(),
      sessionReference: input.session.id,
      failureReason,
      failureMessage,
    });

    return {
      status: 'FAILED',
      failureReason,
      failureMessage,
    };
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

  private requireSignedArtifact(session: SigningSession): SigningArtifactMetadata {
    const artifact = session.getArtifacts().find((candidate) => candidate.kind === SigningArtifactKind.SIGNED_PDF);
    if (!artifact) {
      throw new SignedSigningArtifactNotFoundError(session.id);
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
  return `${props.tenantId}/orders/${props.orderId}/sessions/${props.sessionId}/unsigned/${props.fileName}.pdf`;
}

function buildSignedArtifactObjectKey(props: {
  tenantId: string;
  orderId: string;
  sessionId: string;
  fileName: string;
}): string {
  return `${props.tenantId}/orders/${props.orderId}/sessions/${props.sessionId}/signed/${props.fileName}.pdf`;
}

function stripPdfExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith('.pdf') ? fileName.slice(0, -4) : fileName;
}

function ensurePdfFileName(fileName: string): string {
  return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
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
  return hashString(stableStringify(input));
}

function hashAgreementRecord(input: {
  unsignedDocumentHash: string;
  declaredFullName: string;
  declaredDocumentNumber: string;
  acceptanceTextVersion: string;
  acceptedAt: string;
  channel: typeof SIGNING_ACCEPTANCE_CHANNEL;
}): string {
  return hashString(
    stableStringify({
      acceptedAt: input.acceptedAt,
      acceptanceTextVersion: input.acceptanceTextVersion,
      channel: input.channel,
      declaredDocumentNumber: input.declaredDocumentNumber,
      declaredFullName: input.declaredFullName,
      unsignedDocumentHash: input.unsignedDocumentHash,
    }),
  );
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

function buildFinalCopyDownloadUrl(tenant: TenantContext, rootDomain: string, rawToken: string): string {
  const hostname = tenant.customDomain ?? `${tenant.slug}.${rootDomain}`;
  return `https://${hostname}/document-signing/public/final-copy/download?token=${encodeURIComponent(rawToken)}`;
}

function getSigningDocumentLabel(documentType: SigningDocumentType): string {
  switch (documentType) {
    case SigningDocumentType.RENTAL_AGREEMENT:
      return 'acuerdo de alquiler';
    default:
      return 'documento';
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);

  return `{${entries.join(',')}}`;
}
