import { Module } from '@nestjs/common';

import { ObjectStorageModule } from '../object-storage/object-storage.module';

import { DocumentSigningFacade } from './application/document-signing.facade';
import { DocumentSigningPublicApi } from './document-signing.public-api';

import { SigningSessionRepository } from './infrastructure/persistence/repositories/signing-session.repository';

@Module({
  imports: [ObjectStorageModule],
  providers: [
    SigningSessionRepository,
    DocumentSigningFacade,
    { provide: DocumentSigningPublicApi, useExisting: DocumentSigningFacade },
  ],
  exports: [DocumentSigningPublicApi],
})
export class DocumentSigningModule {}
