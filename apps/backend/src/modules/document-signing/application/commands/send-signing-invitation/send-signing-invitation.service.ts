import { createHash, randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { TenantContext } from '@repo/schemas';
import { Result, err, ok } from 'neverthrow';

import { Env } from 'src/config/env.schema';
import { SigningArtifactKind, SigningAuditEventType } from 'src/generated/prisma/client';
import { PrepareOrderAgreementForSigningQuery } from 'src/modules/order/public/queries/prepare-order-agreement-for-signing.query';
import { OrderAgreementForSigningReadModel } from 'src/modules/order/public/read-models/order-agreement-for-signing.read-model';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';
import {
  SigningInvitationEmailDeliveryFailedError,
  SigningInvitationCustomerProfileMissingError,
  SigningInvitationOrderNotFoundError,
  SigningInvitationOrderNotReadyError,
  SigningInvitationRecipientEmailRequiredError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';
import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import { SigningSessionRepository } from 'src/modules/document-signing/infrastructure/persistence/repositories/signing-session.repository';

import { PublicSigningSessionLoader } from '../../public-signing-session.loader';
import { SigningAuditAppender } from '../../signing-audit-appender.service';
import { SigningArtifactStorageService } from '../../services/signing-artifact-storage.service';
import { SigningNotificationService } from '../../services/signing-notification.service';
import { SendSigningInvitationCommand } from './send-signing-invitation.command';
import { SendSigningInvitationInput, SendSigningInvitationResult } from './send-signing-invitation.contract';

export type SendSigningInvitationCommandError =
  | SigningInvitationCustomerProfileMissingError
  | SigningInvitationOrderNotFoundError
  | SigningInvitationOrderNotReadyError
  | SigningInvitationRecipientEmailRequiredError
  | SigningInvitationEmailDeliveryFailedError;

type PrepareOrderAgreementForSigningResult = Result<OrderAgreementForSigningReadModel, Error>;

@Injectable()
@CommandHandler(SendSigningInvitationCommand)
export class SendSigningInvitationService implements ICommandHandler<
  SendSigningInvitationCommand,
  Result<SendSigningInvitationResult, SendSigningInvitationCommandError>
> {
  private readonly signingSessionTtlSeconds: number;

  constructor(
    private readonly signingSessionRepository: SigningSessionRepository,
    private readonly signingAuditAppender: SigningAuditAppender,
    private readonly signingArtifactStorageService: SigningArtifactStorageService,
    private readonly signingNotificationService: SigningNotificationService,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService<Env, true>,
    private readonly publicSigningSessionLoader: PublicSigningSessionLoader,
  ) {
    this.signingSessionTtlSeconds = this.configService.get('DOCUMENT_SIGNING_SESSION_TTL_SECONDS');
  }

  async execute(
    command: SendSigningInvitationCommand,
  ): Promise<Result<SendSigningInvitationResult, SendSigningInvitationCommandError>> {
    const input: SendSigningInvitationInput = {
      tenantId: command.tenantId,
      orderId: command.orderId,
      documentType: command.documentType,
      recipientEmail: command.recipientEmail,
    };

    const preparedOrder = await this.queryBus.execute<
      PrepareOrderAgreementForSigningQuery,
      PrepareOrderAgreementForSigningResult
    >(new PrepareOrderAgreementForSigningQuery(input.tenantId, input.orderId));

    if (preparedOrder.isErr()) {
      return err(translatePrepareOrderAgreementForSigningError(input.orderId, preparedOrder.error));
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
        const activeSession = await this.publicSigningSessionLoader.loadActiveReusableSession(
          input.tenantId,
          input.orderId,
          input.documentType,
          now,
          tx,
        );

        if (activeSession && activeSession.currentUnsignedDocumentHash === unsignedDocumentHash) {
          activeSession.refreshInvitation({ recipientEmail, tokenHash }, now);
          this.signingAuditAppender.append(activeSession, SigningAuditEventType.INVITATION_EMAIL_REQUESTED, {
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
          this.signingAuditAppender.append(activeSession, SigningAuditEventType.SESSION_VOIDED, {
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

        this.signingAuditAppender.append(session, SigningAuditEventType.INVITATION_EMAIL_REQUESTED, {
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

    const deliveryResult = await this.signingNotificationService.sendInvitation({
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
      this.signingAuditAppender.append(session, SigningAuditEventType.INVITATION_EMAIL_SENT, {
        recipientEmail,
        documentType: input.documentType,
        signingUrl: deliveryResult.signingUrl,
        expiresAt: sessionResult.expiresAt.toISOString(),
        unsignedDocumentHash: sessionResult.unsignedDocumentHash,
        resend: sessionResult.reusedExistingSession,
      });
    } else {
      this.signingAuditAppender.append(session, SigningAuditEventType.INVITATION_EMAIL_FAILED, {
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

  private async createSessionForPreparedDocument(input: {
    tenantId: string;
    orderId: string;
    customerId: string | null;
    documentType: SendSigningInvitationInput['documentType'];
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

    const storage = await this.signingArtifactStorageService.storeUnsignedArtifact({
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

    this.signingAuditAppender.append(session, SigningAuditEventType.SESSION_CREATED, {
      documentType: input.documentType,
      recipientEmail: input.recipientEmail,
      expiresAt: input.expiresAt.toISOString(),
      unsignedDocumentHash,
    });
    this.signingAuditAppender.append(session, SigningAuditEventType.ARTIFACT_RECORDED, {
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
}

function translatePrepareOrderAgreementForSigningError(
  orderId: string,
  error: Error,
): SendSigningInvitationCommandError {
  switch (error.constructor.name) {
    case 'ContractCustomerProfileMissingError':
      return new SigningInvitationCustomerProfileMissingError(error.message);
    case 'OrderNotFoundError':
      return new SigningInvitationOrderNotFoundError(orderId);
    case 'OrderSigningAllowedOnlyForConfirmedOrdersError':
      return new SigningInvitationOrderNotReadyError(error.message);
    default:
      throw error;
  }
}

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function generateRawSigningToken(): string {
  return randomBytes(32).toString('hex');
}

function normalizeRecipientEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}
