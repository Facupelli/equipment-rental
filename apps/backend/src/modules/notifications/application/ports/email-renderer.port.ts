import { NotificationType } from '../../domain/notification-type.enum';

export interface PasswordResetEmailPayload {
  resetUrl: string;
  recipientName?: string;
  tenantName?: string;
  expiresAt?: Date;
}

export interface NotificationEmailPayloadMap {
  [NotificationType.PASSWORD_RESET]: PasswordResetEmailPayload;
}

export type RenderEmailInput<T extends NotificationType = NotificationType> = {
  notificationType: T;
  tenantId: string;
  payload: NotificationEmailPayloadMap[T];
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export abstract class EmailRenderer {
  abstract render<T extends NotificationType>(input: RenderEmailInput<T>): Promise<RenderedEmail>;
}
