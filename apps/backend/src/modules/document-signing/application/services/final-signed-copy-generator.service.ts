import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Result } from 'neverthrow';

import { SigningArtifactKind, SigningAuditEventType } from 'src/generated/prisma/client';
import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import {
  SignedOrderAgreementRenderingFailedError,
  UnsignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';
import { RenderSignedOrderAgreementQuery } from 'src/modules/order/public/queries/render-signed-order-agreement.query';
import { RenderedOrderAgreementReadModel } from 'src/modules/order/public/read-models/rendered-order-agreement.read-model';

import { SigningAuditAppender } from '../signing-audit-appender.service';
import { SigningArtifactStorageService } from './signing-artifact-storage.service';

const SIGNED_PDF_GENERATED_EVENT = 'SIGNED_PDF_GENERATED' as SigningAuditEventType;
const SIGNED_PDF_STORED_EVENT = 'SIGNED_PDF_STORED' as SigningAuditEventType;

@Injectable()
export class FinalSignedCopyGenerator {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly signingArtifactStorageService: SigningArtifactStorageService,
    private readonly signingAuditAppender: SigningAuditAppender,
  ) {}

  async generate(input: {
    session: SigningSession;
    signedAt: Date;
    agreementHash: string;
  }): Promise<{ documentNumber: string }> {
    const unsignedArtifact = this.requireUnsignedArtifact(input.session);
    const signedAgreementResult = await this.queryBus.execute<
      RenderSignedOrderAgreementQuery,
      Result<RenderedOrderAgreementReadModel, Error>
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
      throw translateRenderSignedOrderAgreementError(input.session.orderId, signedAgreementResult.error);
    }

    const signedPdfBytes = signedAgreementResult.value.buffer;
    const signedFileName = ensurePdfFileName(signedAgreementResult.value.fileName);
    const signedFileNameBase = stripPdfExtension(signedFileName);
    const signedPdfHash = hashBuffer(signedPdfBytes);

    this.signingAuditAppender.append(input.session, SIGNED_PDF_GENERATED_EVENT, {
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

    const storage = await this.signingArtifactStorageService.storeSignedArtifact({
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

    this.signingAuditAppender.append(input.session, SIGNED_PDF_STORED_EVENT, {
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

    return {
      documentNumber: signedAgreementResult.value.documentNumber,
    };
  }

  private requireUnsignedArtifact(session: SigningSession): SigningArtifactMetadata {
    const artifact = session.getArtifacts().find((candidate) => candidate.kind === SigningArtifactKind.UNSIGNED_PDF);
    if (!artifact) {
      throw new UnsignedSigningArtifactNotFoundError(session.id);
    }

    return artifact;
  }
}

function stripPdfExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith('.pdf') ? fileName.slice(0, -4) : fileName;
}

function ensurePdfFileName(fileName: string): string {
  return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
}

function translateRenderSignedOrderAgreementError(
  orderId: string,
  error: Error,
): SignedOrderAgreementRenderingFailedError {
  switch (error.constructor.name) {
    case 'ContractCustomerProfileMissingError':
    case 'OrderNotFoundError':
    case 'OrderSigningAllowedOnlyForConfirmedOrdersError':
      return new SignedOrderAgreementRenderingFailedError(orderId);
    default:
      throw error;
  }
}

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
