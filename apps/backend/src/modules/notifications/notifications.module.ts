import { Module } from '@nestjs/common';

import { EmailDeliveryPort } from './application/ports/email-delivery.port';
import { EmailRenderer } from './application/ports/email-renderer.port';
import { EmailSenderResolver } from './application/ports/email-sender.resolver';
import { NotificationOrchestrator } from './application/notification-orchestrator.service';
import { NotificationChannelPolicyResolver } from './application/notification-channel-policy.resolver';
import { ResendEmailDeliveryAdapter } from './infrastructure/delivery/resend-email-delivery.adapter';
import { CodeBasedEmailRendererService } from './infrastructure/rendering/code-based-email-renderer.service';
import { PlatformEmailSenderResolver } from './infrastructure/sender/platform-email-sender.resolver';

@Module({
  providers: [
    NotificationOrchestrator,
    NotificationChannelPolicyResolver,
    CodeBasedEmailRendererService,
    ResendEmailDeliveryAdapter,
    PlatformEmailSenderResolver,
    { provide: EmailRenderer, useExisting: CodeBasedEmailRendererService },
    { provide: EmailDeliveryPort, useExisting: ResendEmailDeliveryAdapter },
    { provide: EmailSenderResolver, useExisting: PlatformEmailSenderResolver },
  ],
  exports: [NotificationOrchestrator, NotificationChannelPolicyResolver, EmailRenderer, EmailDeliveryPort],
})
export class NotificationsModule {}
