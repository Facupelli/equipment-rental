import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

import { DocumentSigningFacade } from './application/document-signing.facade';
import { SendSigningInvitationHttpController } from './application/commands/send-signing-invitation/send-signing-invitation.http.controller';
import { SendSigningInvitationService } from './application/commands/send-signing-invitation/send-signing-invitation.service';
import { DocumentSigningPublicApi } from './document-signing.public-api';

import { SigningSessionRepository } from './infrastructure/persistence/repositories/signing-session.repository';

@Module({
  imports: [ObjectStorageModule, NotificationsModule],
  controllers: [SendSigningInvitationHttpController],
  providers: [
    SigningSessionRepository,
    DocumentSigningFacade,
    SendSigningInvitationService,
    { provide: DocumentSigningPublicApi, useExisting: DocumentSigningFacade },
  ],
  exports: [DocumentSigningPublicApi],
})
export class DocumentSigningModule {}
