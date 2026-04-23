import { Injectable } from '@nestjs/common';

import { EmailRenderer, RenderEmailInput, RenderedEmail } from '../../application/ports/email-renderer.port';
import { NotificationType } from '../../domain/notification-type.enum';
import { renderPasswordResetEmailTemplate } from './templates/password-reset-email.template';

@Injectable()
export class CodeBasedEmailRendererService implements EmailRenderer {
  async render<T extends NotificationType>(input: RenderEmailInput<T>): Promise<RenderedEmail> {
    switch (input.notificationType) {
      case NotificationType.PASSWORD_RESET:
        return renderPasswordResetEmailTemplate(input.payload);
      default:
        throw new Error(`Unsupported email notification type: ${input.notificationType}`);
    }
  }
}
