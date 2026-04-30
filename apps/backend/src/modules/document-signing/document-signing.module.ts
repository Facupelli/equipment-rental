import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ObjectStorageModule } from '../object-storage/object-storage.module';

import { AcceptPublicSigningSessionHttpController } from './application/commands/accept-public-signing-session/accept-public-signing-session.http.controller';
import { AcceptPublicSigningSessionService } from './application/commands/accept-public-signing-session/accept-public-signing-session.service';
import { FinalSignedCopyGenerator } from './application/services/final-signed-copy-generator.service';
import { SendSigningInvitationHttpController } from './application/commands/send-signing-invitation/send-signing-invitation.http.controller';
import { SendSigningInvitationService } from './application/commands/send-signing-invitation/send-signing-invitation.service';
import { GetFinalSignedCopyHttpController } from './application/queries/get-final-signed-copy/get-final-signed-copy.http.controller';
import { GetFinalSignedCopyService } from './application/queries/get-final-signed-copy/get-final-signed-copy.service';
import { GetPublicSigningSessionQueryHandler } from './application/queries/get-public-signing-session/get-public-signing-session.query-handler';
import { GetOrderSigningSummaryQueryHandler } from './application/queries/get-order-signing-summary/get-order-signing-summary.query-handler';
import { GetPublicSigningSessionHttpController } from './application/queries/get-public-signing-session/get-public-signing-session.http.controller';
import { ResolvePublicSigningSessionQueryHandler } from './application/queries/resolve-public-signing-session/resolve-public-signing-session.query-handler';
import { PublicSigningSessionLoader } from './application/public-signing-session.loader';
import { SigningAuditAppender } from './application/signing-audit-appender.service';
import { SigningArtifactStorageService } from './application/services/signing-artifact-storage.service';
import { SigningNotificationService } from './application/services/signing-notification.service';
import { StreamPublicUnsignedDocumentService } from './application/services/stream-public-unsigned-document.service';

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
    PublicSigningSessionLoader,
    SigningAuditAppender,
    SigningArtifactStorageService,
    SigningNotificationService,
    FinalSignedCopyGenerator,
    GetFinalSignedCopyService,
    ResolvePublicSigningSessionQueryHandler,
    GetPublicSigningSessionQueryHandler,
    StreamPublicUnsignedDocumentService,
    GetOrderSigningSummaryQueryHandler,
    AcceptPublicSigningSessionService,
    SendSigningInvitationService,
  ],
})
export class DocumentSigningModule {}
