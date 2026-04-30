import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from 'src/config/env.schema';
import { SigningDocumentType } from 'src/generated/prisma/client';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';

import { SigningArtifactStorage } from '../../domain/value-objects/signing-artifact-storage.value-object';

const PDF_CONTENT_TYPE = 'application/pdf';

@Injectable()
export class SigningArtifactStorageService {
  private readonly bucketName: string;

  constructor(
    private readonly objectStorage: ObjectStoragePort,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.bucketName = this.configService.get('R2_BUCKET_NAME');
  }

  async storeUnsignedArtifact(input: {
    tenantId: string;
    orderId: string;
    sessionId: string;
    documentType: SigningDocumentType;
    documentNumber: string;
    fileName: string;
    pdfBytes: Buffer;
    unsignedDocumentHash: string;
  }): Promise<SigningArtifactStorage> {
    const objectKey = `${input.tenantId}/orders/${input.orderId}/sessions/${input.sessionId}/unsigned/${input.fileName}.pdf`;

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

  async storeSignedArtifact(input: {
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
    const objectKey = `${input.tenantId}/orders/${input.orderId}/sessions/${input.sessionId}/signed/${input.fileName}.pdf`;

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
}
