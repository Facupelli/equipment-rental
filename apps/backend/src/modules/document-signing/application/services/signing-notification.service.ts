import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '@repo/schemas';

import { Env } from 'src/config/env.schema';
import { SigningDocumentType } from 'src/generated/prisma/client';
import { NotificationOrchestrator } from 'src/modules/notifications/application/notification-orchestrator.service';
import { NotificationChannel } from 'src/modules/notifications/domain/notification-channel.enum';
import { NotificationType } from 'src/modules/notifications/domain/notification-type.enum';

import { SigningInvitationEmailDeliveryFailedError } from '../../domain/errors/document-signing.errors';
import { AcceptPublicSigningResult } from '../commands/accept-public-signing-session/accept-public-signing-session.contract';

export type SigningInvitationDeliveryResult =
  | {
      signingUrl: string;
      delivered: true;
      failureReason: null;
      failureMessage: null;
      deliveryError: null;
    }
  | {
      signingUrl: string;
      delivered: false;
      failureReason: string;
      failureMessage: string;
      deliveryError: SigningInvitationEmailDeliveryFailedError;
    };

export type SigningFinalCopyDeliveryResult = {
  downloadUrl: string;
  status: AcceptPublicSigningResult['finalCopyDelivery']['status'];
  failureReason: string | null;
  failureMessage: string | null;
};

@Injectable()
export class SigningNotificationService {
  private readonly rootDomain: string;

  constructor(
    private readonly notificationOrchestrator: NotificationOrchestrator,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.rootDomain = this.configService.get('ROOT_DOMAIN');
  }

  async sendInvitation(input: {
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
  }): Promise<SigningInvitationDeliveryResult> {
    const signingUrl = this.buildPortalSigningUrl(input.tenant, input.rawToken);
    const dispatchResult = await this.notificationOrchestrator.dispatch({
      tenantId: input.tenant.id,
      notificationType: NotificationType.DOCUMENT_SIGNING_INVITATION,
      emailRecipients: [{ email: input.recipientEmail }],
      payload: {
        tenantName: input.tenant.name,
        documentLabel: this.getSigningDocumentLabel(input.documentType),
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
        failureReason: null,
        failureMessage: null,
        deliveryError: null,
      };
    }

    const failure = dispatchResult.failedChannels[0];
    const failureReason = failure?.reason ?? 'NO_CHANNEL_DELIVERED';
    const failureMessage = failure?.message ?? 'No notification channel delivered the invitation.';
    const message = failure
      ? `Signing invitation email delivery failed: ${failure.message}`
      : 'Signing invitation email delivery failed: no notification channel delivered the invitation.';

    return {
      signingUrl,
      delivered: false,
      failureReason,
      failureMessage,
      deliveryError: new SigningInvitationEmailDeliveryFailedError(message),
    };
  }

  async sendFinalCopy(input: {
    tenant: TenantContext;
    orderId: string;
    sessionId: string;
    documentType: SigningDocumentType;
    documentNumber: string;
    rawToken: string;
    finalCopyTokenHash: string | null;
    recipientEmail: string;
    expiresAt: Date;
  }): Promise<SigningFinalCopyDeliveryResult> {
    const downloadUrl = this.buildFinalCopyDownloadUrl(input.tenant, input.rawToken);
    const dispatchResult = await this.notificationOrchestrator.dispatch({
      tenantId: input.tenant.id,
      notificationType: NotificationType.DOCUMENT_SIGNING_FINAL_COPY,
      emailRecipients: [{ email: input.recipientEmail }],
      payload: {
        tenantName: input.tenant.name,
        documentLabel: this.getSigningDocumentLabel(input.documentType),
        documentNumber: input.documentNumber,
        downloadUrl,
        expiresAt: input.expiresAt,
      },
      metadata: {
        orderId: input.orderId,
        sessionId: input.sessionId,
        documentType: input.documentType,
      },
      idempotencyKey: `final-copy:${input.sessionId}:${input.finalCopyTokenHash}`,
    });

    if (dispatchResult.deliveredChannels.includes(NotificationChannel.EMAIL)) {
      return {
        downloadUrl,
        status: 'SENT',
        failureReason: null,
        failureMessage: null,
      };
    }

    const failure = dispatchResult.failedChannels[0];

    return {
      downloadUrl,
      status: 'FAILED',
      failureReason: failure?.reason ?? 'NO_CHANNEL_DELIVERED',
      failureMessage: failure?.message ?? 'No notification channel delivered the final copy email.',
    };
  }

  private buildPortalSigningUrl(tenant: TenantContext, rawToken: string): string {
    const hostname = tenant.customDomain ?? `${tenant.slug}.${this.rootDomain}`;
    return `https://${hostname}/signing?token=${encodeURIComponent(rawToken)}`;
  }

  private buildFinalCopyDownloadUrl(tenant: TenantContext, rawToken: string): string {
    const hostname = tenant.customDomain ?? `${tenant.slug}.${this.rootDomain}`;
    return `https://${hostname}/document-signing/public/final-copy/download?token=${encodeURIComponent(rawToken)}`;
  }

  private getSigningDocumentLabel(documentType: SigningDocumentType): string {
    switch (documentType) {
      case SigningDocumentType.RENTAL_AGREEMENT:
        return 'acuerdo de alquiler';
      default:
        return 'documento';
    }
  }
}
