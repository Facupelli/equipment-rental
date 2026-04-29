import { Injectable } from '@nestjs/common';

import {
  EmailRenderer,
  NotificationEmailPayloadMap,
  RenderEmailInput,
  RenderedEmail,
} from '../../application/ports/email-renderer.port';
import { NotificationType } from '../../domain/notification-type.enum';
import { renderOrderCreatedConfirmationEmailTemplate } from './templates/order-created-confirmation-email.template';
import { renderOrderCreatedByCustomerEmailTemplate } from './templates/order-created-by-customer-email.template';
import { renderOrderCancelledEmailTemplate } from './templates/order-cancelled-email.template';
import { renderDocumentSigningInvitationEmailTemplate } from './templates/document-signing-invitation-email.template';
import { renderDocumentSigningFinalCopyEmailTemplate } from './templates/document-signing-final-copy-email.template';
import { renderPasswordResetEmailTemplate } from './templates/password-reset-email.template';

const emailTemplateRenderers: {
  [T in NotificationType]: (payload: NotificationEmailPayloadMap[T]) => Promise<RenderedEmail> | RenderedEmail;
} = {
  [NotificationType.ORDER_CREATED_CONFIRMATION]: renderOrderCreatedConfirmationEmailTemplate,
  [NotificationType.ORDER_CREATED_BY_CUSTOMER]: renderOrderCreatedByCustomerEmailTemplate,
  [NotificationType.ORDER_CANCELLED]: renderOrderCancelledEmailTemplate,
  [NotificationType.DOCUMENT_SIGNING_INVITATION]: renderDocumentSigningInvitationEmailTemplate,
  [NotificationType.DOCUMENT_SIGNING_FINAL_COPY]: renderDocumentSigningFinalCopyEmailTemplate,
  [NotificationType.PASSWORD_RESET]: renderPasswordResetEmailTemplate,
};

@Injectable()
export class CodeBasedEmailRendererService implements EmailRenderer {
  async render<T extends NotificationType>(input: RenderEmailInput<T>): Promise<RenderedEmail> {
    const renderTemplate = emailTemplateRenderers[input.notificationType];

    return await renderTemplate(input.payload);
  }
}
