import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

import { AcceptPublicSigningSessionHttpController } from './application/commands/accept-public-signing-session/accept-public-signing-session.http.controller';
import { AcceptPublicSigningSessionService } from './application/commands/accept-public-signing-session/accept-public-signing-session.service';
import { DocumentSigningFacade } from './application/document-signing.facade';
import { SendSigningInvitationHttpController } from './application/commands/send-signing-invitation/send-signing-invitation.http.controller';
import { SendSigningInvitationService } from './application/commands/send-signing-invitation/send-signing-invitation.service';
import { GetFinalSignedCopyHttpController } from './application/queries/get-final-signed-copy/get-final-signed-copy.http.controller';
import { GetPublicSigningSessionHttpController } from './application/queries/get-public-signing-session/get-public-signing-session.http.controller';
import { DocumentSigningPublicApi } from './document-signing.public-api';

import { SigningSessionRepository } from './infrastructure/persistence/repositories/signing-session.repository';

@Module({
  imports: [ObjectStorageModule, NotificationsModule],
  controllers: [
    SendSigningInvitationHttpController,
    GetFinalSignedCopyHttpController,
    GetPublicSigningSessionHttpController,
    AcceptPublicSigningSessionHttpController,
  ],
  providers: [
    SigningSessionRepository,
    DocumentSigningFacade,
    AcceptPublicSigningSessionService,
    SendSigningInvitationService,
    { provide: DocumentSigningPublicApi, useExisting: DocumentSigningFacade },
  ],
  exports: [DocumentSigningPublicApi],
})
export class DocumentSigningModule {}
