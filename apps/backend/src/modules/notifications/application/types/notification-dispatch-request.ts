import { EmailRecipient } from '../ports/email-delivery.port';
import { NotificationEmailPayloadMap } from '../ports/email-renderer.port';
import { NotificationType } from '../../domain/notification-type.enum';

export type NotificationDispatchRequest<T extends NotificationType = NotificationType> = {
  tenantId: string;
  notificationType: T;
  emailRecipients: EmailRecipient[];
  payload: NotificationEmailPayloadMap[T];
  metadata?: Record<string, string>;
  idempotencyKey?: string;
};
