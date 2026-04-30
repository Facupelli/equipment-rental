import { createHash, randomBytes } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { TenantContext } from '@repo/schemas';
import { Result, err, ok } from 'neverthrow';

import { Env } from 'src/config/env.schema';
import { SigningArtifactKind, SigningAuditEventType, SigningSessionStatus } from 'src/generated/prisma/client';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';
import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import {
  SignedOrderAgreementRenderingFailedError,
  SigningAcceptanceConfirmationRequiredError,
  SigningSessionExpiredError,
  SigningSessionTokenNotFoundError,
  SigningSessionUnavailableError,
  UnsignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';
import { SigningSessionRepository } from 'src/modules/document-signing/infrastructure/persistence/repositories/signing-session.repository';

import { FinalSignedCopyGenerator } from '../../services/final-signed-copy-generator.service';
import { PublicSigningSessionLoader } from '../../public-signing-session.loader';
import { SigningAuditAppender } from '../../signing-audit-appender.service';
import { SigningNotificationService } from '../../services/signing-notification.service';
import { AcceptPublicSigningSessionCommand } from './accept-public-signing-session.command';
import {
  AcceptPublicSigningError,
  AcceptPublicSigningInput,
  AcceptPublicSigningResult,
} from './accept-public-signing-session.contract';

const SIGNING_ACCEPTANCE_CHANNEL = 'email_link' as const;
const FINAL_COPY_EMAIL_REQUESTED_EVENT = 'FINAL_COPY_EMAIL_REQUESTED' as SigningAuditEventType;
const FINAL_COPY_EMAIL_SENT_EVENT = 'FINAL_COPY_EMAIL_SENT' as SigningAuditEventType;
const FINAL_COPY_EMAIL_FAILED_EVENT = 'FINAL_COPY_EMAIL_FAILED' as SigningAuditEventType;

@Injectable()
@CommandHandler(AcceptPublicSigningSessionCommand)
export class AcceptPublicSigningSessionService implements ICommandHandler<
  AcceptPublicSigningSessionCommand,
  Result<AcceptPublicSigningResult, AcceptPublicSigningError>
> {
  private readonly signingSessionTtlSeconds: number;

  constructor(
    private readonly signingSessionRepository: SigningSessionRepository,
    private readonly signingAuditAppender: SigningAuditAppender,
    private readonly signingNotificationService: SigningNotificationService,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService<Env, true>,
    private readonly publicSigningSessionLoader: PublicSigningSessionLoader,
    private readonly finalSignedCopyGenerator: FinalSignedCopyGenerator,
  ) {
    this.signingSessionTtlSeconds = this.configService.get('DOCUMENT_SIGNING_SESSION_TTL_SECONDS');
  }

  async execute(
    command: AcceptPublicSigningSessionCommand,
  ): Promise<Result<AcceptPublicSigningResult, AcceptPublicSigningError>> {
    const input: AcceptPublicSigningInput = {
      rawToken: command.rawToken,
      declaredFullName: command.declaredFullName,
      declaredDocumentNumber: command.declaredDocumentNumber,
      acceptanceTextVersion: command.acceptanceTextVersion,
      accepted: command.accepted,
    };

    if (!input.accepted) {
      return err(new SigningAcceptanceConfirmationRequiredError());
    }

    let session: SigningSession;
    try {
      session = await this.publicSigningSessionLoader.loadRequiredPublicSession(input.rawToken);
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

    this.signingAuditAppender.append(session, SigningAuditEventType.IDENTITY_DECLARED, {
      declaredAt: acceptedAt.toISOString(),
      declaredDocumentNumber,
      declaredFullName,
    });
    this.signingAuditAppender.append(session, SigningAuditEventType.ACCEPTANCE_CONFIRMED, {
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

    this.signingAuditAppender.append(session, SigningAuditEventType.AGREEMENT_HASH_CREATED, {
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

    this.signingAuditAppender.append(session, SigningAuditEventType.SESSION_SIGNED, {
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

    let signedArtifactPackage: { documentNumber: string };
    try {
      signedArtifactPackage = await this.finalSignedCopyGenerator.generate({
        session,
        signedAt: acceptedAt,
        agreementHash,
      });
    } catch (error) {
      if (error instanceof SignedOrderAgreementRenderingFailedError) {
        return err(error);
      }

      throw error;
    }

    const finalCopyRawToken = generateRawSigningToken();
    const finalCopyExpiresAt = new Date(acceptedAt.getTime() + this.signingSessionTtlSeconds * 1000);
    session.issueFinalCopyAccess(
      { tokenHash: hashString(finalCopyRawToken), expiresAt: finalCopyExpiresAt },
      acceptedAt,
    );

    this.signingAuditAppender.append(session, FINAL_COPY_EMAIL_REQUESTED_EVENT, {
      recipientEmail: session.currentRecipientEmail,
      documentNumber: signedArtifactPackage.documentNumber,
      expiresAt: finalCopyExpiresAt.toISOString(),
      sessionReference: session.id,
    });

    await this.signingSessionRepository.save(session);

    const finalCopyDelivery = await this.signingNotificationService.sendFinalCopy({
      tenant,
      orderId: session.orderId,
      sessionId: session.id,
      documentType: session.documentType,
      documentNumber: signedArtifactPackage.documentNumber,
      rawToken: finalCopyRawToken,
      finalCopyTokenHash: session.currentFinalCopyTokenHash,
      recipientEmail: session.currentRecipientEmail,
      expiresAt: finalCopyExpiresAt,
    });

    if (finalCopyDelivery.status === 'SENT') {
      this.signingAuditAppender.append(session, FINAL_COPY_EMAIL_SENT_EVENT, {
        recipientEmail: session.currentRecipientEmail,
        documentType: session.documentType,
        documentNumber: signedArtifactPackage.documentNumber,
        downloadUrl: finalCopyDelivery.downloadUrl,
        expiresAt: finalCopyExpiresAt.toISOString(),
        sessionReference: session.id,
      });
    } else {
      this.signingAuditAppender.append(session, FINAL_COPY_EMAIL_FAILED_EVENT, {
        recipientEmail: session.currentRecipientEmail,
        documentType: session.documentType,
        documentNumber: signedArtifactPackage.documentNumber,
        downloadUrl: finalCopyDelivery.downloadUrl,
        expiresAt: finalCopyExpiresAt.toISOString(),
        sessionReference: session.id,
        failureReason: finalCopyDelivery.failureReason,
        failureMessage: finalCopyDelivery.failureMessage,
      });
    }

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

  async acceptPublicSigningSession(
    input: AcceptPublicSigningInput,
  ): Promise<Result<AcceptPublicSigningResult, AcceptPublicSigningError>> {
    return this.execute(
      new AcceptPublicSigningSessionCommand(
        input.rawToken,
        input.declaredFullName,
        input.declaredDocumentNumber,
        input.acceptanceTextVersion,
        input.accepted,
      ),
    );
  }

  private requireUnsignedArtifact(session: SigningSession): SigningArtifactMetadata {
    const artifact = session.getArtifacts().find((candidate) => candidate.kind === SigningArtifactKind.UNSIGNED_PDF);
    if (!artifact) {
      throw new UnsignedSigningArtifactNotFoundError(session.id);
    }

    return artifact;
  }
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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
